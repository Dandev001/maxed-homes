# Fix Properties Not Loading Issue

## Problem
Properties are not loading on both the properties page and admin dashboard.

## Root Causes

1. **RLS Policies Blocking Access**: The Row Level Security (RLS) policies only allow viewing properties with `status = 'active'`, and there are no admin-specific policies to allow admins to view all properties.

2. **Host Join Issues**: The queries join with the `hosts` table, which might be blocked by RLS policies on the hosts table.

## Solution

### Step 1: Run the Admin RLS Migration

Run the migration file to add admin RLS policies:

```sql
-- File: database/migrations/add_admin_properties_rls.sql
```

This migration will:
- Add admin policies to view ALL properties (including inactive)
- Allow admins to insert, update, and delete properties
- Allow admins to manage property images
- Allow admins to view all hosts (needed for property creation)

**To run the migration:**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/migrations/add_admin_properties_rls.sql`
4. Click Run

### Step 2: Verify Admin User Exists

Make sure you have an admin user in the `admins` table:

```sql
-- Check if you have admin users
SELECT * FROM admins WHERE status = 'active';

-- If not, create one (replace with your email)
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active');
```

### Step 3: Check Properties Exist

Verify that properties exist in the database:

```sql
-- Check all properties
SELECT id, title, status FROM properties;

-- Check active properties
SELECT id, title, status FROM properties WHERE status = 'active';
```

### Step 4: Verify RLS Policies

Check that the policies are correctly applied:

```sql
-- List all policies on properties table
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

You should see:
- "Properties are viewable by everyone" (for active properties)
- "Admins can view all properties" (for admins to see all)
- "Admins can insert properties"
- "Admins can update all properties"
- "Admins can delete properties"

## Testing

### Test Public Access (Properties Page)
1. Log out or use incognito mode
2. Navigate to `/properties`
3. Should see active properties

### Test Admin Access
1. Log in as an admin user
2. Navigate to `/admin` → Properties tab
3. Should see ALL properties (active, inactive, maintenance, sold)

## Troubleshooting

### If properties still don't load:

1. **Check Browser Console**: Look for error messages
2. **Check Network Tab**: See if API calls are failing
3. **Check Supabase Logs**: Look for RLS policy violations
4. **Verify Authentication**: Make sure you're logged in as admin for admin dashboard

### Common Issues:

1. **"permission denied for table properties"**
   - RLS policies are blocking access
   - Run the migration file

2. **"relation 'hosts' does not exist"**
   - Hosts table doesn't exist
   - Run the complete schema migration

3. **Empty results but no errors**
   - No properties in database
   - Properties exist but all are inactive (for public view)
   - RLS policies are too restrictive

4. **Admin can't see inactive properties**
   - Admin RLS policies not applied
   - Run the migration file
   - Verify admin user exists and is active

## Additional Notes

- The migration uses the `is_current_user_admin()` function which must exist (from `fix_admins_rls_recursion.sql`)
- If you get "function does not exist" error, run `fix_admins_rls_recursion.sql` first
- The policies use `OR` logic: admins can see all, public can only see active

