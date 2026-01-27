-- Migration 014: Create missing RPCs referenced by application code
-- Generated: 2026-01-04
-- Purpose: Provide idempotent RPC definitions for create_media_partner_sub_user and admin_add_social_media

-- 1) create_media_partner_sub_user
CREATE OR REPLACE FUNCTION public.create_media_partner_sub_user(
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_username text DEFAULT NULL
) RETURNS TABLE(user_id uuid, email text, error text) AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Minimal RLS-safe logic: perform guarded insert into users table using SECURITY DEFINER
  -- Ensure unique email
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN QUERY SELECT NULL::uuid AS user_id, NULL::text AS email, 'email required'::text AS error;
    RETURN;
  END IF;

  -- Insert user record; adapt columns to canonical users table
  INSERT INTO public.users (auth_id, email, full_name, phone, username, role, created_at, updated_at)
  VALUES (NULL, p_email, p_full_name, p_phone, p_username, 'media_partner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id INTO v_user_id;

  RETURN QUERY SELECT v_user_id AS user_id, p_email AS email, NULL::text AS error;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT NULL::uuid, p_email, 'email already exists';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_media_partner_sub_user(text, text, text, text) TO authenticated, service_role;

-- 2) admin_add_social_media
CREATE OR REPLACE FUNCTION public.admin_add_social_media(
  p_platform text,
  p_handle text,
  p_url text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS SETOF public.social_media AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Basic validation
  IF p_platform IS NULL OR p_handle IS NULL THEN
    RAISE EXCEPTION 'platform and handle are required';
  END IF;

  -- Insert social_media record and return it
  INSERT INTO public.social_media (platform, handle, url, metadata, status, created_at, updated_at)
  VALUES (p_platform, p_handle, p_url, p_metadata, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT * FROM public.social_media WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_add_social_media(text, text, text, jsonb) TO authenticated, service_role;

-- End of migration 014
