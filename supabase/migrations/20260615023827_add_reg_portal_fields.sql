-- Add Government Portal Registration fields to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS neda_registration text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS pmsg_registration text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS vendor_selection text;
