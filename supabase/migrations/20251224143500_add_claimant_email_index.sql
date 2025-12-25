-- Add index on claimant_email for faster lookups when checking max squares per person
CREATE INDEX idx_squares_claimant_email ON squares(claimant_email);

