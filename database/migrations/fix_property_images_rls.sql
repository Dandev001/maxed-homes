-- ============================================================================
-- Fix Property Images RLS Policy
-- ============================================================================
-- This migration fixes the RLS policies for property_images table to ensure
-- admins can insert, update, and delete property images.
-- ============================================================================

-- Ensure the helper function exists
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

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can manage all property images" ON property_images;

-- Recreate the policy with both USING and WITH CHECK
-- FOR ALL requires both clauses to work for INSERT, UPDATE, and DELETE
CREATE POLICY "Admins can manage all property images" ON property_images
    FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Add comment
COMMENT ON POLICY "Admins can manage all property images" ON property_images IS 
    'Allows admins to insert, update, and delete any property image. Uses both USING and WITH CHECK for proper RLS enforcement.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the policy exists and is correct:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'property_images' 
-- AND policyname = 'Admins can manage all property images';

-- You should see:
-- cmd: ALL
-- qual (USING): is_current_user_admin()
-- with_check: is_current_user_admin()

