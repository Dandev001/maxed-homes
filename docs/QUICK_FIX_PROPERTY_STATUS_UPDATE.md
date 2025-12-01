# Quick Fix: Property Status Update 403 Error

## The Problem
You're getting a **403 Forbidden** error when trying to change a property's status (e.g., from "active" to "inactive").

## The Solution (3 Steps)

### Step 1: Run the Fix Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `database/migrations/fix_property_update_rls_final.sql`
4. Copy **ALL** the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press F5)

This migration will:
- ✅ Drop all conflicting UPDATE policies
- ✅ Fix the admin check function
- ✅ Create a proper UPDATE policy that allows status changes

### Step 2: Verify It Worked

After running the migration, run this query in the SQL Editor:

```sql
-- Check if you're recognized as an admin
SELECT 
    is_current_user_admin() as is_admin,
    auth.jwt() ->> 'email' as your_email;
```

**Expected Result**: `is_admin` should be `true` and `your_email` should show your email.

**If `is_admin` is `false`**, see Step 3 below.

### Step 3: Verify Your Admin Account

If `is_current_user_admin()` returns `false`, check your admin account:

```sql
-- Check all admin users
SELECT * FROM admins WHERE status = 'active';

-- Check if your email matches
SELECT 
    auth.jwt() ->> 'email' as your_jwt_email,
    email as admin_email,
    status
FROM admins;
```

**If your email is not in the admins table**, add it:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

### Step 4: Test the Update

After fixing everything, try updating a property status in your admin dashboard. It should work now!

## Still Not Working?

Run these diagnostic queries to find the issue:

```sql
-- 1. Check all UPDATE policies
SELECT * FROM pg_policies 
WHERE tablename = 'properties' AND cmd = 'UPDATE';

-- 2. Test the admin function
SELECT is_current_user_admin();

-- 3. Check your admin record
SELECT * FROM admins WHERE status = 'active';

-- 4. Check your JWT email
SELECT auth.jwt() ->> 'email' as jwt_email;
```

## Common Issues

### Issue 1: Function returns false
**Solution**: Make sure your email in the `admins` table exactly matches the email in your JWT token (case-insensitive).

### Issue 2: Multiple UPDATE policies
**Solution**: The migration should have dropped all of them. If not, manually drop them:
```sql
DROP POLICY IF EXISTS "policy-name" ON properties;
```

### Issue 3: RLS not enabled
**Solution**: The migration enables it, but you can manually enable it:
```sql
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

## Need More Help?

See the detailed documentation:
- `docs/FIX_PROPERTY_UPDATE_403.md` - Complete troubleshooting guide
- `database/migrations/diagnose_property_update_rls.sql` - Diagnostic queries

