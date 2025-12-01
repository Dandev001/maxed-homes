-- ============================================================================
-- Seed Initial Admins
-- ============================================================================
-- This migration seeds the initial admin emails from the hardcoded list
-- Run this after creating the admins table
-- ============================================================================

-- Insert initial admin emails
-- These are the emails that were previously hardcoded in src/utils/admin.ts
INSERT INTO admins (email, role, status, user_id)
VALUES 
    ('admin@maxedhomes.com', 'super_admin', 'active', NULL),
    ('mmesomadu240@gmail.com', 'super_admin', 'active', NULL)
ON CONFLICT (email) DO NOTHING;

-- Note: user_id is set to NULL initially
-- You can update these later to link to actual auth.users records if needed:
-- UPDATE admins SET user_id = (SELECT id FROM auth.users WHERE email = admins.email) WHERE user_id IS NULL;

