-- ============================================================================
-- Favorites Table Migration
-- ============================================================================
-- This table stores user favorites (saved properties)
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only favorite a property once
    CONSTRAINT unique_guest_property_favorite UNIQUE (guest_id, property_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ----------------------------------------------------------------------------

-- Index for finding all favorites for a guest (most common query)
CREATE INDEX idx_favorites_guest_id ON favorites(guest_id);

-- Index for finding all users who favorited a property
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

-- Composite index for checking if a specific guest favorited a specific property
-- This is optimized for the common query: "Is property X favorited by guest Y?"
CREATE INDEX idx_favorites_guest_property ON favorites(guest_id, property_id);

-- Index for date sorting (newest favorites first)
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Note: No updated_at needed for favorites (they're just created/deleted)

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own favorites
CREATE POLICY "Guests can view own favorites" ON favorites
    FOR SELECT USING (
        -- Allow if the guest_id matches the authenticated user's id
        auth.uid()::text = guest_id::text
        OR
        -- Allow if the guest email matches the authenticated user's email from JWT
        EXISTS (
            SELECT 1 FROM guests 
            WHERE guests.id = favorites.guest_id 
            AND (auth.jwt() ->> 'email')::text = guests.email
        )
    );

-- Users can only create favorites for themselves
CREATE POLICY "Guests can create own favorites" ON favorites
    FOR INSERT WITH CHECK (
        auth.uid()::text = guest_id::text
        OR
        EXISTS (
            SELECT 1 FROM guests 
            WHERE guests.id = favorites.guest_id 
            AND (auth.jwt() ->> 'email')::text = guests.email
        )
    );

-- Users can only delete their own favorites
CREATE POLICY "Guests can delete own favorites" ON favorites
    FOR DELETE USING (
        auth.uid()::text = guest_id::text
        OR
        EXISTS (
            SELECT 1 FROM guests 
            WHERE guests.id = favorites.guest_id 
            AND (auth.jwt() ->> 'email')::text = guests.email
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT SELECT ON favorites TO anon; -- Allow anonymous users to see favorites (but RLS will block if not their own)

-- Add comment
COMMENT ON TABLE favorites IS 'User favorite properties (saved properties)';


