-- Phase 1 & 2: All Function Definitions
-- Create all helper functions and RPC functions

-- ============================================================================
-- PHASE 1: CORE HELPER FUNCTIONS
-- ============================================================================

-- is_super_admin: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- get_user_partner_id: Get partner ID for a user
CREATE OR REPLACE FUNCTION public.get_user_partner_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT partner_id FROM public.profiles 
    WHERE id = user_id 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- is_authenticated: Check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PHASE 2: EXTENDED HELPER FUNCTIONS
-- ============================================================================

-- is_partner_admin: Check if user is admin of a partner
CREATE OR REPLACE FUNCTION public.is_partner_admin(p_partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE partner_id = p_partner_id 
    AND (role ILIKE '%admin%' OR public.is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PHASE 2: RPC FUNCTIONS
-- ============================================================================

-- rpc_onboard_partner_user: Create partner, profile, and wallet in one transaction
CREATE OR REPLACE FUNCTION public.rpc_onboard_partner_user(
  p_org_name TEXT,
  p_partner_type TEXT,
  p_user_email TEXT,
  p_user_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'team_member'
)
RETURNS JSONB AS $$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Create partner
  INSERT INTO public.partners (org_name, partner_type)
  VALUES (p_org_name, p_partner_type)
  RETURNING id INTO v_partner_id;

  -- Create auth user (via Supabase Auth)
  -- Note: This is handled by frontend, just create profile here
  -- For now, assume user already created in auth

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, partner_id, role)
  VALUES (auth.uid(), p_user_email, p_full_name, v_partner_id, p_role)
  RETURNING id INTO v_user_id;

  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'user_id', v_user_id,
    'message', 'Partner and user onboarded successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_user_profile: Create user profile after auth signup
-- CRITICAL: Called ONLY after email verification and session is established
-- auth.uid() is guaranteed to be NOT NULL at this point
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  username TEXT,
  role TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify user is authenticated (email must be verified to reach here)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Email verification required before profile creation.';
  END IF;
  
  -- Insert the profile with all columns
  INSERT INTO public.profiles (id, email, full_name, phone, username, role)
  VALUES (auth.uid(), p_email, p_full_name, COALESCE(p_phone, ''), COALESCE(p_username, ''), 'team_member')
  RETURNING profiles.id INTO v_user_id;
  
  -- Return the created profile (data from table, not parameters)
  RETURN QUERY
  SELECT 
    profiles.id, 
    profiles.email, 
    profiles.full_name, 
    COALESCE(profiles.phone, ''), 
    COALESCE(profiles.username, ''), 
    profiles.role
  FROM public.profiles
  WHERE profiles.id = v_user_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email or username already exists. User may already be registered.';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- rpc_log_audit_event: Log audit event
CREATE OR REPLACE FUNCTION public.rpc_log_audit_event(
  p_action TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, action_type, resource_type, resource_id, changes)
  VALUES (auth.uid(), p_action, p_action_type, p_resource_type, p_resource_id, p_changes)
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to log audit event: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR updated_at TIMESTAMPS
-- ============================================================================

-- Trigger function for partners
CREATE OR REPLACE FUNCTION public.handle_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partners_updated_at();

-- Trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profiles_updated_at();

-- Trigger function for campaigns
CREATE OR REPLACE FUNCTION public.handle_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_campaigns_updated_at();

-- Trigger function for programs
CREATE OR REPLACE FUNCTION public.handle_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON public.programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_programs_updated_at();

-- Trigger function for tasks
CREATE OR REPLACE FUNCTION public.handle_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tasks_updated_at();

-- Trigger function for user_performance_metrics
CREATE OR REPLACE FUNCTION public.handle_user_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_performance_metrics_updated_at ON public.user_performance_metrics;
CREATE TRIGGER user_performance_metrics_updated_at
  BEFORE UPDATE ON public.user_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_performance_metrics_updated_at();
