-- ============================================================================
-- Maxed Homes - Complete Database Schema
-- Production-Ready, Optimized, and Well-Connected
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- This creates all tables, indexes, triggers, and security policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- CUSTOM TYPES (ENUMS)
-- ----------------------------------------------------------------------------
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'maintenance', 'sold');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
CREATE TYPE guest_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE host_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- ----------------------------------------------------------------------------
-- 1. HOSTS TABLE (Property Owners/Managers)
-- ----------------------------------------------------------------------------
CREATE TABLE hosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    profile_image_url TEXT,
    bio TEXT,
    status host_status DEFAULT 'pending_verification',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_host_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- 2. PROPERTIES TABLE (Main Property Data)
-- ----------------------------------------------------------------------------
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL, -- 'house', 'apartment', 'condo', 'townhouse', 'villa', 'studio'
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms DECIMAL(3,1) NOT NULL CHECK (bathrooms > 0),
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    area_sqft INTEGER CHECK (area_sqft > 0),
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night >= 0),
    cleaning_fee DECIMAL(10,2) DEFAULT 0 CHECK (cleaning_fee >= 0),
    security_deposit DECIMAL(10,2) DEFAULT 0 CHECK (security_deposit >= 0),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    amenities TEXT[] DEFAULT '{}',
    house_rules TEXT,
    cancellation_policy TEXT,
    safety_property TEXT,
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    minimum_nights INTEGER DEFAULT 1 CHECK (minimum_nights >= 1),
    maximum_nights INTEGER CHECK (maximum_nights IS NULL OR maximum_nights >= minimum_nights),
    status property_status DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND 
         latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- ----------------------------------------------------------------------------
-- 3. PROPERTY_IMAGES TABLE (Image Management)
-- ----------------------------------------------------------------------------
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow both HTTP/HTTPS URLs and local paths (for development)
    CONSTRAINT valid_image_url CHECK (
        image_url ~* '^https?://' OR 
        image_url ~* '^/' OR 
        image_url ~* '^\./'
    )
);

-- Unique constraint: Only one primary image per property
CREATE UNIQUE INDEX idx_property_images_unique_primary 
    ON property_images(property_id) 
    WHERE is_primary = true;

-- ----------------------------------------------------------------------------
-- 4. GUESTS TABLE (Guest Information)
-- ----------------------------------------------------------------------------
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    status guest_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_guest_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_date_of_birth CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE)
);

-- ----------------------------------------------------------------------------
-- 5. BOOKINGS TABLE (Reservation System)
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    total_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    cleaning_fee DECIMAL(10,2) DEFAULT 0 CHECK (cleaning_fee >= 0),
    security_deposit DECIMAL(10,2) DEFAULT 0 CHECK (security_deposit >= 0),
    taxes DECIMAL(10,2) DEFAULT 0 CHECK (taxes >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_booking_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_booking_amount CHECK (total_amount = base_price + cleaning_fee + taxes)
);

-- ----------------------------------------------------------------------------
-- 6. AVAILABILITY_CALENDAR TABLE (Date Management)
-- ----------------------------------------------------------------------------
CREATE TABLE availability_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price_override DECIMAL(10,2) CHECK (price_override IS NULL OR price_override >= 0),
    minimum_nights_override INTEGER CHECK (minimum_nights_override IS NULL OR minimum_nights_override >= 1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id, date),
    CONSTRAINT valid_availability_date CHECK (date >= CURRENT_DATE)
);

-- ----------------------------------------------------------------------------
-- 7. REVIEWS TABLE (Ratings and Reviews)
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    cleanliness_rating INTEGER CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5)),
    communication_rating INTEGER CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5)),
    location_rating INTEGER CHECK (location_rating IS NULL OR (location_rating >= 1 AND location_rating <= 5)),
    value_rating INTEGER CHECK (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 5)),
    status review_status DEFAULT 'pending',
    host_response TEXT,
    host_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One review per booking
    UNIQUE(booking_id)
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ----------------------------------------------------------------------------

