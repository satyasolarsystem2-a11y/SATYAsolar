-- Add quotation verification columns to cases table
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS quotation_verified  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quotation_amount    NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finance_verified    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accounts_verified   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quotation_id_ref    TEXT DEFAULT '';
