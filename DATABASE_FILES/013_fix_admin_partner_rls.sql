-- Migration 013: Fix admin_partner RLS recursion by using SECURITY DEFINER helper
-- Purpose: Create a helper function that checks admin_partner status without triggering RLS
-- This prevents infinite recursion when policies select from the users table
BEGIN;

-- Create a SECURITY DEFINER helper to check admin_partner membership
-- This function runs as superuser and does NOT trigger RLS policies on users table
CREATE OR REPLACE FUNCTION public.is_admin_partner(check_uid uuid, partner uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users u
    WHERE u.id = check_uid AND u.role = 'admin_partner' AND u.partner_id = partner
  );
$$;

-- Drop and recreate all admin_partner policies to use the safe SECURITY DEFINER helper

DROP POLICY IF EXISTS admin_partner_select_users ON public.users;
CREATE POLICY admin_partner_select_users ON public.users
  FOR SELECT
  USING (
    is_admin_partner(auth.uid()::uuid, partner_id) OR auth_id = auth.uid()
  );

DROP POLICY IF EXISTS admin_partner_insert_users ON public.users;
CREATE POLICY admin_partner_insert_users ON public.users
  FOR INSERT
  WITH CHECK (
    is_admin_partner(auth.uid()::uuid, partner_id) OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS admin_partner_insert_sub_users ON public.users;
CREATE POLICY admin_partner_insert_sub_users ON public.users
  FOR INSERT
  WITH CHECK (
    (is_admin_partner(auth.uid()::uuid, partner_id) OR auth.role() = 'service_role') 
    AND ((parent_user_id = auth.uid()) OR (parent_user_id IS NULL))
  );

DROP POLICY IF EXISTS admin_partner_update_users ON public.users;
CREATE POLICY admin_partner_update_users ON public.users
  FOR UPDATE
  USING (
    is_admin_partner(auth.uid()::uuid, partner_id) OR auth_id = auth.uid()
  )
  WITH CHECK (
    is_admin_partner(auth.uid()::uuid, partner_id) OR auth_id = auth.uid()
  );

DROP POLICY IF EXISTS admin_partner_update_partner_users ON public.users;
CREATE POLICY admin_partner_update_partner_users ON public.users
  FOR UPDATE
  USING (is_admin_partner(auth.uid()::uuid, partner_id))
  WITH CHECK (is_admin_partner(auth.uid()::uuid, partner_id));

DROP POLICY IF EXISTS admin_partner_delete_users ON public.users;
CREATE POLICY admin_partner_delete_users ON public.users
  FOR DELETE
  USING (
    is_admin_partner(auth.uid()::uuid, partner_id)
  );

DROP POLICY IF EXISTS admin_partner_delete_partner_users ON public.users;
CREATE POLICY admin_partner_delete_partner_users ON public.users
  FOR DELETE
  USING (is_admin_partner(auth.uid()::uuid, partner_id));

COMMIT;

-- Notes:
-- The key improvement here is using is_admin_partner() which is SECURITY DEFINER.
-- This means the function runs as the superuser role and does NOT trigger RLS policies
-- on the users table, avoiding the infinite recursion error (code 42P17).
-- 
-- OLD PATTERN (UNSAFE):
--   WHERE auth.uid() IN ( SELECT u.id FROM users u WHERE ... )
-- NEW PATTERN (SAFE):
--   WHERE is_admin_partner(auth.uid()::uuid, partner_id)
--
-- Apply this migration using your normal Supabase migration flow (supabase CLI or MCP).
