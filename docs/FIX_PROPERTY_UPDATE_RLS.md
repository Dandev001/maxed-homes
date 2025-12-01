# Fix Property Update RLS Error (406 Not Acceptable)

## Problem
When trying to update a property, you get a 406 error with message:
```
Cannot coerce the result to a single JSON object (PGRST116)
```

This means the UPDATE operation returned 0 rows, which happens when RLS policies block the update.

## Root Cause
The UPDATE policy for properties was missing the `WITH CHECK` clause. In PostgreSQL RLS:
- `USING` clause determines which **existing** rows can be updated
- `WITH CHECK` clause validates the **updated** row values

Both are required for UPDATE operations to work correctly.

## Solution

### Step 1: Run the Fix Migration

Run this migration in Supabase SQL Editor:

**File: `database/migrations/fix_property_update_rls.sql`**

This migration:
- Drops and recreates the UPDATE policy with both `USING` and `WITH CHECK`
- Ensures the `is_current_user_admin()` function is correct
- Fixes the RLS policy to allow admins to update any property

### Step 2: Verify the Policy

Run this query to check the policy:

```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'properties' 
AND policyname = 'Admins can update all properties';
```

You should see:
- `cmd`: `UPDATE`
- `qual` (USING): `is_current_user_admin()`
- `with_check`: `is_current_user_admin()`

### Step 3: Test the Update

Try updating a property again. It should work now!

## Alternative: If Migration Doesn't Work

If the migration doesn't work, you can manually fix it:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
```

## Verification

After running the fix, test with:

```sql
-- Test update (replace with actual property ID)
UPDATE properties 
SET title = title 
WHERE id = 'your-property-id'
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

