-- Two-Phase Dispatch Workflow Migration
-- Phase 1: Structure Only (warehouse → site)
-- Phase 2: Kit/Panels/Inverter (warehouse → site, after Phase 1 complete)

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS dispatch_phase       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase1_photo_url     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase1_completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phase1_notes         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase2_photo_url     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phase2_completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phase2_notes         TEXT DEFAULT '';

-- Index for quick phase queries
CREATE INDEX IF NOT EXISTS idx_cases_dispatch_phase ON public.cases(dispatch_phase);

COMMENT ON COLUMN public.cases.dispatch_phase IS '0=not started, 1=phase1 complete, 2=both phases complete';
COMMENT ON COLUMN public.cases.phase1_photo_url IS 'Structure installation photo URL (Phase 1)';
COMMENT ON COLUMN public.cases.phase2_photo_url IS 'Kit/Panel installation photo URL (Phase 2)';
