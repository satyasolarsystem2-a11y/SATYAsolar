-- ============================================================
-- Migration: 20260610000001_satya_solar_schema_rls.sql
-- Purpose:   Update schema and RLS for Satya Solar 11-stage pipeline
-- ============================================================

-- ── 1. Update Enums / Constraints for Roles ─────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','sales','registration','finance','warehouse','field','qa'));

-- ── 2. Add New Flat Ledger Fields to cases table ────────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS form_submitted_to_bank BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS form_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS loan_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS net_received NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_clear_date TIMESTAMPTZ;

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS ev_charger TEXT;

-- ── 3. Add Inventory Fields ─────────────────────────────────
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS invoice_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;

-- ── 4. RLS Policies for Access Matrix ───────────────────────
-- First, drop existing RLS if we need to replace it, but we can just CREATE policies.
-- By default `cases` has NO select policies, so direct frontend access is BLOCKED.
-- We will enable direct SELECT access through RLS based on role mapping!

-- Note: In the RBSC implementation, Edge Functions were used for all access.
-- If we want to allow direct Supabase client access, we create SELECT policies:

CREATE POLICY "Admin can access all cases"
  ON public.cases FOR ALL
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Sales can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sales' );

CREATE POLICY "Registration can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'registration' );

CREATE POLICY "Finance can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'finance' );

CREATE POLICY "Warehouse can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'warehouse' );

CREATE POLICY "Field can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'field' );

CREATE POLICY "QA can read cases"
  ON public.cases FOR SELECT
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'qa' );

-- NOTE: Write operations remain restricted via Edge Functions per architecture.
