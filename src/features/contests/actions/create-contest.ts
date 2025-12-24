'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

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

export async function createContest(input: CreateContestInput): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error:', authError);
    return { data: null, error: { message: 'You must be logged in to create a contest' } };
  }

  // Validate input
  const validationResult = createContestSchema.safeParse(input);

  if (!validationResult.success) {
    console.error('Validation error:', validationResult.error);
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
  // Note: sport_type and baseball payout columns require migrations to be applied
  // TODO: After running migrations, add: sport_type, payout_game_1-7_percent
  const { data: contest, error: insertError } = await supabase
    .from('contests')
    .insert({
      owner_id: user.id,
      code,
      slug,
      name: data.name,
      description: data.description || null,
      row_team_name: data.rowTeamName,
      col_team_name: data.colTeamName,
      square_price: data.squarePrice,
      max_squares_per_person: data.maxSquaresPerPerson || null,
      // Football payouts
      payout_q1_percent: data.payoutQ1Percent,
      payout_q2_percent: data.payoutQ2Percent,
      payout_q3_percent: data.payoutQ3Percent,
      payout_final_percent: data.payoutFinalPercent,
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
    console.error('Database error:', insertError);

    // Handle unique constraint violations
    if (insertError.code === '23505') {
      // Retry with new code/slug if collision occurred
      return createContest(input);
    }

    return {
      data: null,
      error: { message: 'Failed to create contest. Please try again.' },
    };
  }

  // Redirect to the new contest's management page
  redirect(`/dashboard/${contest.id}`);
}
