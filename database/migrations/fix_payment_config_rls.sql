-- Fix payment_config RLS policies to use is_current_user_admin() helper function
-- This function checks admin status by email (from JWT) instead of user_id
-- This is more reliable and consistent with other RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all payment configs" ON payment_config;
DROP POLICY IF EXISTS "Admins can insert payment configs" ON payment_config;
DROP POLICY IF EXISTS "Admins can update payment configs" ON payment_config;
DROP POLICY IF EXISTS "Admins can delete payment configs" ON payment_config;

-- Recreate policies using is_current_user_admin() helper function
-- This function is SECURITY DEFINER and bypasses RLS, preventing infinite recursion

-- Policy: Only admins can view all payment configs (including inactive)
CREATE POLICY "Admins can view all payment configs"
ON payment_config FOR SELECT
USING (is_current_user_admin());

-- Policy: Only admins can insert payment configs
CREATE POLICY "Admins can insert payment configs"
ON payment_config FOR INSERT
WITH CHECK (is_current_user_admin());

-- Policy: Only admins can update payment configs
CREATE POLICY "Admins can update payment configs"
ON payment_config FOR UPDATE
USING (is_current_user_admin());

-- Policy: Only admins can delete payment configs
CREATE POLICY "Admins can delete payment configs"
ON payment_config FOR DELETE
USING (is_current_user_admin());

-- Grant execute permission on the helper function (if not already granted)
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;

-- Add comment
COMMENT ON POLICY "Admins can view all payment configs" ON payment_config IS 
'Allows admins to view all payment configs (active and inactive) using is_current_user_admin() helper function';

COMMENT ON POLICY "Admins can insert payment configs" ON payment_config IS 
'Allows admins to create new payment configs using is_current_user_admin() helper function';

COMMENT ON POLICY "Admins can update payment configs" ON payment_config IS 
'Allows admins to update payment configs using is_current_user_admin() helper function';

COMMENT ON POLICY "Admins can delete payment configs" ON payment_config IS 
'Allows admins to delete payment configs using is_current_user_admin() helper function';

