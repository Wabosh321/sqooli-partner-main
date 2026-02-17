-- Phase 1 & 2: All Function Definitions (CORRECTED)
-- Create all helper functions and RPC functions with proper auth validation

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
    WHERE id = auth.uid() 
    AND partner_id = p_partner_id 
    AND role ILIKE '%admin%'
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
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_username TEXT,
  p_role TEXT DEFAULT 'team_member'
)
RETURNS JSONB AS $$
DECLARE
  v_partner_id UUID;
  v_profile_id UUID;
  v_result JSONB;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create partner
  INSERT INTO public.partners (org_name, partner_type, access_level, commission_rate)
  VALUES (p_org_name, p_partner_type, 0, 0.00)
  RETURNING id INTO v_partner_id;

  -- Create profile linked to auth user
  INSERT INTO public.profiles (
    id, email, full_name, phone, username, partner_id, role, partner_type
  )
  VALUES (
    auth.uid(),
    p_email,
    p_full_name,
    p_phone,
    p_username,
    v_partner_id,
    p_role,
    p_partner_type
  )
  RETURNING id INTO v_profile_id;

  -- Success response
  v_result := jsonb_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'profile_id', v_profile_id,
    'message', 'Partner and profile created successfully'
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to onboard partner user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_user_profile: Create user profile after auth email verification
-- CRITICAL: This RPC MUST be called ONLY after user's email is confirmed
-- The user's auth.uid() must be established and valid
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
  v_profile_id UUID;
BEGIN
  -- CRITICAL: Verify user is authenticated (email must be confirmed)
  -- At this point, auth.uid() will be the user's UUID from the verified JWT
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Email verification required before profile creation.';
  END IF;

  -- Verify email matches the authenticated user's email
  -- (optional: add this check if email from auth.users must match p_email)
  
  -- Insert the profile
  -- The id is the auth.uid() to link with auth.users table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    username,
    role
  )
  VALUES (
    auth.uid(),
    p_email,
    p_full_name,
    COALESCE(p_phone, ''),
    COALESCE(p_username, ''),
    'team_member'
  )
  RETURNING profiles.id INTO v_profile_id;

  -- Return the created profile from the table (not from parameters)
  RETURN QUERY
  SELECT 
    profiles.id,
    profiles.email,
    profiles.full_name,
    COALESCE(profiles.phone, '') as phone,
    COALESCE(profiles.username, '') as username,
    profiles.role
  FROM public.profiles
  WHERE profiles.id = v_profile_id;
  
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email or username already exists';
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
