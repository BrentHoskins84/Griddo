'use server';

import { ContestErrors } from '@/features/contests/constants/error-messages';
import { ActionResponse } from '@/types/action-response';
import { getCurrentISOString } from '@/utils/date-formatters';

import { withContestOwnership } from '../middleware/auth-middleware';

/**
 * Soft deletes a contest by setting deleted_at timestamp.
 * Only the owner can delete their contest.
 */
export async function deleteContest(contestId: string): Promise<ActionResponse<null>> {
  return withContestOwnership<null>(contestId, async (user, supabase, contest) => {
    const { error: deleteError } = await supabase
      .from('contests')
      .update({ deleted_at: getCurrentISOString() })
      .eq('id', contestId)
      .eq('owner_id', user.id);

    if (deleteError) {
      throw new Error(ContestErrors.FAILED_TO_DELETE);
    }

    return null;
  })();
}

