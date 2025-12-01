-- ============================================================================
-- Contact Messages Table Migration
-- ============================================================================
-- This table stores contact form submissions from the website
-- ============================================================================

-- Create ENUM type for contact message status (matches pattern from schema_complete.sql)
CREATE TYPE contact_message_status AS ENUM ('new', 'read', 'replied', 'archived');

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status contact_message_status DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_contact_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ----------------------------------------------------------------------------

-- Index for email lookups (finding messages from specific users)
CREATE INDEX idx_contact_messages_email ON contact_messages(email);

-- Index for status filtering
CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- Index for date sorting (most common query pattern - newest first)
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Composite index for common admin query: filter by status and sort by date
-- This is highly optimized for queries like "get all unread messages ordered by date"
CREATE INDEX idx_contact_messages_status_created_at ON contact_messages(status, created_at DESC);

-- Partial index for unread messages (most common filter in admin dashboards)
-- This index only includes 'new' messages, making it smaller and faster
CREATE INDEX idx_contact_messages_unread ON contact_messages(created_at DESC) 
    WHERE status = 'new';

-- Partial index for non-archived messages (active messages)
-- Useful for queries that exclude archived messages
CREATE INDEX idx_contact_messages_active ON contact_messages(created_at DESC) 
    WHERE status != 'archived';

-- ----------------------------------------------------------------------------
-- RATE LIMITING FUNCTION
-- ----------------------------------------------------------------------------
-- Prevents spam by limiting submissions per email address
-- Default: Max 3 messages per hour per email address
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_contact_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INTEGER;
    rate_limit_per_hour INTEGER := 3; -- Configurable: max messages per hour
    time_window INTERVAL := '1 hour';
BEGIN
    -- Count messages from this email in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM contact_messages
    WHERE email = NEW.email
    AND created_at > NOW() - time_window;
    
    -- If rate limit exceeded, raise exception
    IF recent_count >= rate_limit_per_hour THEN
        RAISE EXCEPTION 'Rate limit exceeded. You can only submit % messages per hour. Please try again later.', 
            rate_limit_per_hour;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting (runs before insert)
CREATE TRIGGER trigger_check_contact_rate_limit
    BEFORE INSERT ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION check_contact_message_rate_limit();

-- Create trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert contact messages (public form)
CREATE POLICY "Anyone can create contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only authenticated users (admins) can view contact messages
-- Note: You may want to adjust this based on your admin authentication setup
CREATE POLICY "Authenticated users can view contact messages" ON contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update contact messages
CREATE POLICY "Authenticated users can update contact messages" ON contact_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT INSERT ON contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON contact_messages TO authenticated;

-- Add comment
COMMENT ON TABLE contact_messages IS 'Contact form submissions from the website';

