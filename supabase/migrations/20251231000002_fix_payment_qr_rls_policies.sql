-- Drop existing policies
DROP POLICY IF EXISTS "Contest owners can upload payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Contest owners can update payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Contest owners can delete payment QR codes" ON storage.objects;

-- Recreate with contest ownership verification
-- File path structure: {user_id}/{contest_id}/{filename}

CREATE POLICY "Contest owners can upload payment QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.contests
    WHERE contests.id = (storage.foldername(name))[2]::uuid
    AND contests.owner_id = auth.uid()
  )
);

CREATE POLICY "Contest owners can update payment QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.contests
    WHERE contests.id = (storage.foldername(name))[2]::uuid
    AND contests.owner_id = auth.uid()
  )
);

CREATE POLICY "Contest owners can delete payment QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.contests
    WHERE contests.id = (storage.foldername(name))[2]::uuid
    AND contests.owner_id = auth.uid()
  )
);

