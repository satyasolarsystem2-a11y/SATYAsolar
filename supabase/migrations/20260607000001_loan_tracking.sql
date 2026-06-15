-- Migration: Add loan_approved_amount to cases table
-- Section B.9: Loan Tracking Improvements

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS loan_approved_amount NUMERIC DEFAULT 0;
