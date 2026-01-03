-- =============================================
-- ADD CUSTOM PRIZE SUPPORT FOR FOOTBALL CONTESTS
-- =============================================

-- Create prize type enum
CREATE TYPE prize_type AS ENUM (
  'percentage',
  'custom'
);

-- Add prize_type column to contests table
ALTER TABLE contests
  ADD COLUMN prize_type prize_type DEFAULT 'percentage' NOT NULL;

-- Add custom prize text columns for each quarter
ALTER TABLE contests
  ADD COLUMN prize_q1_text TEXT,
  ADD COLUMN prize_q2_text TEXT,
  ADD COLUMN prize_q3_text TEXT,
  ADD COLUMN prize_final_text TEXT;

