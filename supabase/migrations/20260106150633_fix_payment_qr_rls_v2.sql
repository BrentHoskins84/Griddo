-- Drop existing policies
DROP POLICY IF EXISTS "Contest owners can upload payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Contest owners can update payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Contest owners can delete payment QR codes" ON storage.objects;

-- Recreate with split_part instead of storage.foldername
-- File path structure: {user_id}/{contest_id}/{filename}

CREATE POLICY "Contest owners can upload payment QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Contest owners can update payment QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Contest owners can delete payment QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

