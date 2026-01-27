-- Migration: 019_ensure_partner_type_partner.sql
-- Purpose: Ensure a 'partner' row exists in partner_types so role inserts won't violate FK constraints.

BEGIN;

-- Insert partner type 'partner' if missing
INSERT INTO partner_types (slug, name, description, created_at)
VALUES ('partner', 'Partner', 'Default partner type for organizations', now())
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = COALESCE(EXCLUDED.description, partner_types.description);

COMMIT;

-- Notes: This is safe to run multiple times.
