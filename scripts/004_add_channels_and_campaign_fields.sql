-- Migration: add pricing to programs, create channels table, and add campaign fields expected by frontend

-- 1) Add pricing to programs (nullable)
ALTER TABLE IF EXISTS programs
  ADD COLUMN IF NOT EXISTS pricing numeric NULL;

-- 2) Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- store subchannels as json array
  subchannels jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_channels_partner_id ON channels(partner_id);

-- 3) Add campaign-specific columns
ALTER TABLE IF EXISTS campaigns
  ADD COLUMN IF NOT EXISTS program_id uuid NULL REFERENCES programs(id),
  ADD COLUMN IF NOT EXISTS channel_id uuid NULL REFERENCES channels(id),
  ADD COLUMN IF NOT EXISTS subchannel text NULL,
  ADD COLUMN IF NOT EXISTS target_signups integer NULL,
  ADD COLUMN IF NOT EXISTS duration_start date NULL,
  ADD COLUMN IF NOT EXISTS duration_end date NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_program_id ON campaigns(program_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel_id ON campaigns(channel_id);

-- 4) Optional: backfill programs.pricing from metadata.pricing if present
-- UPDATE programs SET pricing = (metadata->>'pricing')::numeric WHERE pricing IS NULL AND metadata->>'pricing' IS NOT NULL;

-- End of migration
