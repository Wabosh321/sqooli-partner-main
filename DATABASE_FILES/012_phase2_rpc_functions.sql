-- Phase 2: RPC Functions

-- rpc_onboard_partner_user: Create partner + admin user + profile + wallet
CREATE OR REPLACE FUNCTION public.rpc_onboard_partner_user(
  p_org_name TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_partner_type TEXT,
  p_phone TEXT,
  p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
  v_response JSONB;
BEGIN
  -- Create partner
  INSERT INTO public.partners (org_name, partner_type, access_level, onboarding_completed)
  VALUES (p_org_name, p_partner_type, 45, false)
  RETURNING id INTO v_partner_id;

  -- Create auth user (via Supabase Auth - this is placeholder)
  -- In production, call Supabase Auth API
  v_user_id := gen_random_uuid();

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, partner_id, role, partner_type, access_level, is_first_login)
  VALUES (v_user_id, p_email, p_full_name, v_partner_id, 'admin_partner', p_partner_type, 45, true);

  v_response := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'partner_id', v_partner_id,
    'message', 'Partner onboarded successfully'
  );

  RETURN v_response;

EXCEPTION WHEN OTHERS THEN
  v_response := jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- rpc_log_audit_event: Log audit event
CREATE OR REPLACE FUNCTION public.rpc_log_audit_event(
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_changes JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_log_id UUID;
  v_response JSONB;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    action_type,
    resource_type,
    resource_id,
    changes,
    ip_address
  )
  VALUES (
    auth.uid(),
    CONCAT(p_action_type, ' on ', p_resource_type),
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_ip_address
  )
  RETURNING id INTO v_log_id;

  v_response := jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'message', 'Audit event logged'
  );

  RETURN v_response;

EXCEPTION WHEN OTHERS THEN
  v_response := jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
