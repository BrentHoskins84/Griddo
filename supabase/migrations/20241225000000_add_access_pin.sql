-- Add optional access PIN for private contests
-- NULL = public access, SET = requires PIN to view
ALTER TABLE contests ADD COLUMN access_pin VARCHAR(6) NULL;

