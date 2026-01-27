-- Add onboarding tracking fields to partners table
-- This migration adds fields to track completion of each onboarding step

ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_add_users BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_2fa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_social_media BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS two_factor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_twitter TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
ADD COLUMN IF NOT EXISTS social_youtube TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN partners.onboarding_completed IS 'Indicates if partner has completed full onboarding flow';
COMMENT ON COLUMN partners.onboarding_add_users IS 'Indicates if partner has completed the add users step';
COMMENT ON COLUMN partners.onboarding_2fa IS 'Indicates if partner has completed 2FA setup';
COMMENT ON COLUMN partners.onboarding_social_media IS 'Indicates if partner has completed social media links setup';
