'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

/**
 * Soft deletes a contest by setting deleted_at timestamp.
 * Only the owner can delete their contest.
 */
export async function deleteContest(contestId: string): Promise<ActionResponse<null>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  // Verify user owns the contest
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, owner_id')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    return { data: null, error: { message: 'Contest not found' } };
  }

  if (contest.owner_id !== user.id) {
    return { data: null, error: { message: 'You do not own this contest' } };
  }

  // Soft delete by setting deleted_at
  const { error: deleteError } = await supabase
    .from('contests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contestId)
    .eq('owner_id', user.id);

  if (deleteError) {
    return { data: null, error: { message: `Failed to delete: ${deleteError.message}` } };
  }

  return { data: null, error: null };
}

