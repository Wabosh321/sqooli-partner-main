-- Migration: 017_create_partner_roles_and_promote_users.sql
-- Purpose: Create partner_type_roles table, insert admin/media partner role definitions,
-- and promote existing users to 'admin_partner' for partner-scoped users.

BEGIN;

-- Create partner_type_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS partner_type_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type text NOT NULL,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure uniqueness on (partner_type, role)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_type_role_unique ON partner_type_roles (partner_type, role);

-- Upsert admin_partner role for partner-type organizations
INSERT INTO partner_type_roles (partner_type, role, permissions)
VALUES (
  'partner',
  'admin_partner',
  jsonb_build_object(
    'can_add_users', true,
    'can_edit_roles', true,
    'scope', 'partner',
    'can_create_sub_users', true,
    'can_manage_media_partners', true,
    'can_create_programs', true,
    'can_manage_own_partner', true
  )
)
ON CONFLICT (partner_type, role) DO UPDATE
  SET permissions = EXCLUDED.permissions, updated_at = now();

-- Upsert media_partner role for partner-type organizations
INSERT INTO partner_type_roles (partner_type, role, permissions)
VALUES (
  'partner',
  'media_partner',
  jsonb_build_object(
    'can_add_users', false,
    'can_edit_roles', false,
    'scope', 'partner',
    'owned_by_admin_partner', true,
    'can_create_programs', true,
    'can_crud_owned_sub_users', true
  )
)
ON CONFLICT (partner_type, role) DO UPDATE
  SET permissions = EXCLUDED.permissions, updated_at = now();

-- Promote existing users who are associated with a partner to 'admin_partner'
-- If you want to promote ALL users regardless of partner, adjust the WHERE clause.
UPDATE "users"
SET role = 'admin_partner', updated_at = now()
WHERE partner_id IS NOT NULL
  AND role IS DISTINCT FROM 'admin_partner';

COMMIT;

-- Notes:
-- 1) This migration creates a simple RBAC table `partner_type_roles` for partner-scoped roles.
-- 2) Permissions are stored as JSONB and can be extended with additional keys.
-- 3) Before applying to production, create a backup and review the WHERE clause used to promote users.
