-- Create function to expire unpaid bookings
-- This function updates bookings from 'awaiting_payment' to 'expired' 
-- when payment_expires_at has passed

CREATE OR REPLACE FUNCTION expire_unpaid_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update bookings that are awaiting payment and past expiration
  UPDATE bookings
  SET 
    status = 'expired',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'awaiting_payment'
    AND payment_expires_at IS NOT NULL
    AND payment_expires_at < NOW();

  -- Get count of affected rows
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$;

-- Grant execute permission to authenticated users (for edge functions)
GRANT EXECUTE ON FUNCTION expire_unpaid_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_unpaid_bookings() TO anon;

-- Add comment
COMMENT ON FUNCTION expire_unpaid_bookings() IS 
  'Expires bookings in awaiting_payment status that have passed their payment_expires_at deadline. Returns the number of bookings expired.';

