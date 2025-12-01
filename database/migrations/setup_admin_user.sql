-- ============================================================================
-- Setup Admin User
-- ============================================================================
-- This migration helps set up an admin user for property management
-- Replace 'mmesomadu240@gmail.com' with your actual email
-- ============================================================================

-- Add yourself as an admin (replace with your email)
INSERT INTO admins (email, role, status)
VALUES ('mmesomadu240@gmail.com', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';

-- Verify the admin was created
SELECT id, email, role, status, created_at 
FROM admins 
WHERE email = 'mmesomadu240@gmail.com';

-- Test if the admin function recognizes you (run this while authenticated)
-- SELECT is_current_user_admin() as is_admin;

