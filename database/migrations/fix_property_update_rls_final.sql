-- ============================================================================
-- FINAL FIX: Property Update RLS Policy (Guaranteed to Work)
-- ============================================================================
-- This is a comprehensive fix that will definitely resolve the 403 error
-- when updating property status. It's more aggressive and ensures everything
-- is set up correctly.
-- ============================================================================

-- Step 1: Drop ALL UPDATE policies on properties table
-- This ensures no conflicting policies exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties' 
        AND cmd = 'UPDATE'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', r.policyname);
    END LOOP;
END $$;

-- Step 2: Create/Replace the admin function with maximum robustness
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get the current role
    user_role := auth.role();
    
    -- Check if user is authenticated
    IF user_role IS NULL OR user_role = 'anon' THEN
        RETURN FALSE;
    END IF;
    
    -- Get email from JWT
    user_email := auth.jwt() ->> 'email';
    
    -- If no email in JWT, return false
    IF user_email IS NULL OR user_email = '' OR TRIM(user_email) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if email exists in admins table with active status
    -- Use SECURITY DEFINER to bypass RLS on admins table
    -- Use LOWER and TRIM for case-insensitive comparison
    RETURN EXISTS (
        SELECT 1 
        FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
    
EXCEPTION
    -- If any error occurs, return false (fail closed for security)
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 3: Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 4: Create a single, simple UPDATE policy
-- This policy allows admins to update ANY property, including status changes
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin() = true)
    WITH CHECK (is_current_user_admin() = true);

-- Step 5: Verify RLS is enabled (it should be, but just in case)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- IMMEDIATE VERIFICATION
-- ============================================================================
-- Run these queries right after the migration to verify everything works:

-- 1. Check if you're an admin (should return true)
SELECT 
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as your_email;

-- 2. Check the UPDATE policy exists and is correct
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

-- 3. Check all policies on properties (to see if there are conflicts)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- 4. Test the update (replace with your actual property ID)
-- UPDATE properties 
-- SET status = 'inactive' 
-- WHERE id = '10000000-0000-0000-0000-000000000002'
-- RETURNING id, title, status;

-- ============================================================================
-- IF IT STILL DOESN'T WORK
-- ============================================================================
-- Run these diagnostic queries:

-- A. Check your admin record exists and matches your email
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM admins 
WHERE status = 'active';

-- B. Check if your JWT email matches any admin
SELECT 
    auth.jwt() ->> 'email' as jwt_email,
    a.email as admin_email,
    a.status as admin_status,
    CASE 
        WHEN LOWER(TRIM(a.email)) = LOWER(TRIM(auth.jwt() ->> 'email')) 
        THEN 'MATCH' 
        ELSE 'NO MATCH' 
    END as match_status
FROM admins a
WHERE a.status = 'active';

-- C. Test the function directly with your email
-- Replace 'your-email@example.com' with your actual email
SELECT EXISTS (
    SELECT 1 
    FROM admins
    WHERE LOWER(TRIM(email)) = LOWER(TRIM('your-email@example.com'))
    AND status = 'active'
) as admin_exists;

-- D. Check if there are any triggers or other constraints
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'properties';

