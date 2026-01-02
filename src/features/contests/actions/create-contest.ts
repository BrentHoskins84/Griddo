'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { logger } from '@/utils/logger';

import { CreateContestInput, createContestSchema } from '../models/contest';

/**
 * Generates a unique 6-character code for sharing contests
 */
function generateContestCode(): string {
  // Use nanoid with custom alphabet (uppercase letters + numbers, no ambiguous chars)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
}

/**
 * Generates a URL-friendly slug from the contest name
 */
function generateSlug(name: string, uniqueId: string): string {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
  // Append a short unique id to ensure uniqueness
  return `${baseSlug}-${uniqueId}`;
}

export async function createContest(input: CreateContestInput, retryCount = 0): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (authError) {
      logger.warn('createContest', 'Authentication failed', { error: authError.message });
    }
    return { data: null, error: { message: 'You must be logged in to create a contest' } };
  }

  // Validate input
  const validationResult = createContestSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      data: null,
      error: {
        message: 'Invalid contest data',
        details: validationResult.error.flatten().fieldErrors,
      },
    };
  }

  const data = validationResult.data;

  // Generate unique code and slug
  const uniqueId = nanoid(6);
  const code = generateContestCode();
  const slug = generateSlug(data.name, uniqueId);

  // Insert contest into database
  const { data: contest, error: insertError } = await supabase
    .from('contests')
    .insert({
      owner_id: user.id,
      code,
      slug,
      name: data.name,
      description: data.description || null,
      sport_type: data.sportType,
      row_team_name: data.rowTeamName,
      col_team_name: data.colTeamName,
      square_price: data.squarePrice,
      max_squares_per_person: data.maxSquaresPerPerson || null,
      // Football payouts
      payout_q1_percent: data.payoutQ1Percent,
      payout_q2_percent: data.payoutQ2Percent,
      payout_q3_percent: data.payoutQ3Percent,
      payout_final_percent: data.payoutFinalPercent,
      // Baseball payouts
      payout_game1_percent: data.payoutGame1Percent,
      payout_game2_percent: data.payoutGame2Percent,
      payout_game3_percent: data.payoutGame3Percent,
      payout_game4_percent: data.payoutGame4Percent,
      payout_game5_percent: data.payoutGame5Percent,
      payout_game6_percent: data.payoutGame6Percent,
      payout_game7_percent: data.payoutGame7Percent,
      hero_image_url: data.heroImageUrl || null,
      org_image_url: data.orgImageUrl || null,
      primary_color: data.primaryColor,
      secondary_color: data.secondaryColor,
      // Access control - only save PIN if requirePin is true
      access_pin: data.requirePin ? data.accessPin : null,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) {
    logger.error('createContest', insertError, {
      code: insertError.code,
      retryCount,
    });

    // Handle unique constraint violations
    if (insertError.code === '23505') {
      if (retryCount >= 3) {
        return { data: null, error: { message: 'Failed to generate unique code. Please try again.' } };
      }
      return createContest(input, retryCount + 1);
    }

    return {
      data: null,
      error: { message: 'Failed to create contest. Please try again.' },
    };
  }

  // Redirect to the new contest's management page
  redirect(`/dashboard/${contest.id}`);
}
