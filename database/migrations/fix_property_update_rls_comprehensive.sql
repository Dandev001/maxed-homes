-- ============================================================================
-- Comprehensive Fix for Property Update RLS Policy
-- ============================================================================
-- This migration fixes the UPDATE policy for properties to ensure admins
-- can update any property, including status changes.
-- 
-- The error "new row violates row-level security policy" occurs when the
-- WITH CHECK clause fails. This fix ensures the function and policy work correctly.
-- ============================================================================

-- Step 1: Ensure the admin check function is robust and correct
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
    IF user_email IS NULL OR user_email = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if email exists in admins table with active status
    -- Use LOWER and TRIM for case-insensitive comparison
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
EXCEPTION
    -- If any error occurs, return false (fail closed)
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 2: Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;

-- Step 3: Recreate the UPDATE policy with both USING and WITH CHECK
-- USING: determines which existing rows can be updated
-- WITH CHECK: determines what the updated row can look like
-- Both must pass for the update to succeed
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Step 4: Ensure there are no conflicting policies
-- Check if there are any other UPDATE policies that might conflict
-- (This is informational - you may need to drop conflicting policies manually)

-- Step 5: Add helpful comment
COMMENT ON POLICY "Admins can update all properties" ON properties IS 
    'Allows admins to update any property. Both USING and WITH CHECK clauses ensure the update is allowed for both the existing row and the new row values.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the policy exists and is correct:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties' AND policyname = 'Admins can update all properties';

-- Check all policies on properties table:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties'
-- ORDER BY cmd, policyname;

-- Test the admin function (replace with your email):
-- SELECT is_current_user_admin();

-- Test if you can update (run while authenticated as admin):
-- UPDATE properties SET status = 'active' WHERE id = 'your-property-id';
-- (This should work if the policy is correct)

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If updates still fail:
-- 1. Verify you're logged in as an admin:
--    SELECT * FROM admins WHERE status = 'active';
--
-- 2. Check your JWT contains email:
--    SELECT auth.jwt() ->> 'email' as current_email;
--
-- 3. Test the function directly:
--    SELECT is_current_user_admin();
--
-- 4. Check for conflicting policies:
--    SELECT * FROM pg_policies WHERE tablename = 'properties' AND cmd = 'UPDATE';
--
-- 5. If there are multiple UPDATE policies, they are combined with OR, so make sure
--    none of them are blocking the update.

