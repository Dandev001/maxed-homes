-- ============================================================================
-- Admins Table Migration
-- ============================================================================
-- This table stores admin users with role-based access control
-- ============================================================================

-- Create ENUM type for admin roles
CREATE TYPE admin_role AS ENUM ('admin', 'super_admin', 'moderator');

-- Create ENUM type for admin status
CREATE TYPE admin_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role admin_role DEFAULT 'admin',
    status admin_status DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_admin_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ----------------------------------------------------------------------------

-- Index for email lookups (most common query - checking if user is admin)
CREATE INDEX idx_admins_email ON admins(email);

-- Index for user_id lookups (when linking to auth.users)
CREATE INDEX idx_admins_user_id ON admins(user_id) WHERE user_id IS NOT NULL;

-- Index for status filtering (active admins)
CREATE INDEX idx_admins_status ON admins(status) WHERE status = 'active';

-- Index for role filtering
CREATE INDEX idx_admins_role ON admins(role);

-- Composite index for common query: active admins by email
CREATE INDEX idx_admins_active_email ON admins(email) WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Create trigger for updated_at
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Anyone can check if their own email is an admin (for admin status checks)
-- This allows the isAdminEmail function to work without requiring admin access
CREATE POLICY "Users can check own admin status" ON admins
    FOR SELECT USING (
        LOWER(TRIM(admins.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    );

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
GRANT SELECT ON admins TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;

-- Add comments
COMMENT ON TABLE admins IS 'Admin users with role-based access control';
COMMENT ON FUNCTION is_admin(TEXT) IS 'Helper function to check if a user email is an active admin';
COMMENT ON FUNCTION is_current_user_admin() IS 'Helper function to check if the current authenticated user is an active admin (bypasses RLS)';
COMMENT ON FUNCTION is_current_user_super_admin() IS 'Helper function to check if the current authenticated user is an active super admin (bypasses RLS)';

