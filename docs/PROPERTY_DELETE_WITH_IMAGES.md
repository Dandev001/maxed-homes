# Property Deletion with Image Cleanup

## Overview
When a property is deleted, the system now automatically:
1. ✅ Deletes all associated image files from Supabase Storage
2. ✅ Deletes all image records from the database (via CASCADE)

## Implementation

### Application Code
The `delete` function in `src/lib/queries/properties.ts` has been updated to:
1. Fetch all images associated with the property
2. Extract file paths from image URLs
3. Delete files from the `property-images` storage bucket
4. Delete the property (which triggers CASCADE deletion of image records)

### Database Schema
The `property_images` table has a foreign key constraint with `ON DELETE CASCADE`:
```sql
property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE
```

This ensures that when a property is deleted, all associated image records are automatically removed from the database.

## Migration

If your database doesn't have the CASCADE constraint set up, run:

**File: `database/migrations/ensure_property_images_cascade_delete.sql`**

This migration will:
- Drop any existing foreign key constraint on `property_id`
- Recreate it with `ON DELETE CASCADE`

## How It Works

### Step-by-Step Process

1. **Fetch Images**: Before deleting the property, the system fetches all `property_images` records
2. **Extract File Paths**: Extracts the file paths from image URLs
   - Handles URLs like: `https://project.supabase.co/storage/v1/object/public/property-images/properties/filename.jpg`
   - Extracts: `properties/filename.jpg`
3. **Delete from Storage**: Deletes all image files from the `property-images` bucket
4. **Delete Property**: Deletes the property record, which triggers CASCADE deletion of image records

### Error Handling

- If storage deletion fails, the property deletion still proceeds
- Database records are always cleaned up via CASCADE, even if storage deletion fails
- Errors are logged but don't block the property deletion

## Testing

To test the deletion:

1. Create a property with images
2. Note the image URLs in the database
3. Delete the property
4. Verify:
   - Property is deleted from database
   - Image records are deleted from database
   - Image files are deleted from storage bucket

## Storage Bucket Requirements

Make sure your storage bucket policies allow deletion:

1. Go to Supabase Dashboard > Storage > property-images bucket > Policies
2. Ensure there's a policy that allows authenticated users to delete:
   - Policy name: "Authenticated users can delete property images"
   - Operation: DELETE
   - Roles: authenticated
   - USING expression: `bucket_id = 'property-images' AND auth.role() = 'authenticated'`

See `database/migrations/setup_property_images_storage_policies.sql` for details.

## Troubleshooting

### Images not deleted from storage

1. Check storage bucket policies allow deletion
2. Verify the image URLs are in the correct format
3. Check browser console for error messages
4. Verify you have admin permissions

### Database records not deleted

1. Run the migration to ensure CASCADE is set up:
   ```sql
   -- Check if CASCADE is enabled
   SELECT pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'property_images'::regclass 
   AND confrelid = 'properties'::regclass;
   ```
2. Should show: `FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE`

