import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type Score = Database['public']['Tables']['scores']['Row'];

/**
 * Fetches all scores for a contest with winning square info
 */
export async function getScoresForContest(contestId: string): Promise<Score[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('contest_id', contestId)
    .order('quarter');

  if (error) {
    throw new Error(`Failed to fetch scores: ${error.message}`);
  }

  return data ?? [];
}

