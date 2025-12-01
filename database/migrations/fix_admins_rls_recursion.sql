-- ============================================================================
-- Fix Admins Table RLS Infinite Recursion
-- ============================================================================
-- This migration fixes the infinite recursion issue in RLS policies
-- Run this if you're getting "infinite recursion detected in policy" errors
-- ============================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Super admins can create admins" ON admins;
DROP POLICY IF EXISTS "Super admins can update admins" ON admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON admins;

-- Drop existing functions if they exist (we'll recreate them properly)
DROP FUNCTION IF EXISTS is_current_user_admin();
DROP FUNCTION IF EXISTS is_current_user_super_admin();
DROP FUNCTION IF EXISTS is_admin(TEXT);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS (must be created before RLS policies)
-- ----------------------------------------------------------------------------

-- Helper function to check if current user is an admin (bypasses RLS)
-- This is used in RLS policies to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
        AND admins.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Helper function to check if current user is a super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
        AND admins.role = 'super_admin'
        AND admins.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Helper function to check if a user is an admin (for use in RLS policies)
-- This function can be used in other table policies
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ----------------------------------------------------------------------------
-- RECREATE RLS POLICIES (using SECURITY DEFINER functions)
-- ----------------------------------------------------------------------------

-- Admins can view all admins (for admin management)
-- Uses SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "Admins can view all admins" ON admins
    FOR SELECT USING (is_current_user_admin());

-- Only super admins can insert new admins
CREATE POLICY "Super admins can create admins" ON admins
    FOR INSERT WITH CHECK (is_current_user_super_admin());

-- Only super admins can update admins
CREATE POLICY "Super admins can update admins" ON admins
    FOR UPDATE USING (is_current_user_super_admin());

-- Only super admins can delete admins
CREATE POLICY "Super admins can delete admins" ON admins
    FOR DELETE USING (is_current_user_super_admin());

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- Add comments
COMMENT ON FUNCTION is_current_user_admin() IS 'Helper function to check if the current authenticated user is an active admin (bypasses RLS)';
COMMENT ON FUNCTION is_current_user_super_admin() IS 'Helper function to check if the current authenticated user is an active super admin (bypasses RLS)';

