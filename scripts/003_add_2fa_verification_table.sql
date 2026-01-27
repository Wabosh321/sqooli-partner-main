-- Create 2fa_verifications table for storing OTP codes during 2FA setup
-- This table is used for temporary storage of verification codes

CREATE TABLE IF NOT EXISTS two_factor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL,
    verification_type VARCHAR(10) NOT NULL CHECK (verification_type IN ('phone', 'email')),
    contact_value VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
    CONSTRAINT fk_partner_2fa FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_2fa_partner_id ON two_factor_verifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_2fa_type ON two_factor_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_2fa_expires ON two_factor_verifications(expires_at);

-- Add comment to document the table
COMMENT ON TABLE two_factor_verifications IS 'Temporary storage for 2FA OTP codes during onboarding';
COMMENT ON COLUMN two_factor_verifications.expires_at IS 'OTP code expires 10 minutes after creation';

-- Create a function to clean up expired OTP codes (run this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM two_factor_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
