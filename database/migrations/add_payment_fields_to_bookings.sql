-- Add payment-related columns to bookings table
-- This migration adds all payment fields needed for the payment flow MVP

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 'mtn_momo', 'moov_momo', 'bank_transfer'
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255), -- Transaction ID
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT, -- URL to uploaded receipt in Supabase Storage
ADD COLUMN IF NOT EXISTS payment_confirmed_by VARCHAR(50), -- 'admin' | 'host'
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE, -- Deadline for payment
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10,2);

-- Index for payment queries (optimize queries filtering by payment statuses)
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(status) 
WHERE status IN ('awaiting_payment', 'awaiting_confirmation', 'payment_failed');

-- Index for payment expiration queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_expires_at 
ON bookings(payment_expires_at) 
WHERE payment_expires_at IS NOT NULL;

