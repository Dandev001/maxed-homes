-- ============================================================================
-- Fix Property Status Update RLS Policy
-- ============================================================================
-- This migration specifically fixes the issue where changing property status
-- (e.g., from 'active' to 'inactive') fails with 403 Forbidden error.
-- 
-- The error "new row violates row-level security policy" occurs because
-- the WITH CHECK clause fails during the update operation.
-- ============================================================================

-- Step 1: Ensure the admin check function is working correctly
-- This version is more robust and handles edge cases
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
    is_admin_result BOOLEAN;
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
    -- Use LOWER and TRIM for case-insensitive comparison
    SELECT EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    ) INTO is_admin_result;
    
    -- Return the result (handles NULL case)
    RETURN COALESCE(is_admin_result, FALSE);
    
EXCEPTION
    -- If any error occurs, return false (fail closed for security)
    WHEN OTHERS THEN
        -- Log the error for debugging (optional - remove in production if needed)
        RAISE WARNING 'Error in is_current_user_admin(): %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 2: Drop ALL existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;
DROP POLICY IF EXISTS "Properties can be updated by owners" ON properties;
DROP POLICY IF EXISTS "Hosts can update their properties" ON properties;
-- Add any other UPDATE policy names that might exist

-- Step 3: Create a single, comprehensive UPDATE policy
-- This policy allows admins to update ANY property, including status changes
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (
        -- Allow update if user is admin
        is_current_user_admin()
    )
    WITH CHECK (
        -- Allow the updated row if user is admin
        -- This is critical for status changes - it validates the NEW row values
        is_current_user_admin()
    );

-- Step 4: Add helpful comment
COMMENT ON POLICY "Admins can update all properties" ON properties IS 
    'Allows admins to update any property, including status changes. Both USING and WITH CHECK clauses use is_current_user_admin() to ensure admins can update properties regardless of their current status.';

-- ============================================================================
-- VERIFICATION AND TESTING
-- ============================================================================

-- Test 1: Verify the function works
-- SELECT is_current_user_admin() as is_admin;

-- Test 2: Check your admin status
-- SELECT 
--     auth.jwt() ->> 'email' as your_email,
--     is_current_user_admin() as is_admin,
--     EXISTS (
--         SELECT 1 FROM admins 
--         WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
--         AND status = 'active'
--     ) as admin_exists;

-- Test 3: Verify the policy exists
-- SELECT 
--     policyname,
--     cmd,
--     qual as using_clause,
--     with_check as with_check_clause
-- FROM pg_policies 
-- WHERE tablename = 'properties' 
-- AND cmd = 'UPDATE';

-- Test 4: Test status change (replace with actual property ID)
-- UPDATE properties 
-- SET status = 'inactive' 
-- WHERE id = 'your-property-id-here'
-- RETURNING id, title, status;

-- Test 5: Test changing back to active
-- UPDATE properties 
-- SET status = 'active' 
-- WHERE id = 'your-property-id-here'
-- RETURNING id, title, status;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If status updates still fail:

-- 1. Verify you're an admin:
--    SELECT * FROM admins WHERE status = 'active';

-- 2. Check your JWT email matches:
--    SELECT 
--        auth.jwt() ->> 'email' as jwt_email,
--        email as admin_email
--    FROM admins 
--    WHERE status = 'active';

-- 3. Test the function in the same context:
--    SELECT is_current_user_admin();

-- 4. Check for other UPDATE policies that might conflict:
--    SELECT * FROM pg_policies 
--    WHERE tablename = 'properties' AND cmd = 'UPDATE';

-- 5. If multiple UPDATE policies exist, they're combined with OR.
--    Make sure none are more restrictive than the admin policy.

-- 6. Check RLS is enabled:
--    SELECT tablename, rowsecurity 
--    FROM pg_tables 
--    WHERE schemaname = 'public' AND tablename = 'properties';