-- Hosts indexes
CREATE INDEX idx_hosts_email ON hosts(email);
CREATE INDEX idx_hosts_status ON hosts(status);
CREATE INDEX idx_hosts_verified ON hosts(is_verified) WHERE is_verified = true;

-- Properties indexes
CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_properties_status ON properties(status) WHERE status = 'active';
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_state ON properties(state);
CREATE INDEX idx_properties_price ON properties(price_per_night);
CREATE INDEX idx_properties_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_location ON properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_properties_amenities ON properties USING GIN (amenities);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

-- Property images indexes
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_display_order ON property_images(property_id, display_order);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

-- Guests indexes
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_status ON guests(status);

-- Bookings indexes
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_property_dates ON bookings(property_id, check_in_date, check_out_date) WHERE status IN ('confirmed', 'pending');
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Availability calendar indexes
CREATE INDEX idx_availability_property_date ON availability_calendar(property_id, date);
CREATE INDEX idx_availability_date_range ON availability_calendar(date) WHERE is_available = true;
CREATE INDEX idx_availability_property_available ON availability_calendar(property_id, date) WHERE is_available = true;

-- Reviews indexes
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_guest_id ON reviews(guest_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status) WHERE status = 'approved';
CREATE INDEX idx_reviews_rating ON reviews(property_id, rating) WHERE status = 'approved';
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC) WHERE status = 'approved';

-- ----------------------------------------------------------------------------
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_hosts_updated_at 
    BEFORE UPDATE ON hosts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at 
    BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON availability_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- BUSINESS LOGIC FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Function to check max guests constraint
CREATE OR REPLACE FUNCTION check_booking_max_guests()
RETURNS TRIGGER AS $$
DECLARE
    max_guests_allowed INTEGER;
BEGIN
    SELECT max_guests INTO max_guests_allowed
    FROM properties
    WHERE id = NEW.property_id;
    
    IF NEW.guests_count > max_guests_allowed THEN
        RAISE EXCEPTION 'Guest count (%) exceeds maximum guests (%) for this property', 
            NEW.guests_count, max_guests_allowed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_guests
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_booking_max_guests();

-- Function to prevent overlapping bookings
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = NEW.property_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status IN ('confirmed', 'pending')
        AND (
            (check_in_date <= NEW.check_in_date AND check_out_date > NEW.check_in_date) OR
            (check_in_date < NEW.check_out_date AND check_out_date >= NEW.check_out_date) OR
            (check_in_date >= NEW.check_in_date AND check_out_date <= NEW.check_out_date)
        )
    ) THEN
        RAISE EXCEPTION 'Booking dates overlap with an existing booking';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_booking_overlap
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW 
    WHEN (NEW.status IN ('confirmed', 'pending'))
    EXECUTE FUNCTION check_booking_overlap();

-- Function to update host_response_at when host responds
CREATE OR REPLACE FUNCTION update_host_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.host_response IS NOT NULL AND OLD.host_response IS NULL THEN
        NEW.host_response_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_host_response_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_host_response_timestamp();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- HOSTS POLICIES
-- Public can view active hosts
CREATE POLICY "Hosts are viewable by everyone" ON hosts
    FOR SELECT USING (status = 'active');

-- Hosts can update their own profile
CREATE POLICY "Hosts can update own profile" ON hosts
    FOR UPDATE USING (auth.uid()::text = id::text);

-- PROPERTIES POLICIES
-- Public can view active properties
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (status = 'active');

-- Hosts can manage their own properties
CREATE POLICY "Hosts can insert own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid()::text = host_id::text);

CREATE POLICY "Hosts can update own properties" ON properties
    FOR UPDATE USING (auth.uid()::text = host_id::text);

-- PROPERTY IMAGES POLICIES
-- Public can view all property images
CREATE POLICY "Property images are viewable by everyone" ON property_images
    FOR SELECT USING (true);

