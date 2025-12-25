'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

export async function openContest(contestId: string): Promise<ActionResponse<Tables<'contests'>>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  // Update contest status (RLS will ensure only owner can update)
  const { data: contest, error: updateError } = await supabase
    .from('contests')
    .update({ status: 'open', is_public: true })
    .eq('id', contestId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (updateError) {
    // TODO: Replace with proper error handling
    console.error('Error opening contest:', updateError);
    return { data: null, error: { message: 'Failed to open contest' } };
  }

  return { data: contest, error: null };
}

