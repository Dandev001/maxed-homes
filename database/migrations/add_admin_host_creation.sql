-- ============================================================================
-- Add Admin Host Creation Support
-- ============================================================================
-- This migration allows admins to create host records for themselves
-- and ensures admins can insert into the hosts table
-- ============================================================================

-- Allow admins to insert hosts (for auto-creating host records)
CREATE POLICY "Admins can insert hosts" ON hosts
    FOR INSERT 
    WITH CHECK (is_current_user_admin());

-- Allow admins to update any host (for managing host records)
CREATE POLICY "Admins can update all hosts" ON hosts
    FOR UPDATE 
    USING (is_current_user_admin());

-- Add comment
COMMENT ON POLICY "Admins can insert hosts" ON hosts IS 
    'Allows admins to create host records, useful for auto-creating host records for admin users';

COMMENT ON POLICY "Admins can update all hosts" ON hosts IS 
    'Allows admins to update any host record for management purposes';

