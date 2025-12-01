-- ============================================================================
-- Ensure Property Images Cascade Delete
-- ============================================================================
-- This migration ensures that when a property is deleted, all associated
-- property_images records are automatically deleted from the database.
-- 
-- Note: The application code (src/lib/queries/properties.ts) also deletes
-- image files from storage, but the database CASCADE ensures image records
-- are deleted even if storage deletion fails.
-- ============================================================================

-- Drop existing foreign key constraint if it exists (to recreate with CASCADE)
DO $$
DECLARE
    constraint_name_var TEXT;
    property_id_attnum SMALLINT;
BEGIN
    -- Get the attribute number for property_id
    SELECT attnum INTO property_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'property_images'::regclass
    AND attname = 'property_id';

    -- Find the constraint name that references property_id
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'property_images'::regclass
    AND confrelid = 'properties'::regclass
    AND contype = 'f'
    AND property_id_attnum = ANY(conkey);

    -- Drop the constraint if it exists
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE property_images DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
    END IF;
END $$;

-- Recreate the foreign key constraint with CASCADE DELETE
ALTER TABLE property_images
ADD CONSTRAINT property_images_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE CASCADE;

-- Verify the constraint exists with CASCADE
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    pg_get_constraintdef(pc.oid) AS constraint_definition
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN pg_constraint AS pc
    ON pc.conname = tc.constraint_name
WHERE tc.table_name = 'property_images'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'property_id';

-- Expected result: constraint_definition should contain "ON DELETE CASCADE"