-- Hosts can manage images for their properties
CREATE POLICY "Hosts can manage own property images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_images.property_id
            AND properties.host_id::text = auth.uid()::text
        )
    );

-- GUESTS POLICIES
-- Guests can view and update their own profile
CREATE POLICY "Guests can view own profile" ON guests
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Guests can update own profile" ON guests
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Guests can insert own profile" ON guests
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- BOOKINGS POLICIES
-- Guests can view their own bookings
CREATE POLICY "Guests can view own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = guest_id::text);

-- Hosts can view bookings for their properties
CREATE POLICY "Hosts can view own property bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = bookings.property_id
            AND properties.host_id::text = auth.uid()::text
        )
    );

-- Guests can create bookings
CREATE POLICY "Guests can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text = guest_id::text);

-- Guests can update their own bookings (for cancellation, etc.)
CREATE POLICY "Guests can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid()::text = guest_id::text);

-- AVAILABILITY CALENDAR POLICIES
-- Public can view availability
CREATE POLICY "Availability is viewable by everyone" ON availability_calendar
    FOR SELECT USING (true);

-- Hosts can manage availability for their properties
CREATE POLICY "Hosts can manage own property availability" ON availability_calendar
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = availability_calendar.property_id
            AND properties.host_id::text = auth.uid()::text
        )
    );

-- REVIEWS POLICIES
-- Public can view approved reviews
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
    FOR SELECT USING (status = 'approved');

-- Guests can view their own reviews (including pending)
CREATE POLICY "Guests can view own reviews" ON reviews
    FOR SELECT USING (auth.uid()::text = guest_id::text);

-- Guests can create reviews for their bookings
CREATE POLICY "Guests can create reviews for own bookings" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid()::text = guest_id::text AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.guest_id::text = auth.uid()::text
        )
    );

-- Hosts can view and respond to reviews for their properties
CREATE POLICY "Hosts can view property reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = reviews.property_id
            AND properties.host_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Hosts can respond to property reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = reviews.property_id
            AND properties.host_id::text = auth.uid()::text
        )
    );

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR COMMON QUERIES
-- ----------------------------------------------------------------------------

-- Function to get property average rating
CREATE OR REPLACE FUNCTION get_property_rating(property_uuid UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(*)::bigint as total_reviews
    FROM reviews
    WHERE property_id = property_uuid
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if dates are available
CREATE OR REPLACE FUNCTION check_property_availability(
    property_uuid UUID,
    check_in DATE,
    check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN := true;
    blocked_date DATE;
BEGIN
    -- Check for overlapping bookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = property_uuid
        AND status IN ('confirmed', 'pending')
        AND (
            (check_in_date <= check_in AND check_out_date > check_in) OR
            (check_in_date < check_out AND check_out_date >= check_out) OR
            (check_in_date >= check_in AND check_out_date <= check_out)
        )
    ) THEN
        RETURN false;
    END IF;
    
    -- Check availability calendar for blocked dates
    FOR blocked_date IN 
        SELECT date FROM availability_calendar
        WHERE property_id = property_uuid
        AND date >= check_in
        AND date < check_out
        AND is_available = false
    LOOP
        RETURN false;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- GRANT PERMISSIONS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- COMMENTS FOR DOCUMENTATION
-- ----------------------------------------------------------------------------
COMMENT ON TABLE hosts IS 'Property owners and managers';
COMMENT ON TABLE properties IS 'Main property listings';
COMMENT ON TABLE property_images IS 'Property image gallery';
COMMENT ON TABLE guests IS 'Guest/user accounts';
COMMENT ON TABLE bookings IS 'Reservation and booking records';
COMMENT ON TABLE availability_calendar IS 'Property availability and pricing overrides';
COMMENT ON TABLE reviews IS 'Guest reviews and ratings for properties';

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Set up authentication in Supabase Dashboard
-- 2. Link auth.users.id to guests.id and hosts.id
-- 3. Seed initial data if needed
-- 4. Test RLS policies
-- ============================================================================

