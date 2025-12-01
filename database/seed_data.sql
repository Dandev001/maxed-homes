-- ============================================================================
-- Maxed Homes - Seed Data
-- Sample data to get you started with development
-- ============================================================================
-- Run this AFTER running schema_complete.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INSERT SAMPLE HOSTS
-- ----------------------------------------------------------------------------
INSERT INTO hosts (id, email, first_name, last_name, phone, company_name, status, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'host1@example.com', 'John', 'Smith', '+1-555-0101', 'Smith Properties', 'active', true),
('00000000-0000-0000-0000-000000000002', 'host2@example.com', 'Sarah', 'Johnson', '+1-555-0102', 'Johnson Rentals', 'active', true),
('00000000-0000-0000-0000-000000000003', 'host3@example.com', 'Michael', 'Williams', '+1-555-0103', NULL, 'active', true);

-- ----------------------------------------------------------------------------
-- 2. INSERT SAMPLE PROPERTIES
-- ----------------------------------------------------------------------------
INSERT INTO properties (
    id, host_id, title, description, property_type, bedrooms, bathrooms, 
    max_guests, area_sqft, price_per_night, cleaning_fee, security_deposit,
    address, city, state, zip_code, country, latitude, longitude,
    amenities, house_rules, check_in_time, check_out_time,
    minimum_nights, maximum_nights, status, is_featured
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Modern Downtown Apartment',
    'Stylish apartment in the heart of downtown with stunning city views and modern amenities.',
    'apartment',
    2, 2.0, 4, 1200,
    150.00, 50.00, 300.00,
    '123 Main Street', 'New York', 'NY', '10001', 'USA',
    40.7589, -73.9851,
    ARRAY['wifi', 'parking', 'gym', 'pool', 'balcony'],
    'No smoking, no pets, quiet hours after 10 PM',
    '15:00', '11:00',
    2, 30,
    'active', true
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Cozy Beach House',
    'Beautiful beachfront property with direct access to the ocean and breathtaking sunset views.',
    'house',
    3, 2.0, 6, 1800,
    250.00, 75.00, 500.00,
    '456 Ocean Drive', 'Miami', 'FL', '33139', 'USA',
    25.7617, -80.1918,
    ARRAY['wifi', 'parking', 'beach_access', 'bbq', 'hot_tub'],
    'No parties, respect neighbors, beach cleanup required',
    '16:00', '10:00',
    3, 14,
    'active', true
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'Luxury City Condo',
    'High-end condominium with premium finishes, concierge service, and panoramic city views.',
    'condo',
    1, 1.0, 2, 900,
    200.00, 60.00, 400.00,
    '789 Sky Tower', 'Chicago', 'IL', '60601', 'USA',
    41.8781, -87.6298,
    ARRAY['wifi', 'concierge', 'gym', 'rooftop', 'valet_parking'],
    'No smoking, no pets, quiet building',
    '15:00', '11:00',
    1, 7,
    'active', false
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Mountain Villa Retreat',
    'Secluded villa in the mountains with hot tub, fireplace, and stunning mountain views.',
    'villa',
    3, 2.0, 6, 2000,
    300.00, 100.00, 800.00,
    '555 Mountain View Road', 'Aspen', 'CO', '81611', 'USA',
    39.1911, -106.8175,
    ARRAY['wifi', 'parking', 'hot_tub', 'fireplace', 'hiking_trails'],
    'No smoking, no pets, respect wildlife',
    '16:00', '10:00',
    3, 14,
    'active', true
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    'Urban Studio Loft',
    'Modern studio loft in trendy neighborhood with exposed brick and industrial design.',
    'studio',
    0, 1.0, 2, 600,
    120.00, 40.00, 250.00,
    '888 Arts District', 'Los Angeles', 'CA', '90013', 'USA',
    34.0522, -118.2437,
    ARRAY['wifi', 'parking', 'rooftop', 'workspace', 'art_gallery'],
    'No smoking, no pets, quiet hours',
    '15:00', '11:00',
    1, 7,
    'active', false
);

