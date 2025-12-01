-- ============================================================================
-- Fix Guest Insert RLS Policy
-- ============================================================================
-- This migration fixes the 403 error when creating guest records
-- 
-- The issue: The RLS policy requires either:
--   1. auth.uid() = id (guest ID matches user ID), OR
--   2. auth.jwt() email = email (email matches)
--
-- However, when creating a new guest, we might not know the guest ID yet,
-- and we need to allow creation based on email match.
--
-- Solution: Update the INSERT policy to allow creation when:
--   - The email matches the authenticated user's email, OR
--   - The id matches auth.uid() (if provided)
-- ============================================================================

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Guests can insert own profile" ON guests;

-- Create a new policy that allows insertion based on email match
-- This allows users to create their guest profile using their authenticated email
CREATE POLICY "Guests can insert own profile" ON guests
    FOR INSERT WITH CHECK (
        -- Allow if the guest id matches the authenticated user's id (if id is provided)
        (id IS NOT NULL AND auth.uid()::text = id::text)
        OR
        -- Allow if the guest email matches the authenticated user's email from JWT
        -- This is the primary check for new guest creation
        (email IS NOT NULL AND (auth.jwt() ->> 'email')::text = email)
    );

-- Also ensure the SELECT policy allows viewing by email (should already exist from previous migration)
-- But let's make sure it's there
DROP POLICY IF EXISTS "Guests can view own profile" ON guests;

CREATE POLICY "Guests can view own profile" ON guests
    FOR SELECT USING (
        -- Allow if the guest id matches the authenticated user's id
        auth.uid()::text = id::text
        OR
        -- Allow if the guest email matches the authenticated user's email from JWT
        (auth.jwt() ->> 'email')::text = email
    );

-- Ensure UPDATE policy also allows updates by email
DROP POLICY IF EXISTS "Guests can update own profile" ON guests;

CREATE POLICY "Guests can update own profile" ON guests
    FOR UPDATE USING (
        auth.uid()::text = id::text
        OR
        (auth.jwt() ->> 'email')::text = email
    );

