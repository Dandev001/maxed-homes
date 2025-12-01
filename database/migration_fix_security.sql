-- Migration script to fix security warnings in existing database
-- Run this SQL in your Supabase SQL Editor to fix the security issues

-- 1. Create extensions schema and move extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move uuid-ossp extension to extensions schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" SCHEMA extensions;

-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO public;

-- 2. Fix the update_updated_at_column function with secure search_path
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

-- 3. Create the bookings_check_max_guests function with secure search_path
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

-- 4. Add the missing trigger for max guests check
DROP TRIGGER IF EXISTS bookings_check_max_guests_trigger ON bookings;
CREATE TRIGGER bookings_check_max_guests_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION bookings_check_max_guests();

-- 5. Update the EXCLUDE constraint to use the extensions schema
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings 
    EXCLUDE USING extensions.gist (
        property_id WITH =,
        daterange(check_in_date, check_out_date) WITH &&
    ) WHERE (status IN ('confirmed', 'pending'));

-- 6. Update default values to use extensions schema
ALTER TABLE properties ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE property_images ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE guests ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE bookings ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE availability_calendar ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 8. Verify the fixes
-- Check that functions have secure search_path
SELECT 
    proname as function_name,
    proconfig as config
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'bookings_check_max_guests');

-- Check that extensions are in the extensions schema
SELECT 
    extname as extension_name,
    n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('uuid-ossp', 'btree_gist');
