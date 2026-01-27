-- Migration: 018_fix_partner_type_roles_and_promote.sql
-- Purpose: Adapt existing `partner_type_roles` table (different column names), add `permissions` and `updated_at` if missing,
-- upsert `admin_partner` and `media_partner` entries, and promote existing partner-scoped users to `admin_partner`.

BEGIN;

-- Add permissions column if missing
ALTER TABLE partner_type_roles
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Add updated_at column if missing
ALTER TABLE partner_type_roles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure unique index exists on partner_type_slug + role_name (existing column names)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_partner_type_roles_slug_role'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX idx_partner_type_roles_slug_role ON partner_type_roles (partner_type_slug, role_name);
    EXCEPTION WHEN duplicate_table THEN
      -- ignore
      NULL;
    END;
  END IF;
END$$;

-- Upsert admin_partner using existing columns (partner_type_slug, role_name)
INSERT INTO partner_type_roles (partner_type_slug, role_name, description, permissions, updated_at)
VALUES (
  'partner',
  'admin_partner',
  'Organization admin with partner-level management',
  jsonb_build_object(
    'can_add_users', true,
    'can_edit_roles', true,
    'scope', 'partner',
    'can_create_sub_users', true,
    'can_manage_media_partners', true,
    'can_create_programs', true,
    'can_manage_own_partner', true
  ),
  now()
)
ON CONFLICT (partner_type_slug, role_name) DO UPDATE
  SET permissions = EXCLUDED.permissions, description = EXCLUDED.description, updated_at = now();

-- Upsert media_partner
INSERT INTO partner_type_roles (partner_type_slug, role_name, description, permissions, updated_at)
VALUES (
  'partner',
  'media_partner',
  'Media partner owned by admin_partner',
  jsonb_build_object(
    'can_add_users', false,
    'can_edit_roles', false,
    'scope', 'partner',
    'owned_by_admin_partner', true,
    'can_create_programs', true,
    'can_crud_owned_sub_users', true
  ),
  now()
)
ON CONFLICT (partner_type_slug, role_name) DO UPDATE
  SET permissions = EXCLUDED.permissions, description = EXCLUDED.description, updated_at = now();

-- Promote existing users who are associated with a partner to 'admin_partner'
UPDATE "users"
SET role = 'admin_partner', updated_at = now()
WHERE partner_id IS NOT NULL
  AND role IS DISTINCT FROM 'admin_partner';

COMMIT;

-- Notes:
-- This migration targets the existing schema shape where `partner_type_roles` uses `partner_type_slug` and `role_name`.
-- It safely adds `permissions` and `updated_at` if missing, upserts two standard roles, and promotes partner-scoped users.
