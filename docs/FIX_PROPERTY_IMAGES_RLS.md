# Fix Property Images RLS Error (403 Forbidden)

## Problem
When trying to add property images, you get a 403 error with message:
```
new row violates row-level security policy for table "property_images"
```

This means the INSERT operation is being blocked by RLS policies.

## Root Cause
The `property_images` table RLS policy was using `FOR ALL` with only `USING` clause. For INSERT operations, PostgreSQL RLS requires the `WITH CHECK` clause to validate the new row.

## Solution

### Step 1: Run the Fix Migration

Run this migration in Supabase SQL Editor:

**File: `database/migrations/fix_property_images_rls.sql`**

This migration:
- Drops and recreates the property_images policy with both `USING` and `WITH CHECK`
- Ensures the `is_current_user_admin()` function is correct
- Fixes the RLS policy to allow admins to insert, update, and delete property images

### Step 2: Verify the Policy

Run this query to check the policy:

```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'property_images' 
AND policyname = 'Admins can manage all property images';
```

You should see:
- `cmd`: `ALL`
- `qual` (USING): `is_current_user_admin()`
- `with_check`: `is_current_user_admin()`

### Step 3: Test Image Insertion

Try adding images to a property again. It should work now!

## Alternative: Manual Fix

If the migration doesn't work, you can manually fix it:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage all property images" ON property_images;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Admins can manage all property images" ON property_images
    FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
```

## Verification

After running the fix, test with:

```sql
-- Test insert (replace with actual property ID)
INSERT INTO property_images (property_id, image_url, display_order, is_primary)
VALUES ('your-property-id', 'https://example.com/image.jpg', 0, true)
RETURNING *;
```

If this works, the RLS policy is correctly configured.

## Related Issues

If you still get errors:
1. Make sure you're in the `admins` table with `status = 'active'`
2. Make sure you're authenticated (logged in)
3. Check that `is_current_user_admin()` returns `true`:
   ```sql
   SELECT is_current_user_admin() as is_admin;
   ```

