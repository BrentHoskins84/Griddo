-- Create storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qr-codes', 
  'payment-qr-codes', 
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow public read access to QR codes
CREATE POLICY "Public can view payment QR codes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-qr-codes');

-- Allow contest owners to upload QR codes for their payment options
-- File path structure: {user_id}/{contest_id}/{filename}
CREATE POLICY "Contest owners can upload payment QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow contest owners to update their own QR codes
CREATE POLICY "Contest owners can update payment QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow contest owners to delete their own QR codes
CREATE POLICY "Contest owners can delete payment QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

