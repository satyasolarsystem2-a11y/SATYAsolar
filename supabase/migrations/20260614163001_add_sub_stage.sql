ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS sub_stage TEXT DEFAULT '';
NOTIFY pgrst, 'reload schema';
