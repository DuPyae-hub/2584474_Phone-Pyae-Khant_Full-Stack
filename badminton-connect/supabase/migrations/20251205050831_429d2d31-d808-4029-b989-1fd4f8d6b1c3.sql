-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to receipts
CREATE POLICY "Receipts are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts');