import type { Database } from '@/libs/supabase/types';

/**
 * Prize-related fields for a contest.
 * Used by components that need to display prize information.
 */
export interface ContestPrizeFields {
  prize_type?: Database['public']['Enums']['prize_type'];
  prize_q1_text?: string | null;
  prize_q2_text?: string | null;
  prize_q3_text?: string | null;
  prize_final_text?: string | null;
}

