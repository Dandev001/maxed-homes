-- Create payment_config table to securely store payment details
-- This prevents hackers from modifying payment numbers in the frontend code

CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_method VARCHAR(50) NOT NULL UNIQUE, -- 'mtn_momo', 'moov_momo', 'bank_transfer'
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL, -- MoMo number or bank account
  bank_name VARCHAR(255), -- NULL for MoMo, bank name for bank transfers
  is_active BOOLEAN DEFAULT true,
  instructions TEXT, -- Payment instructions for guests
  display_order INTEGER DEFAULT 0, -- Order to display payment methods
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods (UPDATE WITH YOUR ACTUAL DETAILS)
INSERT INTO payment_config (payment_method, account_name, account_number, bank_name, instructions, display_order) VALUES
('mtn_momo', 'Maxed Homes', '+225 XX XX XX XX XX', NULL, 'Send money to this MTN MoMo number. Include your booking reference in the transaction note.', 1),
('moov_momo', 'Maxed Homes', '+225 XX XX XX XX XX', NULL, 'Send money to this Moov MoMo number. Include your booking reference in the transaction note.', 2),
('bank_transfer', 'Maxed Homes', 'XXXX-XXXX-XXXX-XXXX', 'Your Bank Name', 'Transfer to this bank account. Include your booking reference in the transfer description.', 3)
ON CONFLICT (payment_method) DO NOTHING;

-- Create index for active payment methods
CREATE INDEX IF NOT EXISTS idx_payment_config_active 
ON payment_config(is_active, display_order) 
WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active payment configs (guests need to see payment details)
CREATE POLICY "Anyone can view active payment configs"
ON payment_config FOR SELECT
USING (is_active = true);

-- Policy: Only admins can view all payment configs (including inactive)
CREATE POLICY "Admins can view all payment configs"
ON payment_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);

-- Policy: Only admins can insert payment configs
CREATE POLICY "Admins can insert payment configs"
ON payment_config FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);

-- Policy: Only admins can update payment configs
CREATE POLICY "Admins can update payment configs"
ON payment_config FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);

-- Policy: Only admins can delete payment configs
CREATE POLICY "Admins can delete payment configs"
ON payment_config FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_config_updated_at
BEFORE UPDATE ON payment_config
FOR EACH ROW
EXECUTE FUNCTION update_payment_config_updated_at();

-- Add comment to table
COMMENT ON TABLE payment_config IS 'Stores secure payment details (MoMo numbers, bank accounts) that are fetched from backend to prevent frontend tampering';

