-- Add value column to admin_links table for storing coin amounts and case counts
ALTER TABLE public.admin_links ADD COLUMN value INTEGER;