-- ============================================================================
-- Fix Property Delete RLS Policy
-- ============================================================================
-- This migration ensures the DELETE policy for properties is correctly
-- configured to allow admins to delete any property.
-- ============================================================================

-- Drop the existing delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;

-- Recreate the delete policy
-- DELETE policies only need USING clause (no WITH CHECK needed)
CREATE POLICY "Admins can delete properties" ON properties
    FOR DELETE USING (is_current_user_admin());

-- Ensure the function exists and is correct
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
COMMENT ON POLICY "Admins can delete properties" ON properties IS 
    'Allows admins to delete any property. Uses is_current_user_admin() function to verify admin status.';

