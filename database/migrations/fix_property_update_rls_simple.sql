-- ============================================================================
-- SIMPLE FIX: Property Update RLS Policy
-- ============================================================================
-- Run this to fix the 403 error when updating property status
-- ============================================================================

-- Step 1: Ensure admin function exists and works
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    user_role := auth.role();
    
    IF user_role IS NULL OR user_role = 'anon' THEN
        RETURN FALSE;
    END IF;
    
    user_email := auth.jwt() ->> 'email';
    
    IF user_email IS NULL OR user_email = '' OR TRIM(user_email) = '' THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon, service_role;

-- Step 2: Drop ALL UPDATE policies (to avoid conflicts)
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

-- Step 3: Create the UPDATE policy
CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin() = true)
    WITH CHECK (is_current_user_admin() = true);

-- Step 4: Verify it worked
SELECT 
    'Policy created successfully!' as status,
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE'
AND policyname = 'Admins can update all properties';

