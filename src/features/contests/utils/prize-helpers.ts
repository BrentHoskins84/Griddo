import { Database } from '@/libs/supabase/types';

import { ContestPrizeFields } from '../types';

type GameQuarter = Database['public']['Enums']['game_quarter'];

/** @deprecated Use ContestPrizeFields instead */
export type PrizeTexts = Pick<ContestPrizeFields, 'prize_q1_text' | 'prize_q2_text' | 'prize_q3_text' | 'prize_final_text'>;

/**
 * Returns the prize text for a given quarter when prize_type is 'custom', or null otherwise.
 */
export function getPrizeText(
  prizeType: ContestPrizeFields['prize_type'],
  quarter: GameQuarter,
  prizeTexts: ContestPrizeFields
): string | null {
  if (prizeType !== 'custom') return null;

  const prizeMap: Record<GameQuarter, string | null | undefined> = {
    q1: prizeTexts.prize_q1_text,
    q2: prizeTexts.prize_q2_text,
    q3: prizeTexts.prize_q3_text,
    final: prizeTexts.prize_final_text,
  };

  return prizeMap[quarter] ?? null;
}

