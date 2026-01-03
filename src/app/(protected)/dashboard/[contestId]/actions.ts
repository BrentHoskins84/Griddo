'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database, Tables } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

type ContestStatus = Database['public']['Enums']['contest_status'];

export async function updateContestStatus(
  contestId: string,
  targetStatus: ContestStatus
): Promise<ActionResponse<Tables<'contests'>>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  // Get current contest to verify ownership
  const { data: contest, error: fetchError } = await supabase
    .from('contests')
    .select('status, row_numbers')
    .eq('id', contestId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !contest) {
    return { data: null, error: { message: 'Contest not found or access denied' } };
  }

  // Validate transition requirements
  if (targetStatus === 'open') {
    // Check if unlocking from locked - scores must not exist
    if (contest.status === 'locked') {
      const { count: scoresCount } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', contestId);

      if (scoresCount && scoresCount > 0) {
        return { data: null, error: { message: 'Cannot unlock contest after scores have been entered' } };
      }
    }

    // Opening from draft - payment options required
    const { count } = await supabase
      .from('payment_options')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId);

    if (!count || count === 0) {
      return { data: null, error: { message: 'Please add payment options before opening the contest' } };
    }
  }

  if (targetStatus === 'in_progress') {
    if (contest.row_numbers === null) {
      return { data: null, error: { message: 'Please enter numbers before starting the game' } };
    }
  }

  // Build update data - set is_public when opening contest
  const updateData: { status: ContestStatus; is_public?: boolean } = {
    status: targetStatus,
  };

  // Make contest publicly readable when opening (required for RLS to allow anonymous reads)
  // Note: is_public = true allows the page to load; access_pin provides additional security
  if (targetStatus === 'open') {
    updateData.is_public = true;
  }

  // Update contest status
  const { data: updatedContest, error: updateError } = await supabase
    .from('contests')
    .update(updateData)
    .eq('id', contestId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating contest status:', updateError);
    return { data: null, error: { message: 'Failed to update contest status' } };
  }

  return { data: updatedContest, error: null };
}
