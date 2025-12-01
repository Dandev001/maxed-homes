-- ============================================================================
-- Optimize Admin Queries
-- ============================================================================
-- This migration adds additional indexes and optimizations specifically
-- for admin operations to ensure fast query performance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ADDITIONAL INDEXES FOR ADMIN OPERATIONS
-- ----------------------------------------------------------------------------

-- Index for admin queries that filter by status (admin sees all statuses)
-- This helps when filtering by status in admin dashboard
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at 
ON properties(status, created_at DESC);

-- Index for admin queries that sort by price
CREATE INDEX IF NOT EXISTS idx_properties_price_created_at 
ON properties(price_per_night, created_at DESC);

-- Index for admin queries that filter by property type and status
CREATE INDEX IF NOT EXISTS idx_properties_type_status 
ON properties(property_type, status);

-- Index for admin queries that filter by city and status
CREATE INDEX IF NOT EXISTS idx_properties_city_status 
ON properties(city, status);

-- Index for admin queries that filter by featured and status
CREATE INDEX IF NOT EXISTS idx_properties_featured_status 
ON properties(is_featured, status) WHERE is_featured = true;

-- Composite index for common admin filter combinations
-- This helps with queries that filter by multiple criteria
CREATE INDEX IF NOT EXISTS idx_properties_admin_filters 
ON properties(status, property_type, city, is_featured, created_at DESC);

-- Index for property images to speed up admin queries that load all images
-- (already exists, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_property_images_property_created 
ON property_images(property_id, created_at DESC);

-- Index for bookings admin queries (filter by status and date)
CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at 
ON bookings(status, created_at DESC);

-- Index for contact messages admin queries (already exists, but ensuring)
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created_at 
ON contact_messages(status, created_at DESC);

-- ----------------------------------------------------------------------------
-- OPTIMIZE RLS FUNCTION
-- ----------------------------------------------------------------------------

-- Ensure the admin check function is optimized
-- Add index hint to help PostgreSQL optimize the query
-- (The function already uses an index on admins.email, but we can verify)

-- Verify that the admins table has the necessary indexes
-- (These should already exist from create_admins_table.sql)
-- idx_admins_email - for email lookups
-- idx_admins_active_email - for active admin lookups

-- ----------------------------------------------------------------------------
-- ANALYZE TABLES FOR BETTER QUERY PLANNING
-- ----------------------------------------------------------------------------

-- Update table statistics to help PostgreSQL choose optimal query plans
-- This should be run periodically in production
ANALYZE properties;
ANALYZE property_images;
ANALYZE bookings;
ANALYZE guests;
ANALYZE hosts;
ANALYZE admins;
ANALYZE contact_messages;
ANALYZE reviews;
ANALYZE favorites;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Check all indexes on properties table:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'properties' 
-- ORDER BY indexname;

-- Check index usage (run after some queries):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'properties'
-- ORDER BY idx_scan DESC;

-- Check table sizes:
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

