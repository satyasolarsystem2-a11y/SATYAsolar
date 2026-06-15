-- Migration: Update legacy department roles to new consolidated roles
-- Run on Supabase: npx supabase db query --linked < update_roles.sql

-- 1. Finance / Accounts Department
--    Old: banking, accounts → New: finance
UPDATE public.profiles
  SET role = 'finance'
  WHERE role IN ('banking', 'accounts');

-- 2. Project Department (Survey, Design, Installation)
--    Old: field_installation, technical, electrical → New: project
UPDATE public.profiles
  SET role = 'project'
  WHERE role IN ('field_installation', 'technical', 'electrical', 'field');

-- 3. Warehouse / Store Department
--    Old: inventory, procurement, store → New: warehouse
UPDATE public.profiles
  SET role = 'warehouse'
  WHERE role IN ('inventory', 'procurement', 'store');

-- Verify the results
SELECT role, count(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;
