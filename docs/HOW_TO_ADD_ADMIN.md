# How to Add an Admin User

This guide explains how to add a new admin user to the Maxed Homes platform.

## 📋 Prerequisites

- Access to Supabase SQL Editor (or direct database access)
- The email address of the user you want to make an admin
- The user should have an account in the system (they need to be registered/logged in at least once)

## 🎯 Quick Method (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run the SQL Command

Replace `'newadmin@example.com'` with the actual email address:

```sql
-- Add a new admin user
INSERT INTO admins (email, role, status)
VALUES ('newadmin@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

### Step 3: Verify the Admin Was Added

```sql
-- Check if the admin was created successfully
SELECT id, email, role, status, created_at 
FROM admins 
WHERE email = 'newadmin@example.com';
```

## 🔐 Admin Roles

The system supports three admin roles:

1. **`admin`** - Standard admin (can manage properties, bookings, users, etc.)
2. **`super_admin`** - Full access (can also create/update/delete other admins)
3. **`moderator`** - Limited admin access (for future use)

### Adding Different Roles

```sql
-- Add a standard admin
INSERT INTO admins (email, role, status)
VALUES ('admin@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';

-- Add a super admin (can manage other admins)
INSERT INTO admins (email, role, status)
VALUES ('superadmin@example.com', 'super_admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';

-- Add a moderator
INSERT INTO admins (email, role, status)
VALUES ('moderator@example.com', 'moderator', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

## ⚠️ Important Notes

### RLS Policy Restriction

The `admins` table has Row Level Security (RLS) enabled. According to the policies:
- **Only `super_admin` users can insert/update/delete admins** through the application
- However, you can bypass this by running SQL directly in Supabase SQL Editor (which uses service role privileges)

### If You Get Permission Errors

If you're trying to add an admin through the application and get a permission error, you have two options:

1. **Use Supabase SQL Editor** (recommended) - This bypasses RLS policies
2. **Use a super_admin account** - Log in as a super_admin and add the admin through the app (if you build an admin management UI)

### Linking to Auth Users (Optional)

You can optionally link the admin record to an `auth.users` record:

```sql
-- Link admin to auth.users (optional)
UPDATE admins 
SET user_id = (SELECT id FROM auth.users WHERE email = admins.email) 
WHERE email = 'newadmin@example.com' AND user_id IS NULL;
```

This is optional - the admin check works with email only.

## ✅ Verification Steps

After adding an admin, verify it works:

### 1. Check Admin Record Exists

```sql
SELECT * FROM admins WHERE email = 'newadmin@example.com';
```

### 2. Test Admin Status (User Must Be Logged In)

Have the new admin log in to the application, then run:

```sql
-- This will return true if the logged-in user is an admin
SELECT is_current_user_admin() as is_admin;
```

### 3. Test in Application

1. Have the new admin log out and log back in
2. They should see the "Admin Dashboard" link in the navigation menu
3. They should be able to access `/admin` route

## 🔄 Updating Admin Status

### Activate an Admin

```sql
UPDATE admins 
SET status = 'active' 
WHERE email = 'admin@example.com';
```

### Deactivate an Admin

```sql
UPDATE admins 
SET status = 'inactive' 
WHERE email = 'admin@example.com';
```

### Suspend an Admin

```sql
UPDATE admins 
SET status = 'suspended' 
WHERE email = 'admin@example.com';
```

### Change Admin Role

```sql
UPDATE admins 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';
```

## 📝 Complete Example

Here's a complete example of adding a new admin with all steps:

```sql
-- Step 1: Add the admin
INSERT INTO admins (email, role, status)
VALUES ('john.doe@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';

-- Step 2: Link to auth.users (optional)
UPDATE admins 
SET user_id = (SELECT id FROM auth.users WHERE email = 'john.doe@example.com') 
WHERE email = 'john.doe@example.com' AND user_id IS NULL;

-- Step 3: Verify
SELECT 
    id, 
    email, 
    role, 
    status, 
    user_id,
    created_at 
FROM admins 
WHERE email = 'john.doe@example.com';
```

## 🚨 Troubleshooting

### Admin Can't Access Dashboard

1. **Check admin status is 'active'**:
   ```sql
   SELECT email, status FROM admins WHERE email = 'admin@example.com';
   ```

2. **Check email matches exactly** (case-insensitive, but check for typos):
   ```sql
   SELECT email FROM admins WHERE LOWER(email) = LOWER('admin@example.com');
   ```

3. **Have user log out and log back in** - Admin status is checked on login

4. **Check browser console** - Look for any errors in the admin check

### Permission Denied When Adding Admin

If you get a permission error when trying to add an admin through the application:
- Use Supabase SQL Editor instead (bypasses RLS)
- Or ensure you're logged in as a `super_admin`

## 📚 Related Files

- `database/migrations/create_admins_table.sql` - Admins table structure
- `database/migrations/setup_admin_user.sql` - Example admin setup
- `src/utils/admin.ts` - Admin check functions
- `src/components/ProtectedRoute.tsx` - Admin route protection

---

**Last Updated**: December 2024

