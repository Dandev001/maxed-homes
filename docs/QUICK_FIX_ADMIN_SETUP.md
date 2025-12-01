# Quick Fix: Add Property Not Working

## The Problem
You're getting a 403 error when trying to add a property because:
1. Your email (`mmesomadu240@gmail.com`) needs to be in the `admins` table
2. The RLS policies need to be set up correctly

## Quick Solution (3 Steps)

### Step 1: Add Yourself as Admin

Run this in Supabase SQL Editor:

```sql
INSERT INTO admins (email, role, status)
VALUES ('mmesomadu240@gmail.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

### Step 2: Run RLS Fix Migrations

Run these two migrations in Supabase SQL Editor (in order):

1. **`database/migrations/fix_property_insert_rls.sql`** - Fixes the RLS policies
2. **`database/migrations/add_admin_host_creation.sql`** - Allows admins to create host records

### Step 3: Refresh and Test

1. Refresh your browser (to get a new session)
2. Try adding a property again
3. The app will automatically create a host record for you if one doesn't exist

## What Changed

✅ **Auto-Host Creation**: The app now automatically creates a host record for admins when adding properties
✅ **Better Error Messages**: You'll see clearer error messages if something goes wrong
✅ **Admin Check**: The RLS policies now properly check if you're an admin

## Verify It Works

Run this query to verify you're set up correctly:

```sql
-- Check if you're in the admins table
SELECT id, email, role, status FROM admins WHERE email = 'mmesomadu240@gmail.com';

-- Check if you have a host record (will be auto-created when you add a property)
SELECT id, email, first_name, last_name, status FROM hosts WHERE email = 'mmesomadu240@gmail.com';

-- Test admin function (run while logged in)
SELECT is_current_user_admin() as is_admin;
```

All three should return results/true if everything is set up correctly!

