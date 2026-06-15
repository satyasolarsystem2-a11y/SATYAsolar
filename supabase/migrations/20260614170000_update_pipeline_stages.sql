-- ============================================================
-- Migration: 20260614170000_update_pipeline_stages.sql
-- Purpose:   Add sub-stage tracking for each department and 
--            migrate existing global current_stage strings to 
--            the new Operations Funnel format.
-- ============================================================

-- Step 1: Add Department Sub-Stage Tracking Columns
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS sales_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS registration_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS electrical_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS accounts_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS subsidy_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS amc_sub_stage TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS warehouse_sub_stage TEXT DEFAULT '';

-- Step 2: Migrate existing current_stage values to the new Operations Funnel
UPDATE public.cases
SET current_stage = CASE current_stage
  WHEN 'Registration Done' THEN 'Registration Pending'
  WHEN 'Phone Verification Done' THEN 'Registration Approved'
  WHEN 'Bank & Finance' THEN 'Registration Approved'
  WHEN 'Sent to Store' THEN 'Material Reserved'
  WHEN 'Installation Done' THEN 'Full Installation Completed'
  WHEN 'Plant Activated' THEN 'Net Metering Completed'
  WHEN 'Sent to Subsidy' THEN 'Subsidy Closed'
  WHEN 'Subsidy Registration Completed' THEN 'Subsidy Closed'
  WHEN 'Completed' THEN 'Project Completed'
  ELSE current_stage
END;

-- Step 3: Migrate historical case_history stages similarly so analytics don't break
UPDATE public.case_history
SET stage = CASE stage
  WHEN 'Registration Done' THEN 'Registration Pending'
  WHEN 'Phone Verification Done' THEN 'Registration Approved'
  WHEN 'Bank & Finance' THEN 'Registration Approved'
  WHEN 'Sent to Store' THEN 'Material Reserved'
  WHEN 'Installation Done' THEN 'Full Installation Completed'
  WHEN 'Plant Activated' THEN 'Net Metering Completed'
  WHEN 'Sent to Subsidy' THEN 'Subsidy Closed'
  WHEN 'Subsidy Registration Completed' THEN 'Subsidy Closed'
  WHEN 'Completed' THEN 'Project Completed'
  ELSE stage
END;

NOTIFY pgrst, 'reload schema';
