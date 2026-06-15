-- Extended employee profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender            TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address           TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_name  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS branch_name       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_number    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ifsc_code         TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience_years  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_name      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS work_location     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_ctc          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS aadhar_card       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan_card          TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS city              TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS state             TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS country           TEXT DEFAULT 'India';
