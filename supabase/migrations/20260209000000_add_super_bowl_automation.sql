-- ============================================================================
-- Super Bowl Score Automation
-- Adds tables for automated score tracking, quarter result processing, and admin config
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add is_super_bowl flag to contests
-- ---------------------------------------------------------------------------
ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_super_bowl BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contests_super_bowl ON contests (is_super_bowl) WHERE is_super_bowl = true;

-- ---------------------------------------------------------------------------
-- 2. Super Bowl config (single-row table for admin controls)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS super_bowl_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false NOT NULL,
  game_date DATE NOT NULL DEFAULT '2025-02-09',
  check_start_hour INTEGER DEFAULT 15 NOT NULL, -- 3pm PST (in 24h local time)
  last_checked_at TIMESTAMPTZ,
  last_status TEXT, -- last ESPN game status observed
  last_period INTEGER, -- last ESPN period observed
  game_finished BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default config row
INSERT INTO super_bowl_config (enabled, game_date)
VALUES (false, '2025-02-09')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Quarter results tracking (idempotency - one result per contest per quarter)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS super_bowl_quarter_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  quarter TEXT NOT NULL CHECK (quarter IN ('q1', 'q2', 'q3', 'final')),
  
  -- Score data from ESPN
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  home_last_digit INTEGER NOT NULL,
  away_last_digit INTEGER NOT NULL,
  
  -- Winner info
  winning_square_id UUID REFERENCES squares(id),
  winner_first_name TEXT,
  winner_last_name TEXT,
  winner_email TEXT,
  winner_venmo TEXT,
  
  -- Prize info
  prize_amount DECIMAL(10,2),
  payout_percent INTEGER,
  
  -- Email tracking
  winner_email_sent BOOLEAN DEFAULT false NOT NULL,
  owner_email_sent BOOLEAN DEFAULT false NOT NULL,
  winner_email_sent_at TIMESTAMPTZ,
  owner_email_sent_at TIMESTAMPTZ,
  
  -- Metadata
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(contest_id, quarter)
);

CREATE INDEX IF NOT EXISTS idx_sb_quarter_results_contest ON super_bowl_quarter_results (contest_id);

-- ---------------------------------------------------------------------------
-- 4. Processing log (for debugging)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS super_bowl_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'check_scores', 'process_quarter', 'send_email', 'game_complete', etc.
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'skipped'
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sb_processing_log_created ON super_bowl_processing_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sb_processing_log_action ON super_bowl_processing_log (action);

-- ---------------------------------------------------------------------------
-- 5. RLS policies
-- ---------------------------------------------------------------------------

-- super_bowl_config: only service role can write, authenticated users can read
ALTER TABLE super_bowl_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view super bowl config"
  ON super_bowl_config FOR SELECT
  TO authenticated
  USING (true);

-- super_bowl_quarter_results: service role writes, contest owners + public can read
ALTER TABLE super_bowl_quarter_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quarter results"
  ON super_bowl_quarter_results FOR SELECT
  USING (true);

-- super_bowl_processing_log: service role writes, authenticated can read
ALTER TABLE super_bowl_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view processing log"
  ON super_bowl_processing_log FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 6. Updated_at trigger for super_bowl_config
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_super_bowl_config_updated_at
  BEFORE UPDATE ON super_bowl_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Enable realtime for quarter results (live updates on contest pages)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE super_bowl_quarter_results;
