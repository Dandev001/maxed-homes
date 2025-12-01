-- ============================================================================
-- Add Admin RLS Policies for Properties Table
-- ============================================================================
-- This migration adds RLS policies to allow admins to view and manage
-- all properties regardless of status
-- ============================================================================

-- First, ensure the helper function exists (from fix_admins_rls_recursion.sql)
-- If it doesn't exist, create it
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- PROPERTIES TABLE ADMIN POLICIES
-- ----------------------------------------------------------------------------

-- Allow admins to view ALL properties (including inactive)
CREATE POLICY "Admins can view all properties" ON properties
    FOR SELECT USING (
        is_current_user_admin() OR status = 'active'
    );

-- Allow admins to insert properties
CREATE POLICY "Admins can insert properties" ON properties
    FOR INSERT WITH CHECK (is_current_user_admin());

-- Allow admins to update all properties
-- Note: UPDATE policies need both USING (to select rows) and WITH CHECK (to validate updates)
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- Allow admins to delete properties
CREATE POLICY "Admins can delete properties" ON properties
    FOR DELETE USING (is_current_user_admin());

-- ----------------------------------------------------------------------------
-- PROPERTY IMAGES TABLE ADMIN POLICIES
-- ----------------------------------------------------------------------------

-- Drop existing policy if it exists (to recreate with proper clauses)
DROP POLICY IF EXISTS "Admins can manage all property images" ON property_images;

-- Allow admins to manage all property images
-- FOR ALL requires both USING and WITH CHECK for all operations
CREATE POLICY "Admins can manage all property images" ON property_images
    FOR ALL 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- ----------------------------------------------------------------------------
-- HOSTS TABLE ADMIN POLICIES (for property creation)
-- ----------------------------------------------------------------------------

-- Allow admins to view all hosts (needed for property creation)
CREATE POLICY "Admins can view all hosts" ON hosts
    FOR SELECT USING (
        is_current_user_admin() OR status = 'active'
    );

-- Add comments
COMMENT ON POLICY "Admins can view all properties" ON properties IS 
    'Allows admins to view all properties regardless of status, while public can only see active properties';

COMMENT ON POLICY "Admins can insert properties" ON properties IS 
    'Allows admins to create new properties';

COMMENT ON POLICY "Admins can update all properties" ON properties IS 
    'Allows admins to update any property';

COMMENT ON POLICY "Admins can delete properties" ON properties IS 
    'Allows admins to delete any property';

