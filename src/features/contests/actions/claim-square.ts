'use server';

import { getPaymentOptionsForContest } from '@/features/contests/queries/get-payment-options';
import { sendEmail } from '@/features/emails/send-email';
import { squareClaimedEmail } from '@/features/emails/templates/square-claimed-email';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

interface ClaimSquareInput {
  squareId: string;
  contestId: string;
  firstName: string;
  lastName: string;
  email: string;
  venmoHandle?: string;
}

interface ClaimSquareResponse {
  data: {
    success: boolean;
    square?: {
      id: string;
      row_index: number;
      col_index: number;
    };
  } | null;
  error: { message: string } | null;
}

/**
 * Claims a square for a participant.
 * Validates availability and per-person limits before claiming.
 */
export async function claimSquare(input: ClaimSquareInput): Promise<ClaimSquareResponse> {
  const { squareId, contestId, firstName, lastName, email, venmoHandle } = input;

  // Validate required fields
  if (!squareId || !contestId || !firstName || !lastName || !email) {
    return {
      data: null,
      error: { message: 'All required fields must be provided' },
    };
  }

  const supabase = await createSupabaseServerClient();

  // Fetch contest to check status and maxSquaresPerPerson
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, status, max_squares_per_person, name, slug, row_team_name, col_team_name, square_price')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    // TODO: Replace with proper error handling
    console.error('Error fetching contest:', contestError);
    return {
      data: null,
      error: { message: 'Contest not found' },
    };
  }

  // Check contest is open for claims
  if (contest.status !== 'open') {
    return {
      data: null,
      error: { message: 'This contest is not currently accepting claims' },
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
    // TODO: Replace with proper error handling
    console.error('Error fetching square:', squareError);
    return {
      data: null,
      error: { message: 'Square not found' },
    };
  }

  // Check square is available
  if (square.payment_status !== 'available') {
    return {
      data: { success: false },
      error: { message: 'This square has already been claimed. Please select another.' },
    };
  }

  // Check per-person limit if set
  if (contest.max_squares_per_person) {
    const normalizedEmail = email.toLowerCase().trim();

    const { count, error: countError } = await supabase
      .from('squares')
      .select('id', { count: 'exact', head: true })
      .eq('contest_id', contestId)
      .ilike('claimant_email', normalizedEmail)
      .neq('payment_status', 'available');

    if (countError) {
      // TODO: Replace with proper error handling
      console.error('Error counting squares:', countError);
      return {
        data: null,
        error: { message: 'Failed to verify square limit. Please try again.' },
      };
    }

    if (count !== null && count >= contest.max_squares_per_person) {
      return {
        data: { success: false },
        error: {
          message: `You have already claimed the maximum of ${contest.max_squares_per_person} square${
            contest.max_squares_per_person > 1 ? 's' : ''
          } for this contest.`,
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
      claimant_email: email.toLowerCase().trim(),
      claimant_venmo: venmoHandle?.trim() || null,
      payment_status: 'pending',
      claimed_at: new Date().toISOString(),
    })
    .eq('id', squareId)
    .eq('payment_status', 'available') // Ensure still available (race condition protection)
    .select('id, row_index, col_index')
    .single();

  if (updateError) {
    // TODO: Replace with proper error handling
    console.error('Error claiming square:', updateError);

    // Check if it was a race condition (no rows updated)
    if (updateError.code === 'PGRST116') {
      return {
        data: { success: false },
        error: { message: 'This square was just claimed by someone else. Please select another.' },
      };
    }

    return {
      data: null,
      error: { message: 'Failed to claim square. Please try again.' },
    };
  }

  if (!updatedSquare) {
    // No rows updated - race condition, square was taken
    return {
      data: { success: false },
      error: { message: 'This square was just claimed by someone else. Please select another.' },
    };
  }

  // Send confirmation email (don't block on failure)
  try {
    const paymentOptions = await getPaymentOptionsForContest(contestId);
    const contestUrl = `${getURL()}/contest/${contest.slug}`;

    const { subject, html } = squareClaimedEmail({
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
    });

    await sendEmail({
      to: email,
      subject,
      html,
      contestId,
      squareId: updatedSquare.id,
      emailType: 'square_claimed',
    });
  } catch (emailError) {
    // Log error but don't fail the claim
    console.error('Failed to send square claimed email:', emailError);
  }

  return {
    data: {
      success: true,
      square: {
        id: updatedSquare.id,
        row_index: updatedSquare.row_index,
        col_index: updatedSquare.col_index,
      },
    },
    error: null,
  };
}
