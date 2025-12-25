-- Add constraint to ensure football payouts don't exceed 100%
ALTER TABLE contests ADD CONSTRAINT check_football_payout_total
CHECK (
  COALESCE(payout_q1_percent, 0) +
  COALESCE(payout_q2_percent, 0) +
  COALESCE(payout_q3_percent, 0) +
  COALESCE(payout_final_percent, 0) <= 100
);

-- Add constraint to ensure baseball payouts don't exceed 100%
ALTER TABLE contests ADD CONSTRAINT check_baseball_payout_total
CHECK (
  COALESCE(payout_game1_percent, 0) +
  COALESCE(payout_game2_percent, 0) +
  COALESCE(payout_game3_percent, 0) +
  COALESCE(payout_game4_percent, 0) +
  COALESCE(payout_game5_percent, 0) +
  COALESCE(payout_game6_percent, 0) +
  COALESCE(payout_game7_percent, 0) <= 100
);

