-- Add delivery address to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_phone TEXT,
ADD COLUMN delivery_name TEXT;