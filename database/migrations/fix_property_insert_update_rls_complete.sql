-- ============================================================================
-- COMPLETE FIX: Property INSERT and UPDATE RLS Policies
-- ============================================================================
-- This migration fixes both INSERT (create) and UPDATE (modify) operations
-- for properties. It ensures admins can create and update properties without
-- getting 403 Forbidden errors.
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
    IF user_email IS NULL OR user_email = '' OR TRIM(user_email) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if email exists in admins table with active status
    -- Use SECURITY DEFINER to bypass RLS on admins table
    -- Use LOWER and TRIM for case-insensitive comparison
    RETURN EXISTS (
        SELECT 1 
        FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
    
EXCEPTION
    -- If any error occurs, return false (fail closed for security)
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 2: Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 3: Drop ALL existing INSERT policies on properties table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties' 
        AND cmd = 'INSERT'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', r.policyname);
    END LOOP;
END $$;

-- Step 4: Drop ALL existing UPDATE policies on properties table
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', r.policyname);
    END LOOP;
END $$;

-- Step 5: Create INSERT policy for admins
-- INSERT policies only need WITH CHECK (no USING clause)
CREATE POLICY "Admins can insert properties" ON properties
    FOR INSERT 
    WITH CHECK (is_current_user_admin() = true);

-- Step 6: Create UPDATE policy for admins
-- UPDATE policies need both USING (to select rows) and WITH CHECK (to validate updates)
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin() = true)
    WITH CHECK (is_current_user_admin() = true);

-- Step 7: Verify RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Step 8: Add helpful comments
COMMENT ON POLICY "Admins can insert properties" ON properties IS 
    'Allows admins to create new properties. The WITH CHECK clause validates that the user is an admin before allowing the insert.';

COMMENT ON POLICY "Admins can update all properties" ON properties IS 
    'Allows admins to update any property, including status changes. Both USING and WITH CHECK clauses ensure the update is allowed for both the existing row and the new row values.';

-- ============================================================================
-- IMMEDIATE VERIFICATION
-- ============================================================================
-- Run these queries right after the migration to verify everything works:

-- 1. Check if you're an admin (should return true)
SELECT 
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as your_email;

-- 2. Check all INSERT policies
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'INSERT';

-- 3. Check all UPDATE policies
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

-- 4. Check all policies on properties (to see if there are conflicts)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY cmd, policyname;

-- 5. Test INSERT (this should work if you're an admin)
-- Note: You'll need to provide a valid host_id
-- INSERT INTO properties (
--     host_id,
--     title,
--     description,
--     property_type,
--     bedrooms,
--     bathrooms,
--     max_guests,
--     price_per_night,
--     address,
--     city,
--     state,
--     country,
--     status
-- ) VALUES (
--     'your-host-id-here',
--     'Test Property',
--     'Test Description',
--     'house',
--     2,
--     1,
--     4,
--     100.00,
--     '123 Test St',
--     'Test City',
--     'Test State',
--     'Benin',
--     'active'
-- ) RETURNING id, title, status;

-- 6. Test UPDATE (replace with actual property ID)
-- UPDATE properties 
-- SET status = 'inactive' 
-- WHERE id = 'your-property-id-here'
-- RETURNING id, title, status;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If INSERT or UPDATE still fails:

-- A. Check your admin record exists and matches your email
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM admins 
WHERE status = 'active';

-- B. Check if your JWT email matches any admin
SELECT 
    auth.jwt() ->> 'email' as jwt_email,
    a.email as admin_email,
    a.status as admin_status,
    CASE 
        WHEN LOWER(TRIM(a.email)) = LOWER(TRIM(auth.jwt() ->> 'email')) 
        THEN 'MATCH' 
        ELSE 'NO MATCH' 
    END as match_status
FROM admins a
WHERE a.status = 'active';

-- C. If your email is not in admins table, add it:
-- INSERT INTO admins (email, role, status)
-- VALUES ('your-email@example.com', 'admin', 'active')
-- ON CONFLICT (email) DO UPDATE SET status = 'active';

-- D. Check if there are any triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'properties';

-- E. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'properties';

