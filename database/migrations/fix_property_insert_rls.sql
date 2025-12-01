-- ============================================================================
-- Fix Property Insert RLS Policy Issue
-- ============================================================================
-- This migration ensures admins can insert properties by:
-- 1. Verifying the is_current_user_admin() function exists and works
-- 2. Ensuring admin policies are properly set up
-- 3. Adding a fallback policy if needed
-- ============================================================================

-- First, ensure the helper function exists and is correct
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

-- Drop existing admin insert policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;

-- Recreate the admin insert policy
CREATE POLICY "Admins can insert properties" ON properties
    FOR INSERT 
    WITH CHECK (is_current_user_admin());

-- Also ensure hosts can still insert their own properties (if that policy exists)
-- This is a fallback in case the admin check fails
-- Note: This might already exist from schema_complete.sql

-- Add a comment
COMMENT ON POLICY "Admins can insert properties" ON properties IS 
    'Allows authenticated users with active admin status to create new properties';

-- ============================================================================
-- DIAGNOSTIC QUERIES (run these to check your setup)
-- ============================================================================

-- 1. Check if you have admin users:
-- SELECT id, email, role, status FROM admins;

-- 2. Check your current authenticated user's email:
-- SELECT auth.jwt() ->> 'email' as current_email, auth.role() as current_role;

-- 3. Test if the function works for your user:
-- SELECT is_current_user_admin() as is_admin;

-- 4. Check all policies on properties table:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'properties';

-- 5. If you need to add yourself as an admin (replace with your email):
-- INSERT INTO admins (email, role, status)
-- VALUES ('your-email@example.com', 'admin', 'active')
-- ON CONFLICT (email) DO UPDATE SET status = 'active';

