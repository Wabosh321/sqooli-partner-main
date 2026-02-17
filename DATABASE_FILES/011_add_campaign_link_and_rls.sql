-- Migration 011: Add link_url column for campaigns and RLS policies for programs/campaigns
-- Generated: January 2, 2026
-- WARNING: Run in staging first. This migration adds a column and RLS policies; follow backfill steps carefully.

-- 1) Add link_url column (nullable initially)
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS link_url text;

-- 2) Backfill existing rows with deterministic link (use your canonical domain)
UPDATE public.campaigns
SET link_url = 'https://sqooli.app/c/' || id::text
WHERE link_url IS NULL;

-- 3) (Optional) After verifying backfill in staging, set NOT NULL
-- ALTER TABLE public.campaigns ALTER COLUMN link_url SET NOT NULL;

-- 4) Enable RLS and create minimal policies (wrapped in DO blocks for idempotency)
-- Programs: restrict writes to super_admin role only
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_manage_programs' AND tablename = 'programs') THEN
    CREATE POLICY admins_manage_programs
      ON public.programs
      FOR ALL
      USING ( current_setting('jwt.claims.role', true) = 'super_admin' )
      WITH CHECK ( current_setting('jwt.claims.role', true) = 'super_admin' );
  END IF;
END $$;

-- Campaigns: owner-only inserts/updates/selects; admins override; public users only see active non-revoked links
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;

-- Allow partners to insert campaigns where partner_id = auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_insert_own_campaigns' AND tablename = 'campaigns') THEN
    CREATE POLICY partner_insert_own_campaigns
      ON public.campaigns
      FOR INSERT
      WITH CHECK ( partner_id = auth.uid() );
  END IF;
END $$;

-- Allow partners to select their own campaigns; admins can select all
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_select_own_campaigns' AND tablename = 'campaigns') THEN
    CREATE POLICY partner_select_own_campaigns
      ON public.campaigns
      FOR SELECT
      USING ( partner_id = auth.uid() OR current_setting('jwt.claims.role', true) = 'super_admin' );
  END IF;
END $$;

-- Allow partners to update their own campaigns but not change partner_id; admins can update any
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'partner_update_own_campaigns' AND tablename = 'campaigns') THEN
    CREATE POLICY partner_update_own_campaigns
      ON public.campaigns
      FOR UPDATE
      USING ( partner_id = auth.uid() OR current_setting('jwt.claims.role', true) = 'super_admin' )
      WITH CHECK ( partner_id = auth.uid() OR current_setting('jwt.claims.role', true) = 'super_admin' );
  END IF;
END $$;

-- Disallow partner deletes; only admin can delete
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_campaigns' AND tablename = 'campaigns') THEN
    CREATE POLICY admin_delete_campaigns
      ON public.campaigns
      FOR DELETE
      USING ( current_setting('jwt.claims.role', true) = 'super_admin' );
  END IF;
END $$;

-- Public view policy: allow anon/public selects only for active (non-draft/non-archived) campaigns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_select_active_campaigns' AND tablename = 'campaigns') THEN
    CREATE POLICY public_select_active_campaigns
      ON public.campaigns
      FOR SELECT
      USING (
        (current_setting('jwt.claims.role', true) IS NULL OR current_setting('jwt.claims.role', true) = '')
        AND (coalesce(status, 'draft') NOT IN ('draft', 'archived'))
      );
  END IF;
END $$;

-- Notes:
-- * Policies use JWT claim 'role'; adjust to your auth claim mapping (e.g., use auth.role function or join to users table as needed).
-- * Test thoroughly in staging: RLS can block queries unexpectedly.

-- End of migration 011
