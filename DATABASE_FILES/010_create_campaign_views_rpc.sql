-- Migration 010: Create campaign stats views and rpc_create_campaign
-- Generated: January 2, 2026
-- Purpose: provide read-only views and a secure RPC that issues deterministic campaign links

-- 1) Campaign stats view (aggregates from transactions only; use transaction_type column)
CREATE OR REPLACE VIEW public.vw_campaign_stats AS
SELECT
  c.id                 AS campaign_id,
  c.program_id,
  c.partner_id,
  c.name,
  COUNT(t.id) FILTER (WHERE t.transaction_type = 'engagement') AS engagements,
  COUNT(t.id) FILTER (WHERE t.transaction_type = 'purchase') AS purchases,
  SUM(t.amount) FILTER (WHERE t.transaction_type = 'purchase') AS revenue,
  MAX(t.created_at) AS last_purchase_at
FROM public.campaigns c
LEFT JOIN public.transactions t ON t.campaign_id = c.id
GROUP BY c.id;

-- 2) Programs with nested campaigns view (keeps program rows metric-free)
CREATE OR REPLACE VIEW public.vw_programs_with_campaigns AS
SELECT p.*, json_agg(c_row) FILTER (WHERE c_row IS NOT NULL) AS campaigns
FROM public.programs p
LEFT JOIN (
  SELECT c.*, (
    SELECT row_to_json(s) FROM (
      SELECT engagements, purchases, revenue FROM public.vw_campaign_stats s WHERE s.campaign_id = c.id
    ) s
  ) as stats
  FROM public.campaigns c
) c_row ON c_row.program_id = p.id
GROUP BY p.id;

-- 3) Secure RPC for campaign creation that enforces link issuance
-- NOTE: Adjust canonical_base to match your production domain.
CREATE OR REPLACE FUNCTION public.rpc_create_campaign(
  p_name text,
  p_program_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.campaigns AS $$
DECLARE
  new_row public.campaigns%ROWTYPE;
  canonical_base text := coalesce(current_setting('myapp.canonical_base', true), 'https://sqooli.app/c/'); -- autodetect via Postgres setting `myapp.canonical_base`, fallback to hardcoded domain
BEGIN
  -- Validate program exists & is active
  PERFORM 1 FROM public.programs WHERE id = p_program_id AND (revoked = false OR revoked IS NULL);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found or not active';
  END IF;

  -- Insert campaign (partner_id derived from auth.uid())
  INSERT INTO public.campaigns (name, program_id, partner_id, metadata)
  VALUES (p_name, p_program_id, auth.uid(), p_metadata)
  RETURNING * INTO new_row;

  -- Deterministic canonical link generation based on campaign id
  UPDATE public.campaigns
  SET link_url = canonical_base || new_row.id::text
  WHERE id = new_row.id;

  -- Re-read and ensure link exists; fail the transaction if link missing
  SELECT * INTO new_row FROM public.campaigns WHERE id = new_row.id;
  IF new_row.link_url IS NULL OR length(trim(new_row.link_url)) = 0 THEN
    RAISE EXCEPTION 'Failed to generate campaign link';
  END IF;

  RETURN new_row;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- End of migration 010
