export type QuarterKey = 'q1' | 'q2' | 'q3' | 'final';

export interface QuarterLabel {
  key: QuarterKey;
  label: string;
  dbField: string;
  formField: string;
  color: string;
}

export const FOOTBALL_QUARTER_LABELS: QuarterLabel[] = [
  { key: 'q1', label: 'Q1', dbField: 'payout_q1_percent', formField: 'payoutQ1Percent', color: 'bg-amber-500' },
  { key: 'q2', label: 'Halftime', dbField: 'payout_q2_percent', formField: 'payoutQ2Percent', color: 'bg-orange-500' },
  { key: 'q3', label: 'Q3', dbField: 'payout_q3_percent', formField: 'payoutQ3Percent', color: 'bg-red-500' },
  { key: 'final', label: 'Final', dbField: 'payout_final_percent', formField: 'payoutFinalPercent', color: 'bg-rose-600' },
];

export const PRIZE_TEXT_MAX_LENGTH = 25;

export const TOTAL_SQUARES = 100;

