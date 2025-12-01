-- ============================================================================
-- Fix Property Update RLS Policy
-- ============================================================================
-- This migration fixes the UPDATE policy for properties to ensure admins
-- can update any property. The issue is that UPDATE policies need both
-- USING (to select rows) and WITH CHECK (to validate the update).
-- ============================================================================

-- Drop the existing update policy if it exists
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;

-- Recreate the update policy with both USING and WITH CHECK
-- USING: determines which existing rows can be updated
-- WITH CHECK: determines what the updated row can look like
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Also ensure the function exists and is correct
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.role() IS NULL OR auth.role() = 'anon' THEN
        RETURN FALSE;
    END IF;
    
    -- Get email from JWT
    user_email := auth.jwt() ->> 'email';
    
    -- If no email in JWT, return false
    IF user_email IS NULL OR user_email = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if email exists in admins table with active status
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;

-- Add comment
COMMENT ON POLICY "Admins can update all properties" ON properties IS 
    'Allows admins to update any property. Uses both USING and WITH CHECK clauses for proper RLS enforcement.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the policy exists and is correct:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties' AND policyname = 'Admins can update all properties';

-- Test if you can update (run while authenticated as admin):
-- UPDATE properties SET title = title WHERE id = 'your-property-id';
-- (This should work if the policy is correct)

