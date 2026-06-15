-- Migration: Create payment_history table
-- Section B.10: Cash Payment History Timeline

CREATE TABLE IF NOT EXISTS payment_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       TEXT NOT NULL REFERENCES public.cases(case_id) ON DELETE CASCADE,
  payment_date  DATE NOT NULL,
  amount        NUMERIC NOT NULL DEFAULT 0,
  payment_type  TEXT NOT NULL DEFAULT 'installment',
    -- Values: 'down_payment', 'installment', 'final', 'other'
  notes         TEXT DEFAULT '',
  recorded_by   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by case
CREATE INDEX IF NOT EXISTS payment_history_case_id_idx ON payment_history(case_id);
CREATE INDEX IF NOT EXISTS payment_history_date_idx    ON payment_history(payment_date DESC);
