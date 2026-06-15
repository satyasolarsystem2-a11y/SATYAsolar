-- ============================================================
-- Migration: 20260614163000_update_10_dept_workflow.sql
-- Purpose:   Add new columns for the 10-department workflow tracking
--            and update the profiles role constraint to include 'operations' and 'warehouse'
-- ============================================================

-- Step 1: Update Roles Constraint to include operations
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin',
    'sales',
    'registration',
    'banking',
    'inventory',
    'warehouse',
    'field_installation',
    'electrical',
    'technical',
    'accounts',
    'customer_service',
    'subsidy',
    'operations'
  ));

-- Step 2: Add specific columns for department workflows if not exists

-- Registration Dept (Dept 2)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS customer_phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS neda_registration_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pm_surya_ghar_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS vendor_selected TEXT DEFAULT '';

-- Project Dept (Dept 3)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS site_survey_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS design_approval_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bom_preparation_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase1_structure_dispatch TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase1_structure_installed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phase1_gps_photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase2_panel_dispatch TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase2_inverter_dispatch TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase2_installation_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS final_site_photos_url TEXT DEFAULT '';

-- Electrical Dept (Dept 4)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS panel_serial_numbers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS uppcl_documentation_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS net_metering_approval_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meter_installed BOOLEAN DEFAULT FALSE;

-- Accounts Section (Dept 5)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS total_project_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_received NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_pending NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_clearance_status TEXT DEFAULT '';

-- Subsidy Section (Dept 6)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS subsidy_application_status TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS subsidy_received BOOLEAN DEFAULT FALSE;

-- Customer Service / AMC (Dept 7)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS amc_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS insurance_details TEXT DEFAULT '';

-- Operations & Warehouse (Dept 8, 10)
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS dispatch_challan_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
