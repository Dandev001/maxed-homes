-- ============================================================================
-- Fix Admin Viewing Inactive Properties
-- ============================================================================
-- This migration ensures admins can view ALL properties including inactive ones
-- by fixing the SELECT policy to properly handle admin access
-- ============================================================================

-- Step 1: Drop the conflicting public policy if it exists
-- We'll recreate it to work alongside the admin policy
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;

-- Step 2: Ensure the admin helper function exists and works correctly
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
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 3: Drop existing admin SELECT policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;

-- Step 4: Create a proper admin policy that allows viewing ALL properties
-- This policy should allow admins to see properties regardless of status
CREATE POLICY "Admins can view all properties" ON properties
    FOR SELECT 
    USING (is_current_user_admin() = true);

-- Step 5: Recreate the public policy for non-admin users (only active properties)
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT 
    USING (status = 'active');

-- Step 6: Verify RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fix:

-- 1. Check all policies on properties table
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- 2. Test if you're recognized as an admin
SELECT 
    is_current_user_admin() as is_admin,
    auth.jwt() ->> 'email' as your_email,
    auth.role() as current_role;

-- 3. Check your admin status in the admins table
-- (Replace with your actual email)
-- SELECT * FROM admins WHERE LOWER(TRIM(email)) = LOWER(TRIM('your-email@example.com'));

-- 4. Test query to see if you can view inactive properties
-- This should return inactive properties if you're an admin
-- SELECT id, title, status FROM properties WHERE status = 'inactive';

