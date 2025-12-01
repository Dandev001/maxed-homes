# Payment Proofs Storage Bucket Setup Guide

## Problem
Getting "new row violates row-level security policy" error when trying to upload payment proof images.

## Solution

### Step 1: Create the Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create Bucket"**
4. Configure the bucket:
   - **Name**: `payment-proofs`
   - **Public bucket**: **Yes** (toggle ON) - This allows admins to view payment proofs
   - **File size limit**: 5 MB (or as needed)
   - **Allowed MIME types**: `image/*` (or leave empty for all image types)
5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

**⚠️ IMPORTANT**: Storage policies **MUST** be created via the Dashboard UI in Supabase.

1. Go to **Storage** in your Supabase Dashboard
2. Click on the **`payment-proofs`** bucket
3. Click the **"Policies"** tab
4. Click **"New Policy"** > **"For full customization"**

Create the following policies:

#### Policy 1: Authenticated Users Can Upload Payment Proofs
- **Policy name**: `Authenticated users can upload payment proofs`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  - **WITH CHECK expression**: `bucket_id = 'payment-proofs'`
- Click **"Review"** then **"Save policy"**

#### Policy 2: Authenticated Users Can Read Payment Proofs
- **Policy name**: `Authenticated users can read payment proofs`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
  - **USING expression**: `bucket_id = 'payment-proofs'`
- Click **"Review"** then **"Save policy"**

#### Policy 3: Authenticated Users Can Delete Payment Proofs (Optional)
- **Policy name**: `Authenticated users can delete payment proofs`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  - **USING expression**: `bucket_id = 'payment-proofs'`
- Click **"Review"** then **"Save policy"**

### Step 3: Alternative - Public Read Access (If Needed)

If you want payment proofs to be publicly viewable (not recommended for privacy), you can add:

#### Policy 4: Public Read Access (Optional - Not Recommended)
- **Policy name**: `Public can view payment proofs`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
  - **USING expression**: `bucket_id = 'payment-proofs'`
- Click **"Review"** then **"Save policy"**

**Note**: For privacy reasons, it's better to keep payment proofs private and only allow authenticated users (admins) to view them.

### Step 4: Verify the Policies

After creating the policies, you should see them listed in:
- **Storage** > **`payment-proofs`** > **Policies**

You should see at least 2 policies:
- ✅ `Authenticated users can upload payment proofs` (INSERT)
- ✅ `Authenticated users can read payment proofs` (SELECT)
- ✅ `Authenticated users can delete payment proofs` (DELETE) - if created

### Step 5: Test Payment Proof Upload

Try uploading a payment proof through the booking confirmation page. It should work now!

## Troubleshooting

### Still getting "new row violates row-level security policy" error?

1. **Check if you're authenticated**: Make sure you're logged in as a user
2. **Verify bucket exists**: Go to Storage and confirm `payment-proofs` bucket exists
3. **Check bucket is public**: The bucket should be set to "Public" for easier access
4. **Verify policies**: Check that the INSERT policy exists for authenticated users
5. **Check browser console**: Look for detailed error messages

### Error: "Bucket not found"

The bucket doesn't exist. Follow Step 1 above to create it.

### Error: "Permission denied" or "new row violates row-level security policy"

The RLS policies are not set up correctly. Follow Step 2 above to create the policies.

## Security Notes

- Payment proofs contain sensitive financial information
- Only authenticated users can upload/view payment proofs
- Consider restricting uploads to guests only and reads to admins only in the future
- File size limits are enforced at the bucket level
- MIME type restrictions can be added in bucket settings

## Quick Setup Summary

1. ✅ Create bucket: `payment-proofs` (Public)
2. ✅ Add INSERT policy for `authenticated` users
3. ✅ Add SELECT policy for `authenticated` users
4. ✅ Test upload functionality

