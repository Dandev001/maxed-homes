# Fix Property Update 403 Forbidden Error

## Problem
When trying to update a property status (e.g., changing from "active" to "inactive" or vice versa), you get:
- **403 Forbidden** error
- Error code: `42501`
- Message: `new row violates row-level security policy for table "properties"`

This error specifically occurs when the `WITH CHECK` clause in the UPDATE RLS policy fails, which happens when the new row values (after the update) don't pass the policy check.

## Root Cause
The UPDATE RLS policy's `WITH CHECK` clause is failing. This happens when:
1. The `is_current_user_admin()` function returns false
2. The UPDATE policy is missing or incorrectly configured
3. There are conflicting policies

## Solution

### Step 1: Run the Status Update Fix Migration

Run this migration in Supabase SQL Editor:

**File: `database/migrations/fix_property_status_update_rls.sql`**

This migration is specifically designed to fix status change issues. Alternatively, you can use:

**File: `database/migrations/fix_property_update_rls_comprehensive.sql`**

This migration:
- ✅ Ensures the `is_current_user_admin()` function is robust
- ✅ Drops and recreates the UPDATE policy with both `USING` and `WITH CHECK`
- ✅ Adds proper error handling
- ✅ Grants necessary permissions

### Step 2: Run Diagnostic Queries (Optional)

If the fix doesn't work, run the diagnostic queries to identify the issue:

**File: `database/migrations/diagnose_property_update_rls.sql`**

This will show you:
- All policies on the properties table
- Whether the admin function works
- Your current admin status
- Any conflicting policies

### Step 3: Verify Your Admin Status

Make sure you're logged in as an admin:

```sql
-- Check if you're an admin
SELECT 
    is_current_user_admin() as is_admin,
    auth.jwt() ->> 'email' as your_email;

-- Check admin users
SELECT * FROM admins WHERE status = 'active';
```

If `is_admin` returns `false`, verify:
1. Your email matches an admin email in the `admins` table
2. The admin record has `status = 'active'`
3. Your JWT contains the email claim

### Step 4: Test the Update

After running the migration, try updating a property again. It should work!

## Quick Manual Fix

If you need to fix it manually:

```sql
-- 1. Ensure the function exists
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    IF auth.role() IS NULL OR auth.role() = 'anon' THEN
        RETURN FALSE;
    END IF;
    
    user_email := auth.jwt() ->> 'email';
    
    IF user_email IS NULL OR user_email = '' THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- 2. Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
```

## Verification

After applying the fix, verify:

```sql
-- Check the policy exists
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'properties' 
AND policyname = 'Admins can update all properties';

-- Test update (replace with actual property ID)
UPDATE properties 
SET status = 'active' 
WHERE id = 'your-property-id';
```

## Common Issues

### Issue 1: Function returns false
**Solution**: Check your email matches an admin record:
```sql
SELECT * FROM admins 
WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'));
```

### Issue 2: Multiple conflicting policies
**Solution**: Check for other UPDATE policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'properties' AND cmd = 'UPDATE';
```
If there are multiple, they're combined with OR, so make sure none are blocking.

### Issue 3: JWT doesn't contain email
**Solution**: Check your authentication setup. The JWT should include the email claim.

## Still Not Working?

1. Run the diagnostic queries to identify the specific issue
2. Check the Supabase logs for more detailed error messages
3. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'properties';`
4. Make sure you're authenticated: `SELECT auth.role();`

