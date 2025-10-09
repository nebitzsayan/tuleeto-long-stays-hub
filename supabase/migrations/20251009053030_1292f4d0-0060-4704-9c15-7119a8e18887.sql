-- Add electricity tracking columns to payment_records
ALTER TABLE public.payment_records 
ADD COLUMN IF NOT EXISTS electricity_units numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_unit numeric DEFAULT 11;

-- Update the RLS policies to ensure proper access (no changes needed, just confirming)
-- Existing policies already cover the new columns