'use server';

import { ContestStatus } from '@/features/contests/constants';
import type { Contest, ContestUpdate } from '@/features/contests/types';
import type { Database } from '@/libs/supabase/types';
import type { ActionResponse } from '@/types/action-response';
import { SupabaseClient } from '@supabase/supabase-js';

import { withContestOwnership } from '../middleware/auth-middleware';

type SupabaseDb = SupabaseClient<Database>;

function validateInProgressTransition(contest: Contest): string | null {
  if (!contest.row_numbers || !contest.col_numbers) {
    return 'Please enter numbers before starting the game';
  }
  return null;
}

async function validateOpenTransition(
  supabase: SupabaseDb,
  contest: Contest
): Promise<string | null> {
  // Check if unlocking from locked - scores must not exist
  if (contest.status === ContestStatus.LOCKED) {
    const { count: scoresCount } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contest.id);

    if (scoresCount && scoresCount > 0) {
      return 'Cannot unlock contest after scores have been entered';
    }
  }

  // Opening from draft - payment options required
  const { count } = await supabase
    .from('payment_options')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contest.id);

  if (!count || count === 0) {
    return 'Please add payment options before opening the contest';
  }

  return null;
}

/**
 * Updates a contest. Only the owner can update their contest.
 */
export async function updateContest(
  contestId: string,
  updates: ContestUpdate
): Promise<ActionResponse<{ id: string }>> {
  return withContestOwnership<{ id: string }>(contestId, async (user, supabase, contest) => {
    // Validate status transitions
    if (updates.status === ContestStatus.IN_PROGRESS) {
      const validationError = validateInProgressTransition(contest);
      if (validationError) throw new Error(validationError);
    }

    if (updates.status === ContestStatus.OPEN) {
      const validationError = await validateOpenTransition(supabase, contest);
      if (validationError) throw new Error(validationError);
    }

    // Update contest (RLS ensures only owner can update)
    const { data, error } = await supabase
      .from('contests')
      .update(updates)
      .eq('id', contestId)
      .eq('owner_id', user.id)
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to update contest');
    }

    return { id: data.id };
  })();
}
