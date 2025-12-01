-- Migration: Fix RLS policy to allow querying guests by email
-- This fixes the 406 error when trying to fetch a guest by email
-- 
-- The issue: The original RLS policy only allowed querying by id, but the app
-- queries guests by email. This caused 406 errors when RLS blocked the query.
--
-- Solution: Update the policy to allow querying by email when it matches
-- the authenticated user's email from their JWT token.

-- Drop the existing policy
DROP POLICY IF EXISTS "Guests can view own profile" ON guests;

-- Create a new policy that allows querying by both id and email
-- Users can view their own guest record whether queried by id or email
-- The email check uses auth.jwt() to get the user's email from the JWT token
CREATE POLICY "Guests can view own profile" ON guests
    FOR SELECT USING (
        -- Allow if the guest id matches the authenticated user's id
        auth.uid()::text = id::text
        OR
        -- Allow if the guest email matches the authenticated user's email from JWT
        (auth.jwt() ->> 'email')::text = email
    );

-- Also update the update policy to allow updates by email match
DROP POLICY IF EXISTS "Guests can update own profile" ON guests;

CREATE POLICY "Guests can update own profile" ON guests
    FOR UPDATE USING (
        auth.uid()::text = id::text
        OR
        (auth.jwt() ->> 'email')::text = email
    );

-- Add a policy to allow users to insert their own guest record
-- This is needed when a new user creates their guest profile
DROP POLICY IF EXISTS "Guests can insert own profile" ON guests;

CREATE POLICY "Guests can insert own profile" ON guests
    FOR INSERT WITH CHECK (
        auth.uid()::text = id::text
        OR
        (auth.jwt() ->> 'email')::text = email
    );

