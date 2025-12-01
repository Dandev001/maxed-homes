# Fix Property Delete Functionality in Admin Dashboard

## Problem
The delete button in the admin dashboard was not working properly. Properties could not be deleted even when clicking the delete button and confirming the action.

## Root Cause
The delete query in `src/lib/queries/properties.ts` had two main issues:

1. **No verification of deletion**: The query didn't use `.select()` to return the deleted row, so it couldn't verify if the deletion was actually successful. When RLS policies block a delete operation, Supabase might return success but with 0 rows deleted.

2. **Poor error handling**: The error handling didn't provide enough context about why the deletion failed (RLS issues, foreign key constraints, etc.).

## Solution

### 1. Fixed Delete Query (`src/lib/queries/properties.ts`)

**Changes made:**
- Added `.select()` to the delete query to return the deleted row
- Added verification to check if any rows were actually deleted
- Improved error handling with specific error codes:
  - `PGRST116` / `42501`: RLS policy issues
  - `23503`: Foreign key constraint violations
- Added detailed console error messages to help debug issues

**Code changes:**
```typescript
async delete(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .select()  // Added to verify deletion

  if (error) {
    // Enhanced error handling with specific error codes
    // ...
  }

  // Verify rows were actually deleted
  if (!data || data.length === 0) {
    // Log detailed error information
    return false
  }

  // Clear caches and return success
  // ...
}
```

### 2. Improved Error Messages in Component (`src/components/admin/PropertiesManagement.tsx`)

**Changes made:**
- Enhanced error messages to be more descriptive
- Better error handling in the `handleDelete` function

### 3. Created RLS Policy Fix Migration (`database/migrations/fix_property_delete_rls.sql`)

**Purpose:**
- Ensures the DELETE policy for properties is correctly configured
- Verifies the `is_current_user_admin()` function is correct
- Provides a clean way to fix RLS issues if they occur

## Steps to Apply the Fix

### Step 1: Run the RLS Migration (if needed)

If you're experiencing RLS-related issues, run this migration in Supabase SQL Editor:

**File: `database/migrations/fix_property_delete_rls.sql`**

This migration:
- Drops and recreates the DELETE policy with proper configuration
- Ensures the `is_current_user_admin()` function is correct
- Fixes any RLS policy issues that might prevent deletion

### Step 2: Verify Admin Permissions

Make sure:
1. Your user email is in the `admins` table
2. Your admin status is `'active'`
3. The `is_current_user_admin()` function is working correctly

You can test this with:
```sql
SELECT is_current_user_admin();
```

### Step 3: Test the Delete Functionality

1. Go to Admin Dashboard → Properties
2. Click the delete button (trash icon) on a property
3. Confirm the deletion
4. The property should be deleted and removed from the list

## Troubleshooting

### If deletion still fails:

1. **Check RLS Policy:**
   ```sql
   SELECT schemaname, tablename, policyname, cmd, qual
   FROM pg_policies 
   WHERE tablename = 'properties' 
   AND policyname = 'Admins can delete properties';
   ```

2. **Check Admin Status:**
   ```sql
   SELECT * FROM admins WHERE email = 'your-email@example.com';
   ```

3. **Check for Foreign Key Constraints:**
   - If the property has bookings with `ON DELETE RESTRICT`, you may need to delete or cancel bookings first
   - Check the schema to see if bookings use `RESTRICT` or `CASCADE`

4. **Check Browser Console:**
   - The improved error handling will log detailed error messages
   - Look for specific error codes and messages

## Files Modified

1. `src/lib/queries/properties.ts` - Fixed delete query with verification
2. `src/components/admin/PropertiesManagement.tsx` - Improved error messages
3. `database/migrations/fix_property_delete_rls.sql` - New migration file (if needed)

## Testing Checklist

- [ ] Admin can delete a property with no related data
- [ ] Error message shows if RLS policy blocks deletion
- [ ] Error message shows if foreign key constraints prevent deletion
- [ ] Property is removed from the list after successful deletion
- [ ] Cache is cleared after deletion
- [ ] Confirmation modal works correctly

