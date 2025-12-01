# Storage Bucket Setup Guide

## Problem
Getting "Permission denied" error when trying to upload images to the `property-images` storage bucket.

## Solution

### Step 1: Create the Storage Bucket (if not already created)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create Bucket"**
4. Configure the bucket:
   - **Name**: `property-images`
   - **Public bucket**: **Yes** (toggle ON) - This is important!
   - **File size limit**: 5 MB (or as needed)
   - **Allowed MIME types**: `image/*` (or leave empty for all image types)
5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

**⚠️ IMPORTANT**: Storage policies **CANNOT** be created via SQL in Supabase. You **MUST** use the Dashboard UI.

#### Option A: Using Supabase Dashboard UI (Recommended)

1. Go to **Storage** in your Supabase Dashboard
2. Click on the **`property-images`** bucket (or go to **Storage** > **Policies**)
3. Click **"New Policy"** or **"Add Policy"**
4. Create the following 4 policies:

   **Policy 1: Public Read Access**
   - Policy name: `Public can view property images`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition:
     - **USING expression**: `bucket_id = 'property-images'`
   - Click **"Review"** then **"Save policy"**

   **Policy 2: Authenticated Upload**
   - Policy name: `Authenticated users can upload property images`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition:
     - **WITH CHECK expression**: `bucket_id = 'property-images' AND auth.role() = 'authenticated'`
   - Click **"Review"** then **"Save policy"**

   **Policy 3: Authenticated Update**
   - Policy name: `Authenticated users can update property images`
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition:
     - **USING expression**: `bucket_id = 'property-images' AND auth.role() = 'authenticated'`
     - **WITH CHECK expression**: `bucket_id = 'property-images' AND auth.role() = 'authenticated'`
   - Click **"Review"** then **"Save policy"**

   **Policy 4: Authenticated Delete**
   - Policy name: `Authenticated users can delete property images`
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition:
     - **USING expression**: `bucket_id = 'property-images' AND auth.role() = 'authenticated'`
   - Click **"Review"** then **"Save policy"**

#### Option B: Quick Setup (Simpler, Less Secure)

If you want a simpler setup with just 2 policies:

1. Go to **Storage** > **`property-images`** bucket > **Policies**
2. Click **"New Policy"** > **"For full customization"**

   **Policy 1: Public Read**
   - Name: `Public can view property images`
   - Operation: `SELECT`
   - Roles: `public`
   - Expression: `bucket_id = 'property-images'`

   **Policy 2: Authenticated All**
   - Name: `Authenticated users can manage property images`
   - Operation: `ALL` (or create separate INSERT, UPDATE, DELETE policies)
   - Roles: `authenticated`
   - Expression: `bucket_id = 'property-images'`

### Step 3: Verify the Policies

After creating the policies, you should see them listed in:
- **Storage** > **Policies** (or in the bucket's policy section)

You should see 4 policies (or 2 if using the quick setup):
- ✅ `Public can view property images` (SELECT)
- ✅ `Authenticated users can upload property images` (INSERT)
- ✅ `Authenticated users can update property images` (UPDATE)
- ✅ `Authenticated users can delete property images` (DELETE)

### Step 4: Test Image Upload

Try uploading an image through the PropertyForm. It should work now!

## Visual Guide: Creating Policies in Dashboard

1. **Navigate to Storage Policies**:
   - Go to **Storage** in the left sidebar
   - Click on **`property-images`** bucket
   - Click the **"Policies"** tab (or go to **Storage** > **Policies**)

2. **Create Each Policy**:
   - Click **"New Policy"** button
   - Choose **"For full customization"** (not the template)
   - Fill in the policy details as specified above
   - Click **"Review"** to verify
   - Click **"Save policy"**

3. **Repeat for all 4 policies** (or 2 if using quick setup)

## Troubleshooting

### Still getting permission errors?

1. **Check if you're authenticated**: Make sure you're logged in as an admin user
2. **Verify bucket exists**: Go to Storage and confirm `property-images` bucket exists
3. **Check bucket is public**: The bucket must be set to "Public" (not private)
4. **Verify policies**: Run the verification query above to ensure policies exist
5. **Check browser console**: Look for detailed error messages

### Error: "Bucket not found"

The bucket doesn't exist. Follow Step 1 above to create it.

### Error: "new row violates row-level security policy"

This is a different issue related to the `property_images` table (not storage). 
See `database/migrations/fix_property_images_rls.sql` for the fix.

## Security Notes

- The bucket is set to **public** so images can be viewed on the website
- Only **authenticated users** can upload/update/delete images
- In production, you might want to restrict uploads to admins only (using `is_current_user_admin()` function)
- Consider adding file size limits and MIME type restrictions in bucket settings

