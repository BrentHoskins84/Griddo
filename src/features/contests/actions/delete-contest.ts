'use server';

import { ContestErrors } from '@/features/contests/constants/error-messages';
import { ActionResponse } from '@/types/action-response';
import { getCurrentISOString } from '@/utils/date-formatters';
import { logger } from '@/utils/logger';

import { withContestOwnership } from '../middleware/auth-middleware';
/**
 * Soft deletes a contest by setting deleted_at timestamp.
 * Only the owner can delete their contest.
 */
export async function deleteContest(contestId: string): Promise<ActionResponse<null>> {
  return withContestOwnership<null>(contestId, async (user, supabase, contest) => {
    // Check if already deleted
    if (contest.deleted_at) {
      logger.error('deleteContest', new Error('Contest already deleted'), { 
        contestId, 
        deletedAt: contest.deleted_at 
      });
      throw new Error('Contest has already been deleted');
    }

    // Use the database function instead of direct UPDATE
    const { data, error: deleteError } = await supabase
      .rpc('soft_delete_contest', { contest_id: contestId });

    if (deleteError) {
      logger.error('deleteContest', deleteError, {
        contestId,
        errorCode: deleteError.code,
        errorMessage: deleteError.message,
      });
      throw new Error(ContestErrors.FAILED_TO_DELETE);
    }

    if (!data) {
      throw new Error('Failed to delete contest - it may already be deleted');
    }

    return null;
  })();
}
