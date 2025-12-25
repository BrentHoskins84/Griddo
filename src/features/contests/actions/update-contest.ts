'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

type ContestUpdate = Database['public']['Tables']['contests']['Update'];

/**
 * Updates a contest. Only the owner can update their contest.
 */
export async function updateContest(
  contestId: string,
  updates: ContestUpdate
): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
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
    return { data: null, error: { message: `Failed to update contest: ${error.message}` } };
  }

  return { data: { id: data.id }, error: null };
}
