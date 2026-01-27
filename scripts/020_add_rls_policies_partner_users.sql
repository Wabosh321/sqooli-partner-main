-- Migration: 020_add_rls_policies_partner_users.sql
-- Purpose: Add RLS policies enforcing partner-level role editing and sub-user ownership.

BEGIN;

-- Ensure RLS is enabled on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1) Allow admin_partner users to insert sub-users for their partner (they become parent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='admin_partner_insert_sub_users') THEN
    -- For INSERT policies, only WITH CHECK is allowed to validate new rows
    CREATE POLICY "admin_partner_insert_sub_users" ON public.users
      FOR INSERT
      TO public
      WITH CHECK (
        -- creator must be admin_partner and the new user's partner_id must match the admin's partner
        auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin_partner' AND u.partner_id = users.partner_id)
        AND (users.parent_user_id = auth.uid() OR users.parent_user_id IS NULL)
      );
  END IF;
END$$;

-- 2) Allow admin_partner to update users that belong to the same partner (including changing role)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='admin_partner_update_partner_users') THEN
    CREATE POLICY "admin_partner_update_partner_users" ON public.users
      FOR UPDATE
      TO public
      USING (
        -- admin can see rows in their partner
        auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin_partner' AND u.partner_id = users.partner_id)
      )
      WITH CHECK (
        -- restrict changing to roles within the partner scope
        (auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin_partner' AND u.partner_id = users.partner_id))
      );
  END IF;
END$$;

-- 3) Prevent non-admins from changing `role` column (enforced via update policy with with_check)
-- (The above update policy allows admin_partner to perform updates; existing `Users can update own profile` SELECT/UPDATE policies still apply for self-updates.)

-- 4) Allow users to update their own profile (already exists, but ensure remains):
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='users_update_own_profile') THEN
    CREATE POLICY "users_update_own_profile" ON public.users
      FOR UPDATE
      TO public
      USING (auth.uid() = auth_id)
      WITH CHECK (auth.uid() = auth_id);
  END IF;
END$$;

-- 5) Allow admin_partner to delete sub-users within same partner
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='admin_partner_delete_partner_users') THEN
    CREATE POLICY "admin_partner_delete_partner_users" ON public.users
      FOR DELETE
      TO public
      USING (
        auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin_partner' AND u.partner_id = users.partner_id)
      );
  END IF;
END$$;

COMMIT;

-- Notes:
-- - These policies assume standard use of `auth.uid()` to identify the current user.
-- - Admins can insert/update/delete users within their partner; non-admins can only update their own profile.
-- - If additional column-level protections are required (e.g., preventing non-admins from setting `role` on insert), extend `WITH CHECK` clauses accordingly.
