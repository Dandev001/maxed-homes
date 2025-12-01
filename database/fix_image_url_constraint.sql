-- ============================================================================
-- Fix: Update image_url constraint to allow local paths
-- ============================================================================
-- Run this if you already created the schema and need to fix the constraint
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE property_images DROP CONSTRAINT IF EXISTS valid_image_url;

-- Add a more flexible constraint that allows:
-- - HTTP/HTTPS URLs (production)
-- - Local paths starting with / (development)
-- - Relative paths starting with ./ (development)
ALTER TABLE property_images
ADD CONSTRAINT valid_image_url CHECK (
    image_url ~* '^https?://' OR 
    image_url ~* '^/' OR 
    image_url ~* '^\./' OR
    image_url ~* '^src/'
);

