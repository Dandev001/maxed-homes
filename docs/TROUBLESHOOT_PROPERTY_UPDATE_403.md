# Troubleshoot Property Update 403 Error

## If you're still getting 403 errors after running migrations

### Step 1: Run the Aggressive Fix

Run this migration in Supabase SQL Editor:

**File: `database/migrations/fix_property_update_rls_aggressive.sql`**

This will:
- Show you the current state
- Drop ALL UPDATE policies
- Recreate the admin function with better logging
- Create a fresh UPDATE policy
- Show you diagnostic information

### Step 2: Check the Output

After running the migration, look at the output. You should see:

1. **Current State** - Shows existing policies
2. **Function Test** - Shows if `is_current_user_admin()` returns true
3. **Admin Users** - Shows all active admins

### Step 3: Verify You're an Admin

The migration output will show:
- `is_admin` should be `true`
- `your_email` should match an admin email

If `is_admin` is `false`, check:

#### A. Your email is in the admins table

```sql
-- Check all admins
SELECT * FROM admins WHERE status = 'active';

-- Check if your email matches
SELECT 
    auth.jwt() ->> 'email' as your_jwt_email,
    a.email as admin_email,
    CASE 
        WHEN LOWER(TRIM(a.email)) = LOWER(TRIM(auth.jwt() ->> 'email')) 
        THEN 'MATCH ✅' 
        ELSE 'NO MATCH ❌' 
    END as match_status
FROM admins a
WHERE a.status = 'active';
```

#### B. Add yourself as admin if needed

```sql
-- Replace with your actual email
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

#### C. Check your JWT contains email

```sql
-- This should show your email
SELECT auth.jwt() ->> 'email' as jwt_email;
```

If this returns NULL, your authentication token might not have the email claim.

### Step 4: Check for Conflicting Policies

```sql
-- Check ALL policies on properties table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;
```

Make sure there's only ONE UPDATE policy: "Admins can update all properties"

### Step 5: Test the Update Directly

Try updating a property directly in SQL:

```sql
-- Replace with actual property ID
UPDATE properties 
SET status = 'inactive' 
WHERE id = 'your-property-id-here'
RETURNING id, title, status;
```

If this works in SQL but not in the app, the issue might be with the JWT token in your app session.

### Step 6: Refresh Your Session

If everything looks correct but it still doesn't work:

1. **Log out** of your app
2. **Log back in** (this refreshes your JWT token)
3. Try updating again

### Step 7: Check Browser Console

Look for any errors in the browser console that might indicate:
- Authentication issues
- JWT token problems
- Network errors

## Common Issues

### Issue 1: Function returns false
**Symptoms**: `is_current_user_admin()` returns `false`  
**Solution**: 
- Verify your email is in the `admins` table
- Check the email matches exactly (case-insensitive)
- Make sure admin status is 'active'

### Issue 2: JWT doesn't have email
**Symptoms**: `auth.jwt() ->> 'email'` returns NULL  
**Solution**: 
- Log out and log back in
- Check your Supabase auth configuration
- Verify email is set in user metadata

### Issue 3: Multiple conflicting policies
**Symptoms**: Multiple UPDATE policies exist  
**Solution**: Run the aggressive fix migration which drops all policies

### Issue 4: Policy exists but still fails
**Symptoms**: Policy exists but updates still fail  
**Solution**: 
- Check the policy has both `USING` and `WITH CHECK`
- Verify the function is working: `SELECT is_current_user_admin();`
- Try dropping and recreating the policy

## Still Not Working?

If none of the above works, run this comprehensive diagnostic:

```sql
-- Complete diagnostic
SELECT '=== DIAGNOSTIC ===' as section;

-- 1. Check admin status
SELECT 
    'Admin Check' as test,
    is_current_user_admin() as result,
    auth.jwt() ->> 'email' as email,
    auth.role() as role;

-- 2. Check policies
SELECT 
    'Policies' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

-- 3. Check admins table
SELECT 
    'Admins Table' as test,
    email,
    status
FROM admins 
WHERE status = 'active';

-- 4. Check RLS is enabled
SELECT 
    'RLS Status' as test,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'properties';
```

Send the output of this diagnostic if you need further help.

