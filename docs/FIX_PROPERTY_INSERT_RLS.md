# Fix Property Insert RLS Error (403 Forbidden)

## Problem
When trying to add a property, you get a 403 error with message:
```
new row violates row-level security policy for table "properties"
```

## Root Cause
The Row Level Security (RLS) policy requires:
1. You must be **authenticated** (logged in)
2. Your email must be in the `admins` table
3. Your admin status must be `'active'`

## Solution

### Step 1: Add Yourself as Admin

**IMPORTANT**: First, make sure your email is in the `admins` table:

```sql
-- Replace 'mmesomadu240@gmail.com' with your actual email
INSERT INTO admins (email, role, status)
VALUES ('mmesomadu240@gmail.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

Or run the migration file: `database/migrations/setup_admin_user.sql`

### Step 2: Run the Fix Migrations

Run these migration files in order:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run these migrations in order:
   - `database/migrations/fix_property_insert_rls.sql` (fixes RLS policies)
   - `database/migrations/add_admin_host_creation.sql` (allows admins to create hosts)
4. Click **Run** for each

### Step 3: Verify You're Authenticated

Make sure you're logged in to the application. Check the browser console to see your current user email.

### Step 4: Check Your Admin Status

Run this query in the Supabase SQL Editor to check if your email is in the admins table:

```sql
-- Check all admins
SELECT id, email, role, status FROM admins;

-- Check your current authenticated user's email
SELECT auth.jwt() ->> 'email' as current_email, auth.role() as current_role;

-- Test if the admin function works for your user
SELECT is_current_user_admin() as is_admin;
```

### Step 5: Auto-Create Host Record (New Feature!)

The application will now automatically create a host record for you when you try to add a property. This happens automatically - you don't need to do anything!

If you want to manually create a host record:

```sql
-- Replace with your details
INSERT INTO hosts (email, first_name, last_name, status, is_verified)
VALUES ('mmesomadu240@gmail.com', 'Your', 'Name', 'active', true)
ON CONFLICT (email) DO UPDATE SET status = 'active', is_verified = true;
```

### Step 6: Add Yourself as Admin (if Step 1 didn't work)

If your email is not in the admins table, add it:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

**Important**: Use the exact email address you used to sign up/login to the application.

### Step 7: Verify the Fix

1. Refresh your browser to get a new session
2. Try adding a property again
3. Check the browser console for any errors

## Troubleshooting

### Issue: "is_current_user_admin() returns false"

**Possible causes:**
- You're not authenticated (not logged in)
- Your email in the JWT doesn't match the email in the admins table
- The admin record exists but `status` is not `'active'`
- Email case mismatch (should be handled by the function, but double-check)

**Solution:**
1. Check your current email: `SELECT auth.jwt() ->> 'email' as current_email;`
2. Check admins table: `SELECT email, status FROM admins;`
3. Ensure emails match exactly (case-insensitive)
4. Ensure admin status is `'active'`

### Issue: "auth.jwt() returns null"

This means you're not authenticated. Make sure you're logged in to the application.

### Issue: Policies don't exist

If you get errors about policies not existing, run the admin RLS migration:

```sql
-- Run this migration
-- File: database/migrations/add_admin_properties_rls.sql
```

## Verification Queries

Run these queries to verify everything is set up correctly:

```sql
-- 1. Check all policies on properties table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- 2. Check if the helper function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_current_user_admin';

-- 3. Check your admin status
SELECT 
    auth.jwt() ->> 'email' as your_email,
    auth.role() as your_role,
    is_current_user_admin() as is_admin,
    (SELECT COUNT(*) FROM admins WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')) AND status = 'active') as admin_count;
```

## Expected Result

After completing these steps:
- ✅ You should be able to create properties without 403 errors
- ✅ The `is_current_user_admin()` function should return `true` for your user
- ✅ Your email should appear in the admins table with status `'active'`

