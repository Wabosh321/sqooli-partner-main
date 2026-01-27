-- Create user_invites table for tracking user invitations during onboarding
-- This table stores pending invitations sent to users by partners

CREATE TABLE IF NOT EXISTS user_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    invited_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    CONSTRAINT fk_invited_by FOREIGN KEY (invited_by) REFERENCES partners(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_invites_partner_id ON user_invites(partner_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites(status);

-- Add comment to document the table
COMMENT ON TABLE user_invites IS 'Stores pending user invitations sent during partner onboarding';
COMMENT ON COLUMN user_invites.status IS 'Invitation status: pending, accepted, expired, or cancelled';
COMMENT ON COLUMN user_invites.expires_at IS 'Invitation expires 7 days after creation';
