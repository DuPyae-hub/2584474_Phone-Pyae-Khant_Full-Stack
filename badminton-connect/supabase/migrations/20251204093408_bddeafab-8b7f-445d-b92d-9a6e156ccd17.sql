-- Add rating column to courts table
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS rating numeric(2,1);