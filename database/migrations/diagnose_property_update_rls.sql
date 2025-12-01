-- ============================================================================
-- Diagnostic Queries for Property Update RLS Issues
-- ============================================================================
-- Run these queries to diagnose why property updates are failing
-- ============================================================================

-- 1. Check all policies on properties table
SELECT 
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause,
    roles
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- 2. Check if the admin function exists and works
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'is_current_user_admin';

-- 3. Test the admin function (should return true if you're an admin)
SELECT 
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as current_email;

-- 4. Check if you have admin users
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM admins 
WHERE status = 'active'
ORDER BY created_at DESC;

-- 5. Check if your current email matches any admin
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admins
            WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
            AND admins.status = 'active'
        ) THEN 'YES - You are an admin'
        ELSE 'NO - You are not an admin'
    END as admin_status,
    auth.jwt() ->> 'email' as your_email;

-- 6. Check RLS is enabled on properties table
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'properties';

-- 7. List all UPDATE policies specifically
SELECT 
    policyname,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

-- 8. Check if there are any restrictive policies that might block updates
-- (Policies that don't use is_current_user_admin())
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
AND (
    (cmd = 'UPDATE' AND (qual NOT LIKE '%is_current_user_admin%' OR qual IS NULL))
    OR
    (cmd = 'UPDATE' AND (with_check NOT LIKE '%is_current_user_admin%' OR with_check IS NULL))
);

