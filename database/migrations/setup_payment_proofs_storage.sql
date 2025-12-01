-- Setup Storage Bucket and RLS Policies for Payment Proofs
-- Run this in Supabase SQL Editor after creating the bucket in the Storage UI

-- Note: First create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket: "payment-proofs"
-- 3. Set it to Public (or configure RLS policies below)
-- 4. Then run this migration to set up RLS policies

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload payment proofs
CREATE POLICY "Allow authenticated users to upload payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow authenticated users to read payment proofs
CREATE POLICY "Allow authenticated users to read payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
);

-- Policy: Allow public read access to payment proofs (if bucket is public)
-- Comment this out if you want private bucket
CREATE POLICY "Allow public read access to payment proofs"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'payment-proofs'
);

-- Alternative: If you want the bucket to be public, you can skip RLS policies
-- and just set the bucket to public in the Storage UI

