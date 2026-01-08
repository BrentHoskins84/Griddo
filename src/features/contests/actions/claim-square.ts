'use server';

import { z } from 'zod';

import { ContestStatus, PaymentStatus } from '@/features/contests/constants';
import { ContestErrors, MAX_SQUARES_REACHED } from '@/features/contests/constants/error-messages';
import { getPaymentOptionsForContest } from '@/features/contests/queries/get-payment-options';
import { playerSchema } from '@/features/contests/types/player';
import { sendEmailSafe } from '@/features/emails/send-email-safe';
import { squareClaimedEmail } from '@/features/emails/templates/square-claimed-email';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getCurrentISOString } from '@/utils/date-formatters';
import { sanitizeEmail } from '@/utils/email-validator';
import { getURL } from '@/utils/get-url';
import { logger } from '@/utils/logger';
import { checkRateLimit } from '@/utils/rate-limit';

interface ClaimSquareInput {
  squareId: string;
  contestId: string;
  firstName: string;
  lastName: string;
  email: string;
  venmoHandle?: string;
  referredBySlug?: string;
}

/**
 * Claims a square for a participant.
 * Validates availability and per-person limits before claiming.
 */
export async function claimSquare(
  input: ClaimSquareInput
): Promise<ActionResponse<{ square: { id: string; row_index: number; col_index: number } }>> {
  const { squareId, contestId, firstName, lastName, email, venmoHandle, referredBySlug } = input;

  // Validate and sanitize email
  const sanitizedEmail = sanitizeEmail(email);
  if (!sanitizedEmail) {
    return {
      data: null,
      error: { message: 'Invalid email address format' },
    };
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(`claim:${sanitizedEmail}`, { maxRequests: 10, windowMs: 60000 });
  if (!rateLimit.success) {
    return {
      data: null,
      error: { message: 'Too many requests. Please wait a moment and try again.' },
    };
  }
  
  // Validate required fields
  if (!squareId || !contestId || !firstName || !lastName) {
    return {
      data: null,
      error: { message: ContestErrors.ALL_FIELDS_REQUIRED },
    };
  }

  const supabase = await createSupabaseServerClient();

  // Fetch contest to check status and maxSquaresPerPerson
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, status, max_squares_per_person, name, slug, row_team_name, col_team_name, square_price, players')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    logger.error('claimSquare', contestError, { contestId, squareId });
    return {
      data: null,
      error: { message: ContestErrors.NOT_FOUND },
    };
  }

  // Check contest is open for claims
  if (contest.status !== ContestStatus.OPEN) {
    return {
      data: null,
      error: { message: ContestErrors.NOT_OPEN },
    };
  }

  // Fetch square to verify it's available
  const { data: square, error: squareError } = await supabase
    .from('squares')
    .select('id, row_index, col_index, payment_status, contest_id')
    .eq('id', squareId)
    .eq('contest_id', contestId)
    .single();

  if (squareError || !square) {
    logger.error('claimSquare', squareError, { contestId, squareId });
    return {
      data: null,
      error: { message: ContestErrors.SQUARE_NOT_FOUND },
    };
  }

  // Check square is available
  if (square.payment_status !== PaymentStatus.AVAILABLE) {
    return {
      data: null,
      error: { message: ContestErrors.SQUARE_TAKEN },
    };
  }

  // Resolve referredBy from slug if provided
  let referredBy: string | undefined;
  if (referredBySlug && contest.players) {
    const playersResult = z.array(playerSchema).safeParse(contest.players);
    if (playersResult.success) {
      const matchedPlayer = playersResult.data.find(
        (p) => p.slug.toLowerCase() === referredBySlug.toLowerCase()
      );
      if (matchedPlayer) {
        referredBy = matchedPlayer.name;
      }
    } else {
      logger.error('claimSquare', new Error('Invalid players JSONB format'), {
        contestId,
        parseError: playersResult.error.message,
      });
    }
  }

  // Check per-person limit if set
  if (contest.max_squares_per_person) {

    const { count, error: countError } = await supabase
      .from('squares')
      .select('id', { count: 'exact', head: true })
      .eq('contest_id', contestId)
      .ilike('claimant_email', sanitizedEmail)
      .neq('payment_status', PaymentStatus.AVAILABLE);

    if (countError) {
      logger.error('claimSquare', countError, { contestId, email });
      return {
        data: null,
        error: { message: ContestErrors.FAILED_TO_CLAIM },
      };
    }

    if (count !== null && count >= contest.max_squares_per_person) {
      return {
        data: null,
        error: {
          message: MAX_SQUARES_REACHED(contest.max_squares_per_person),
        },
      };
    }
  }

  // Claim the square - update with claimant info
  const { data: updatedSquare, error: updateError } = await supabase
    .from('squares')
    .update({
      claimant_first_name: firstName.trim(),
      claimant_last_name: lastName.trim(),
      claimant_email: sanitizedEmail,
      claimant_venmo: venmoHandle?.trim() || null,
      payment_status: PaymentStatus.PENDING,
      claimed_at: getCurrentISOString(),
      referred_by: referredBy || null,
    })
    .eq('id', squareId)
    .eq('payment_status', PaymentStatus.AVAILABLE) // Ensure still available (race condition protection)
    .select('id, row_index, col_index')
    .single();

  if (updateError) {
    logger.error('claimSquare', updateError, { contestId, squareId });

    // Check if it was a race condition (no rows updated)
    if (updateError.code === 'PGRST116') {
      return {
        data: null,
        error: { message: ContestErrors.RACE_CONDITION },
      };
    }

    return {
      data: null,
      error: { message: ContestErrors.FAILED_TO_CLAIM },
    };
  }

  if (!updatedSquare) {
    // No rows updated - race condition, square was taken
    return {
      data: null,
      error: { message: ContestErrors.RACE_CONDITION },
    };
  }

  // Send confirmation email (don't block on failure)
  const paymentOptions = await getPaymentOptionsForContest(contestId);
  const contestUrl = `${getURL()}/contest/${contest.slug}`;

  sendEmailSafe({
    to: sanitizedEmail,
    template: squareClaimedEmail({
      participantName: firstName,
      contestName: contest.name,
      rowTeamName: contest.row_team_name,
      colTeamName: contest.col_team_name,
      rowIndex: updatedSquare.row_index,
      colIndex: updatedSquare.col_index,
      squarePrice: contest.square_price,
      contestUrl,
      paymentOptions: paymentOptions.map((opt) => ({
        type: opt.type,
        handle: opt.handle_or_link,
        link: opt.handle_or_link.startsWith('http') ? opt.handle_or_link : undefined,
      })),
    }),
    contestId,
    squareId: updatedSquare.id,
    emailType: 'square_claimed',
  });

  return {
    data: {
      square: {
        id: updatedSquare.id,
        row_index: updatedSquare.row_index,
        col_index: updatedSquare.col_index,
      },
    },
    error: null,
  };
}
