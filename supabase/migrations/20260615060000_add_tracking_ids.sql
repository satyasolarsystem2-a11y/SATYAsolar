-- Add tracking_id and customer_id columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50);
