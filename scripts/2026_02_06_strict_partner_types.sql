-- Migration: Enforce strict partner types and seed partner_type_permissions
-- Name: 2026_02_06_strict_partner_types
-- Reversible migration: UP (apply) / DOWN (revert best-effort)

-- UP
BEGIN;

-- 1) Ensure 'beneficiary' partner type exists in partner_types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_types') THEN
    INSERT INTO partner_types (slug, name, description, access_level, default_commission_rate, created_at, updated_at)
    SELECT 'beneficiary', 'Beneficiary', 'Beneficiary organizations', 45, 0.0, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM partner_types WHERE slug = 'beneficiary');
  END IF;
END$$;

-- 2) Migrate non-media legacy partner_type values -> 'beneficiary'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='partner_type') THEN
    UPDATE partners
    SET partner_type = 'beneficiary'
    WHERE partner_type IS NULL OR partner_type NOT IN ('media','beneficiary');
  END IF;
END$$;

-- 3) Remove legacy rows from partner_types (keep only media & beneficiary)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_types') THEN
    DELETE FROM partner_types WHERE slug NOT IN ('media','beneficiary');
  END IF;
END$$;

-- 4) Add CHECK constraint on partners.partner_type to enforce allowed values
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='partner_type') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'partners_partner_type_check'
    ) THEN
      ALTER TABLE partners
        ADD CONSTRAINT partners_partner_type_check CHECK (partner_type IN ('media','beneficiary'));
    END IF;
  END IF;
END$$;

-- 5) Seed partner_type_permissions for both partner types (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_type_permissions') THEN
    -- Media canonical sections
    INSERT INTO partner_type_permissions (partner_type_slug, permission_key, created_at)
    SELECT 'media', perm, now()
    FROM (VALUES ('dashboard'),('campaigns'),('programs'),('wallet'),('reports'),('tasks'),('settings')) AS v(perm)
    ON CONFLICT DO NOTHING;

    -- Beneficiary canonical sections
    INSERT INTO partner_type_permissions (partner_type_slug, permission_key, created_at)
    SELECT 'beneficiary', perm, now()
    FROM (VALUES ('dashboard'),('beneficiaries'),('sponsorships'),('wallet'),('users'),('programs'),('tasks'),('settings'),('reports'),('hub_operations'),('community')) AS v(perm)
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

COMMIT;

-- DOWN (best-effort revert)
-- Note: reversing data-migrations (mapping of legacy partner_type values) is destructive to reconstruct deterministically.
-- The DOWN migration will remove the CHECK constraint and remove seeded permission rows inserted above.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partners' AND column_name='partner_type') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_partner_type_check') THEN
      ALTER TABLE partners DROP CONSTRAINT partners_partner_type_check;
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_type_permissions') THEN
    DELETE FROM partner_type_permissions WHERE partner_type_slug = 'media' AND permission_key IN ('dashboard','campaigns','programs','wallet','reports','tasks','settings');
    DELETE FROM partner_type_permissions WHERE partner_type_slug = 'beneficiary' AND permission_key IN ('dashboard','beneficiaries','sponsorships','wallet','users','programs','tasks','settings','reports','hub_operations','community');
  END IF;
END$$;

COMMIT;
