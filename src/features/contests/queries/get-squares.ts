import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/** Partial square data for grid display */
export interface GridSquare {
  id: string;
  row_index: number;
  col_index: number;
  payment_status: 'available' | 'pending' | 'paid';
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  referred_by: string | null;
}

/**
 * Fetches all 100 squares for a contest, ordered by position
 */
export async function getSquaresForContest(contestId: string): Promise<GridSquare[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('squares')
    .select('id, row_index, col_index, payment_status, claimant_first_name, claimant_last_name, referred_by')
    .eq('contest_id', contestId)
    .order('row_index')
    .order('col_index');

  if (error) {
    throw new Error(`Failed to fetch squares: ${error.message}`);
  }

  return data ?? [];
}
