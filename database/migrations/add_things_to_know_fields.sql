-- Migration: Add cancellation_policy and safety_property fields to properties table
-- Run this SQL in your Supabase SQL Editor

-- Add cancellation_policy field
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Add safety_property field
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS safety_property TEXT;

-- Add comments for documentation
COMMENT ON COLUMN properties.cancellation_policy IS 'Cancellation policy details for the property';
COMMENT ON COLUMN properties.safety_property IS 'Safety and property information (alarms, child safety, etc.)';

