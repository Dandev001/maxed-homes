-- ============================================================================
-- ALTERNATIVE FIX: Property Update Using Database Function
-- ============================================================================
-- This approach uses a database function with SECURITY DEFINER to bypass RLS
-- This is more reliable than relying on RLS policies
-- ============================================================================

-- Step 1: Create a function that updates properties (bypasses RLS)
-- This function accepts JSONB for flexible updates
CREATE OR REPLACE FUNCTION update_property_admin(
    property_id UUID,
    updates JSONB
)
RETURNS properties AS $$
DECLARE
    updated_property properties;
    user_email TEXT;
    update_sql TEXT;
    set_clauses TEXT[] := ARRAY[]::TEXT[];
    key TEXT;
    value TEXT;
BEGIN
    -- Check if user is admin
    user_email := auth.jwt() ->> 'email';
    
    IF NOT EXISTS (
        SELECT 1 FROM admins
        WHERE LOWER(TRIM(admins.email)) = LOWER(TRIM(user_email))
        AND admins.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Permission denied: User is not an admin';
    END IF;
    
    -- Build dynamic update query
    FOR key, value IN SELECT * FROM jsonb_each_text(updates)
    LOOP
        -- Only update valid columns (security: prevent SQL injection)
        IF key IN ('status', 'title', 'is_featured', 'description', 'price_per_night', 
                   'bedrooms', 'bathrooms', 'max_guests', 'address', 'city', 'state', 
                   'zip_code', 'country', 'latitude', 'longitude', 'amenities', 
                   'house_rules', 'cancellation_policy', 'safety_property', 
                   'check_in_time', 'check_out_time', 'minimum_nights', 'maximum_nights',
                   'cleaning_fee', 'security_deposit', 'area_sqft', 'property_type') THEN
            set_clauses := array_append(set_clauses, format('%I = %L', key, value));
        END IF;
    END LOOP;
    
    -- Add updated_at
    set_clauses := array_append(set_clauses, 'updated_at = NOW()');
    
    -- Build and execute update
    update_sql := format(
        'UPDATE properties SET %s WHERE id = %L RETURNING *',
        array_to_string(set_clauses, ', '),
        property_id
    );
    
    EXECUTE update_sql INTO updated_property;
    
    IF updated_property IS NULL THEN
        RAISE EXCEPTION 'Property not found or update failed';
    END IF;
    
    RETURN updated_property;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_property_admin(UUID, JSONB) TO authenticated;

-- Step 2: Also keep the RLS policy as backup
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE 
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());

-- ============================================================================
-- USAGE
-- ============================================================================
-- The function accepts JSONB for flexible updates:
--
-- SELECT * FROM update_property_admin(
--     'property-id-here'::UUID,
--     '{"status": "inactive"}'::JSONB
-- );
--
-- Or multiple fields:
-- SELECT * FROM update_property_admin(
--     'property-id-here'::UUID,
--     '{"status": "active", "is_featured": true, "title": "New Title"}'::JSONB
-- );
--
-- The application code will automatically use this function when available.

