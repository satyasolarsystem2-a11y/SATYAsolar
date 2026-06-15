-- Add is_head column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_head BOOLEAN DEFAULT false;
