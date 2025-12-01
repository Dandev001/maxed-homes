-- ============================================================================
-- AGGRESSIVE FIX: Property Update RLS Policy
-- ============================================================================
-- This will completely reset and fix the UPDATE policy
-- Run this if the simple fix didn't work
-- ============================================================================

-- Step 1: Show current state (for debugging)
SELECT '=== CURRENT STATE ===' as info;

SELECT 
    'Current policies' as check_type,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

SELECT 
    'Admin function test' as check_type,
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as your_email;

-- Step 2: Drop ALL UPDATE policies (no exceptions)
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
        RAISE NOTICE 'Dropping policy: %', r.policyname;
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', r.policyname);
    END LOOP;
END $$;

-- Step 3: Recreate the admin function with better error handling
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
    admin_exists BOOLEAN;
BEGIN
    -- Get role
    user_role := auth.role();
    
    -- Check authentication
    IF user_role IS NULL OR user_role = 'anon' THEN
        RAISE NOTICE 'User not authenticated: role = %', user_role;
        RETURN FALSE;
    END IF;
    
    -- Get email
    user_email := auth.jwt() ->> 'email';
    
    IF user_email IS NULL OR user_email = '' OR TRIM(user_email) = '' THEN
        RAISE NOTICE 'No email in JWT';
        RETURN FALSE;
    END IF;
    
    -- Check admin table
    SELECT EXISTS (
        SELECT 1 
        FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    ) INTO admin_exists;
    
    IF admin_exists THEN
        RAISE NOTICE 'User is admin: %', user_email;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User is NOT admin: %', user_email;
        RETURN FALSE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in is_current_user_admin(): %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 4: Create the UPDATE policy (simple and direct)
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Step 5: Verify RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Step 6: Show final state
SELECT '=== FINAL STATE ===' as info;

SELECT 
    'New policy' as check_type,
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

-- Step 7: Test the function
SELECT 
    'Function test' as check_type,
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as your_email;

-- Step 8: Show admin users
SELECT 
    'Admin users' as check_type,
    email,
    role,
    status
FROM admins 
WHERE status = 'active';

