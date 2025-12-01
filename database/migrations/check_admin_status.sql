-- ============================================================================
-- Check Your Admin Status
-- ============================================================================
-- Run this to verify you're set up as an admin
-- ============================================================================

-- 1. Check if you're recognized as an admin
SELECT 
    is_current_user_admin() as is_admin,
    auth.role() as current_role,
    auth.jwt() ->> 'email' as your_email;

-- 2. Check all admin users
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM admins 
WHERE status = 'active'
ORDER BY created_at DESC;

-- 3. Check if your email matches any admin
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admins
            WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
            AND admins.status = 'active'
        ) THEN '✅ YES - You are an admin'
        ELSE '❌ NO - You are NOT an admin'
    END as admin_status,
    auth.jwt() ->> 'email' as your_email;

-- 4. If you're not an admin, add yourself (replace with your email):
-- INSERT INTO admins (email, role, status)
-- VALUES ('your-email@example.com', 'admin', 'active')
-- ON CONFLICT (email) DO UPDATE SET status = 'active';

-- 5. Check all UPDATE policies on properties
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'UPDATE';