-- ----------------------------------------------------------------------------
-- 3. INSERT SAMPLE PROPERTY IMAGES
-- ----------------------------------------------------------------------------
INSERT INTO property_images (property_id, image_url, alt_text, caption, display_order, is_primary) VALUES
-- Property 1 images
('10000000-0000-0000-0000-000000000001', '/src/assets/images/house1.jpg', 'Modern apartment living room', 'Spacious living area with city views', 1, true),
('10000000-0000-0000-0000-000000000001', '/src/assets/images/house.jpg', 'Modern apartment kitchen', 'Fully equipped modern kitchen', 2, false),
-- Property 2 images
('10000000-0000-0000-0000-000000000002', '/src/assets/images/place (1).jpg', 'Beach house exterior', 'Beautiful beachfront property', 1, true),
('10000000-0000-0000-0000-000000000002', '/src/assets/images/place (2).jpg', 'Beach house interior', 'Cozy living space', 2, false),
-- Property 3 images
('10000000-0000-0000-0000-000000000003', '/src/assets/images/place (3).jpg', 'Luxury condo interior', 'Modern luxury living space', 1, true),
-- Property 4 images
('10000000-0000-0000-0000-000000000004', '/src/assets/images/place (4).jpg', 'Mountain villa exterior', 'Secluded mountain retreat', 1, true),
('10000000-0000-0000-0000-000000000004', '/src/assets/images/place (5).jpg', 'Mountain villa interior', 'Cozy mountain living', 2, false),
-- Property 5 images
('10000000-0000-0000-0000-000000000005', '/src/assets/images/place (6).jpg', 'Modern studio loft', 'Trendy urban living space', 1, true);

-- ----------------------------------------------------------------------------
-- 4. INSERT SAMPLE GUESTS
-- ----------------------------------------------------------------------------
INSERT INTO guests (id, email, first_name, last_name, phone, status) VALUES
('20000000-0000-0000-0000-000000000001', 'guest1@example.com', 'Alice', 'Brown', '+1-555-0201', 'active'),
('20000000-0000-0000-0000-000000000002', 'guest2@example.com', 'Bob', 'Davis', '+1-555-0202', 'active'),
('20000000-0000-0000-0000-000000000003', 'guest3@example.com', 'Carol', 'Miller', '+1-555-0203', 'active');

-- ----------------------------------------------------------------------------
-- 5. INSERT SAMPLE BOOKINGS
-- ----------------------------------------------------------------------------
INSERT INTO bookings (
    id, property_id, guest_id, check_in_date, check_out_date,
    guests_count, base_price, cleaning_fee, taxes, total_amount, status
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '33 days',
    2,
    450.00, -- 3 nights * 150
    50.00,
    40.00,
    540.00,
    'confirmed'
),
(
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    CURRENT_DATE + INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '49 days',
    4,
    1000.00, -- 4 nights * 250
    75.00,
    86.00,
    1161.00,
    'pending'
);

-- ----------------------------------------------------------------------------
-- 6. INSERT SAMPLE AVAILABILITY (Block some dates)
-- ----------------------------------------------------------------------------
INSERT INTO availability_calendar (property_id, date, is_available, notes) VALUES
-- Block some dates for property 1
('10000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '60 days', false, 'Maintenance'),
('10000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '61 days', false, 'Maintenance'),
-- Add price override for property 2 (holiday pricing)
('10000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '90 days', true, NULL),
('10000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '91 days', true, NULL);

-- Update price override for holiday dates
UPDATE availability_calendar
SET price_override = 350.00
WHERE property_id = '10000000-0000-0000-0000-000000000002'
AND date IN (CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE + INTERVAL '91 days');

-- ----------------------------------------------------------------------------
-- 7. INSERT SAMPLE REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (
    booking_id, property_id, guest_id, rating, title, comment,
    cleanliness_rating, communication_rating, location_rating, value_rating,
    status
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    5,
    'Amazing stay!',
    'Perfect location, clean apartment, and great amenities. Would definitely stay again!',
    5, 5, 5, 5,
    'approved'
);

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- You now have:
-- - 3 hosts
-- - 5 properties
-- - Multiple property images
-- - 3 guests
-- - 2 bookings
-- - Some availability calendar entries
-- - 1 review
-- ============================================================================

