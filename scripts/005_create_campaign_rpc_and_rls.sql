-- Migration: Create create_campaign RPC function and apply RLS policies
-- Run this after 004_add_channels_and_campaign_fields.sql

-- ============================================================================
-- 1. CREATE CAMPAIGN RPC FUNCTION (PL/pgSQL)
-- ============================================================================
-- This function validates inputs and inserts a campaign safely
-- Call from backend with service_role key or secure server endpoint

CREATE OR REPLACE FUNCTION public.create_campaign(
  p_partner_id uuid,
  p_user_id uuid,
  p_program_id uuid,
  p_channel_id uuid,
  p_subchannel text,
  p_name text,
  p_description text,
  p_target_signups integer,
  p_duration_start date,
  p_duration_end date
) RETURNS SETOF campaigns AS $$
DECLARE
  v_campaign campaigns%ROWTYPE;
BEGIN
  -- Validate partner_id is not null
  IF p_partner_id IS NULL THEN
    RAISE EXCEPTION 'partner_id is required';
  END IF;

  -- Validate name and description
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'campaign name is required';
  END IF;

  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'campaign description is required';
  END IF;

  -- Validate target_signups
  IF p_target_signups IS NULL OR p_target_signups <= 0 THEN
    RAISE EXCEPTION 'target_signups must be a positive integer';
  END IF;

  -- Validate dates
  IF p_duration_start IS NULL OR p_duration_end IS NULL THEN
    RAISE EXCEPTION 'start and end dates are required';
  END IF;

  IF p_duration_start > p_duration_end THEN
    RAISE EXCEPTION 'start_date must be before or equal to end_date';
  END IF;

  -- Validate program_id (if provided) belongs to partner or is global
  IF p_program_id IS NOT NULL THEN
    PERFORM 1 FROM programs
      WHERE id = p_program_id
        AND (partner_id IS NULL OR partner_id = p_partner_id);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'program does not exist or does not belong to partner';
    END IF;
  END IF;

  -- Validate channel_id (if provided) belongs to partner
  IF p_channel_id IS NOT NULL THEN
    PERFORM 1 FROM channels
      WHERE id = p_channel_id AND partner_id = p_partner_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'channel does not exist or does not belong to partner';
    END IF;
  END IF;

  -- Insert campaign
  INSERT INTO campaigns (
    partner_id,
    user_id,
    program_id,
    channel_id,
    subchannel,
    name,
    description,
    target_signups,
    duration_start,
    duration_end,
    created_at,
    updated_at
  ) VALUES (
    p_partner_id,
    p_user_id,
    p_program_id,
    p_channel_id,
    p_subchannel,
    p_name,
    p_description,
    p_target_signups,
    p_duration_start,
    p_duration_end,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) RETURNING * INTO v_campaign;

  RETURN NEXT v_campaign;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (they will call via backend)
GRANT EXECUTE ON FUNCTION public.create_campaign(uuid, uuid, uuid, uuid, text, text, text, integer, date, date) TO authenticated, service_role;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON CAMPAIGNS
-- ============================================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES FOR CAMPAIGNS
-- ============================================================================

-- Policy 1: Block direct INSERT from client (anon key)
-- Clients must use the RPC function instead
CREATE POLICY prevent_direct_insert ON campaigns
  FOR INSERT
  WITH CHECK (false);

-- Policy 2: Allow SELECT if user's partner matches campaign's partner
-- Users can see campaigns for their partner
CREATE POLICY select_own_campaigns ON campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = campaigns.partner_id
        AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.partner_id = campaigns.partner_id
    )
  );

-- Policy 3: Allow UPDATE/DELETE if user owns the campaign's partner
CREATE POLICY update_own_campaigns ON campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = campaigns.partner_id
        AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.partner_id = campaigns.partner_id
    )
  );

CREATE POLICY delete_own_campaigns ON campaigns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = campaigns.partner_id
        AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.partner_id = campaigns.partner_id
    )
  );

-- ============================================================================
-- 4. ENABLE RLS ON CHANNELS AND PROGRAMS (RECOMMENDED)
-- ============================================================================

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read channels for their partner
CREATE POLICY select_own_channels ON channels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.partner_id = channels.partner_id
    )
    OR
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = channels.partner_id
        AND p.user_id = auth.uid()
    )
  );

-- Prevent direct inserts/updates on channels (require admin/backend)
CREATE POLICY prevent_direct_channel_insert ON channels
  FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- Programs - allow read-only access (no RLS change if globally readable)
-- If programs are partner-specific, add RLS similarly
-- ============================================================================
-- ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY select_programs ON programs
--   FOR SELECT
--   USING (true); -- or restrict by partner if needed

-- End of migration
