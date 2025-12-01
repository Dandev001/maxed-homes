-- Core Database Schema for Maxed Homes Property Rental System (Security Fixed)
-- Run this SQL in your Supabase SQL Editor

-- Create a dedicated schema for extensions to avoid public schema issues
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable necessary extensions in the extensions schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" SCHEMA extensions;

-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO public;

-- Create custom types
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'maintenance', 'sold');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE guest_status AS ENUM ('active', 'inactive', 'blocked');

-- 1. PROPERTIES TABLE (Main property data)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(100) NOT NULL, -- 'house', 'apartment', 'villa', etc.
    bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    area_sqft INTEGER,
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    amenities TEXT[], -- Array of amenities
    house_rules TEXT,
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    minimum_nights INTEGER DEFAULT 1,
    maximum_nights INTEGER,
    status property_status DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND 
         latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- 2. PROPERTY_IMAGES TABLE (Separate image management)
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one primary image per property
    CONSTRAINT unique_primary_image EXCLUDE (property_id WITH =) WHERE (is_primary = true)
);

-- 3. GUESTS TABLE (Guest information)
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferences JSONB, -- Store guest preferences as JSON
    status guest_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 4. BOOKINGS TABLE (Reservation system)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    total_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    base_price DECIMAL(10,2) NOT NULL,
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Business logic constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT no_overlapping_bookings EXCLUDE USING extensions.gist (
        property_id WITH =,
        daterange(check_in_date, check_out_date) WITH &&
    ) WHERE (status IN ('confirmed', 'pending'))
);

-- Create a function to check max guests constraint (with secure search_path)
CREATE OR REPLACE FUNCTION bookings_check_max_guests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF NEW.guests_count > (
        SELECT max_guests FROM properties WHERE id = NEW.property_id
    ) THEN
        RAISE EXCEPTION 'Guest count % exceeds maximum guests % for this property', 
            NEW.guests_count, 
            (SELECT max_guests FROM properties WHERE id = NEW.property_id);
    END IF;
    RETURN NEW;
END;
$$;

-- Add trigger for max guests check
CREATE TRIGGER bookings_check_max_guests_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION bookings_check_max_guests();

-- 5. AVAILABILITY_CALENDAR TABLE (Date management)
CREATE TABLE availability_calendar (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price_override DECIMAL(10,2), -- Override default price for specific dates
    minimum_nights_override INTEGER, -- Override minimum nights for specific dates
    notes TEXT, -- Reason for unavailability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per property per date
    UNIQUE(property_id, date)
);

-- Create indexes for optimal query performance
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price_per_night);
CREATE INDEX idx_properties_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX idx_properties_location ON properties(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_property_images_order ON property_images(property_id, display_order);

CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_status ON guests(status);

CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates_property ON bookings(property_id, check_in_date, check_out_date);

CREATE INDEX idx_availability_property_date ON availability_calendar(property_id, date);
CREATE INDEX idx_availability_date ON availability_calendar(date);
CREATE INDEX idx_availability_available ON availability_calendar(property_id, date) WHERE is_available = true;

-- Create updated_at trigger function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_calendar ENABLE ROW LEVEL SECURITY;

-- Public read access for properties and images
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Property images are viewable by everyone" ON property_images
    FOR SELECT USING (true);

-- Guests can only see their own data
CREATE POLICY "Guests can view own profile" ON guests
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Guests can update own profile" ON guests
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Bookings policies
CREATE POLICY "Guests can view own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = guest_id::text);

CREATE POLICY "Guests can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text = guest_id::text);

-- Availability calendar is read-only for public
CREATE POLICY "Availability calendar is viewable by everyone" ON availability_calendar
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
