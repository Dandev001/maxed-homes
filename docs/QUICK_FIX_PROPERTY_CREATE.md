# Quick Fix: Property Creation 403 Error

## The Problem
You're getting a **403 Forbidden** error when trying to **CREATE** a new property:
```
new row violates row-level security policy for table "properties"
```

## The Solution (2 Steps)

### Step 1: Run the Complete Fix Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `database/migrations/fix_property_insert_update_rls_complete.sql`
4. Copy **ALL** the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press F5)

This migration will:
- ✅ Fix the admin check function
- ✅ Drop all conflicting INSERT and UPDATE policies
- ✅ Create proper INSERT policy (for creating properties)
- ✅ Create proper UPDATE policy (for updating properties)

### Step 2: Verify Your Admin Status

After running the migration, run this query:

```sql
-- Check if you're recognized as an admin
SELECT 
    is_current_user_admin() as is_admin,
    auth.jwt() ->> 'email' as your_email;
```

**Expected Result**: `is_admin` should be `true`.

**If `is_admin` is `false`**, add your email to the admins table:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

### Step 3: Test Property Creation

After running the migration and verifying your admin status, try creating a property again. It should work now!

## What This Fixes

This migration fixes **both**:
- ✅ **INSERT** (creating properties) - The main issue you're experiencing
- ✅ **UPDATE** (updating properties, including status changes) - The previous issue

## Still Not Working?

Run these diagnostic queries:

```sql
-- 1. Check all INSERT policies
SELECT * FROM pg_policies 
WHERE tablename = 'properties' AND cmd = 'INSERT';

-- 2. Check your admin record
SELECT * FROM admins WHERE status = 'active';

-- 3. Test the admin function
SELECT is_current_user_admin();

-- 4. Check your JWT email
SELECT auth.jwt() ->> 'email' as jwt_email;
```

## Common Issues

### Issue 1: Function returns false
**Solution**: Make sure your email in the `admins` table exactly matches the email in your JWT token.

### Issue 2: Host creation fails
**Solution**: Make sure you've also run `database/migrations/add_admin_host_creation.sql` to allow admins to create host records.

### Issue 3: Multiple policies conflicting
**Solution**: The migration should have dropped all of them. If not, check with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

