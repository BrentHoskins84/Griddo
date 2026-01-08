'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { logger } from '@/utils/logger';

/**
 * Get count of squares sold per player (referred_by) for a contest.
 * Uses JS aggregation - performant since max 100 squares per contest.
 */
export async function getPlayerSalesCounts(contestId: string): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient();

  const { data: squares, error } = await supabase
    .from('squares')
    .select('referred_by')
    .eq('contest_id', contestId)
    .not('referred_by', 'is', null)
    .not('claimant_first_name', 'is', null);

  if (error) {
    logger.error('getPlayerSalesCounts', error, { contestId });
    throw new Error(`Failed to fetch player sales counts: ${error.message}`);
  }

  if (!squares) return {};

  const counts: Record<string, number> = {};
  for (const square of squares) {
    if (square.referred_by) {
      counts[square.referred_by] = (counts[square.referred_by] || 0) + 1;
    }
  }

  return counts;
}

