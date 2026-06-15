-- Add tracking_visible column
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_tracking_visible BOOLEAN DEFAULT false;
