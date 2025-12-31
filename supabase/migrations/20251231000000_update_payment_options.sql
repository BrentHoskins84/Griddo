-- Remove 'other' from payment_option_type enum
-- First, update any existing 'other' values to a valid type
UPDATE payment_options SET type = 'venmo' WHERE type = 'other';

-- Create new enum type without 'other'
CREATE TYPE payment_option_type_new AS ENUM ('venmo', 'paypal', 'zelle', 'cashapp');

-- Alter the column to use the new type
ALTER TABLE payment_options 
  ALTER COLUMN type TYPE payment_option_type_new 
  USING type::text::payment_option_type_new;

-- Drop the old type and rename the new one
DROP TYPE payment_option_type;
ALTER TYPE payment_option_type_new RENAME TO payment_option_type;

-- Add qr_code_url column
ALTER TABLE payment_options ADD COLUMN qr_code_url TEXT;

-- Add account_last_4_digits column
ALTER TABLE payment_options ADD COLUMN account_last_4_digits VARCHAR(4);

