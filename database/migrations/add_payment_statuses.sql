-- Add new booking statuses for payment flow
-- This migration adds the payment-related statuses to the booking_status enum

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_failed';

