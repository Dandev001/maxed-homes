# Fix Payment Config 403 Error

## 🔴 Problem

Getting a **403 Forbidden** error when trying to create/update/delete payment configs:

```
Failed to load resource: the server responded with a status of 403 ()
[paymentConfigQueries] Error creating payment config
```

## 🔍 Root Cause

The RLS policies in `create_payment_config_table.sql` are checking admin status using:
```sql
WHERE admins.user_id = auth.uid()
```

However, this approach has issues:
1. The `user_id` field in the `admins` table might be NULL
2. The `user_id` might not be properly linked to the authenticated user
3. Other RLS policies in the codebase use the `is_current_user_admin()` helper function which checks by email

## ✅ Solution

Use the `is_current_user_admin()` helper function instead, which:
- Checks admin status by email (from JWT token)
- Is more reliable than checking `user_id`
- Is already used in other RLS policies
- Is a SECURITY DEFINER function that bypasses RLS (prevents infinite recursion)

## 📋 Steps to Fix

### Step 1: Run the Fix Migration

Run this SQL in Supabase SQL Editor:

```sql
-- File: database/migrations/fix_payment_config_rls.sql
```

Or copy and paste the contents of `database/migrations/fix_payment_config_rls.sql` into Supabase SQL Editor and execute it.

### Step 2: Verify the Fix

1. **Check that policies are updated**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'payment_config';
   ```

2. **Test admin access**:
   - Try creating a payment config in the admin dashboard
   - Should work without 403 error

3. **Verify helper function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';
   ```
   Should return `is_current_user_admin`

### Step 3: Verify Admin Status

Make sure your user is properly set up as an admin:

```sql
-- Check if your email is in the admins table
SELECT * FROM admins WHERE email = 'your-email@example.com';

-- If not, add yourself as admin (replace with your email)
INSERT INTO admins (email, role, status)
VALUES ('your-email@example.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
```

## 🔧 What Changed

### Before (Broken)
```sql
CREATE POLICY "Admins can insert payment configs"
ON payment_config FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);
```

### After (Fixed)
```sql
CREATE POLICY "Admins can insert payment configs"
ON payment_config FOR INSERT
WITH CHECK (is_current_user_admin());
```

## 🎯 Why This Works

1. **Email-based check**: `is_current_user_admin()` checks the email from the JWT token against the `admins` table
2. **No user_id dependency**: Doesn't require `user_id` to be set in the admins table
3. **Consistent**: Uses the same approach as other RLS policies in the codebase
4. **SECURITY DEFINER**: The function runs with elevated privileges, bypassing RLS on the admins table itself

## 🧪 Testing

After applying the fix:

1. ✅ Can create payment configs (no 403 error)
2. ✅ Can update payment configs
3. ✅ Can delete payment configs
4. ✅ Can view all payment configs (active and inactive)
5. ✅ Non-admin users still cannot modify payment configs

## 📝 Related Files

- `database/migrations/create_payment_config_table.sql` - Original migration (has the bug)
- `database/migrations/fix_payment_config_rls.sql` - Fix migration
- `database/migrations/create_admins_table.sql` - Contains `is_current_user_admin()` function

## 🚨 Important Notes

1. **Admin Email Must Match**: The email in the `admins` table must exactly match the email you're logged in with (case-insensitive)
2. **Admin Status Must Be Active**: The admin record must have `status = 'active'`
3. **JWT Token**: The function reads the email from `auth.jwt() ->> 'email'`, which comes from your Supabase auth session

## 🔍 Debugging

If you still get 403 errors after applying the fix:

1. **Check if you're an admin**:
   ```sql
   SELECT * FROM admins WHERE LOWER(email) = LOWER('your-email@example.com');
   ```

2. **Check your JWT email**:
   ```sql
   SELECT auth.jwt() ->> 'email' as current_email;
   ```

3. **Test the helper function**:
   ```sql
   SELECT is_current_user_admin();
   ```
   Should return `true` if you're an admin

4. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'payment_config';
   ```
   `rowsecurity` should be `true`

5. **Check policies exist**:
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'payment_config';
   ```

