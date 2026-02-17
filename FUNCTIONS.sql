-- Complete database function definitions extracted from Supabase
-- Project: sqoolipartner (reomyhdphmahczmamogc)
-- Generated: 2026-01-29

-- ============================================================================
-- Authentication & Authorization Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_authenticated()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND role IN ('super_admin', 'system_admin')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_partner_admin(p_partner_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE partner_id = p_partner_id 
    AND (role ILIKE '%admin%' OR public.is_super_admin(id))
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_partner_id(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_partner_id UUID;
BEGIN
  SELECT partner_id INTO v_partner_id
  FROM public.profiles
  WHERE id = p_user_id
  LIMIT 1;
  
  RETURN v_partner_id;
END;
$function$;

-- ============================================================================
-- Resource Ownership Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_campaign_owner(p_campaign_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT created_by_user_id INTO v_creator_id
  FROM public.campaigns
  WHERE id = p_campaign_id;
  
  RETURN v_creator_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_program_owner(p_program_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT created_by_user_id INTO v_creator_id
  FROM public.programs
  WHERE id = p_program_id;
  
  RETURN v_creator_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_task_approver(p_task_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_approver_id UUID;
BEGIN
  SELECT approver_user_id INTO v_approver_id
  FROM public.tasks
  WHERE id = p_task_id;
  
  RETURN v_approver_id = p_user_id OR public.is_super_admin(p_user_id);
END;
$function$;

-- ============================================================================
-- User Profile Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(p_email text, p_full_name text, p_phone text DEFAULT NULL::text, p_username text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, email text, full_name text, phone text, username text, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Ensure the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION
      'Not authenticated. Email verification required before profile creation.';
  END IF;

  -- Insert profile
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
  RETURNING profiles.id INTO v_user_id;

  -- Return the created profile from the table
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    COALESCE(p.phone, ''),
    COALESCE(p.username, ''),
    p.role
  FROM public.profiles p
  WHERE p.id = v_user_id;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION
      'Email or username already exists. User may already be registered.';
  WHEN OTHERS THEN
    RAISE EXCEPTION
      'Profile creation failed: %',
      SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile(p_auth_id uuid, p_email text, p_full_name text, p_phone text, p_username text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, email text, full_name text, phone text, username text, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Verify user is authenticated and auth_id matches their token
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_auth_id THEN
    RAISE EXCEPTION 'auth_id mismatch';
  END IF;
  
  -- Insert the profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (p_auth_id, p_email, p_full_name, 'team_member')
  RETURNING profiles.id INTO v_profile_id;
  
  -- Return the created profile
  RETURN QUERY
  SELECT profiles.id, profiles.email, profiles.full_name, 
         COALESCE(p_phone, ''), COALESCE(p_username, ''), profiles.role
  FROM public.profiles
  WHERE profiles.id = v_profile_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_verified_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  /*
    Behaviour:
    - Attempt to INSERT a profile for NEW.id using values from auth.users.
    - If profile exists (conflict on id) update only non-empty incoming fields:
        * email  <- EXCLUDED.email (if not null)
        * username <- EXCLUDED.username (if not empty)
        * phone <- EXCLUDED.phone (if not empty)
    - Always update updated_at on upsert.
    - This function is safe to call repeatedly.
  */

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    phone,
    role,
    is_first_login,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULL,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phoneNumber',
    'team_member',
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email      = COALESCE(EXCLUDED.email, public.profiles.email),
    username   = COALESCE(NULLIF(EXCLUDED.username, ''), public.profiles.username),
    phone      = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- Audit & Activity Logging Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_activity(p_partner_id uuid, p_user_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_before_state jsonb DEFAULT NULL::jsonb, p_after_state jsonb DEFAULT NULL::jsonb, p_change_summary text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_activity_id UUID;
  v_ip_address INET;
  v_user_agent TEXT;
BEGIN
  -- Extract IP address and user agent if available
  v_ip_address := inet_client_addr();
  BEGIN
    v_user_agent := current_setting('http.headers')::jsonb->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;

  -- Insert activity log entry with all Phase 4 columns
  INSERT INTO public.user_activity_log (
    partner_id, user_id, action, entity_type, entity_id,
    before_state, after_state, change_summary,
    ip_address, user_agent, created_at
  )
  VALUES (
    p_partner_id, p_user_id, p_action, p_entity_type, p_entity_id,
    p_before_state, p_after_state, p_change_summary,
    v_ip_address, v_user_agent, CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_log_audit_event(p_action text, p_action_type text, p_resource_type text DEFAULT NULL::text, p_resource_id text DEFAULT NULL::text, p_changes jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- ============================================================================
-- Campaign Management Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_create_campaign(p_partner_id uuid, p_created_by_user_id uuid, p_campaign_name text, p_duration_start timestamp with time zone, p_duration_end timestamp with time zone, p_description text DEFAULT NULL::text, p_program_id uuid DEFAULT NULL::uuid, p_channels jsonb DEFAULT '[]'::jsonb, p_budget numeric DEFAULT NULL::numeric, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_campaign_id UUID;
  v_campaign_record RECORD;
BEGIN
  -- Validate dates
  IF p_duration_end <= p_duration_start THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'End date must be after start date'
    );
  END IF;

  -- Create campaign (note: name and campaign_name both populated for backward compatibility)
  INSERT INTO public.campaigns (
    partner_id, created_by_user_id, campaign_name, name,
    description, duration_start, duration_end,
    program_id, channels, budget, metadata, status
  )
  VALUES (
    p_partner_id, p_created_by_user_id, p_campaign_name, p_campaign_name,
    p_description, p_duration_start, p_duration_end,
    p_program_id, p_channels, p_budget, p_metadata, 'draft'
  )
  RETURNING id INTO v_campaign_id;

  -- Log activity
  PERFORM public.log_activity(
    p_partner_id, p_created_by_user_id, 'created',
    'campaign', v_campaign_id, NULL,
    jsonb_build_object(
      'campaign_name', p_campaign_name,
      'status', 'draft',
      'duration_start', p_duration_start,
      'duration_end', p_duration_end
    ),
    'Campaign created: ' || p_campaign_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', v_campaign_id,
    'message', 'Campaign created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_update_campaign(p_campaign_id uuid, p_campaign_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_budget numeric DEFAULT NULL::numeric, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
  v_before_state JSONB;
  v_after_state JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get campaign and partner
  SELECT partner_id, row_to_json(campaigns.*) INTO v_partner_id, v_before_state
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_partner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Campaign not found'
    );
  END IF;

  -- Update campaign
  UPDATE public.campaigns
  SET
    campaign_name = COALESCE(p_campaign_name, campaign_name),
    name = COALESCE(p_campaign_name, name),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    budget = COALESCE(p_budget, budget),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_campaign_id
  RETURNING row_to_json(campaigns.*) INTO v_after_state;

  -- Log activity
  PERFORM public.log_activity(
    v_partner_id, v_user_id, 'updated',
    'campaign', p_campaign_id, v_before_state, v_after_state,
    'Campaign updated: ' || COALESCE(p_campaign_name, 'no name change')
  );

  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', p_campaign_id,
    'message', 'Campaign updated successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_delete_campaign(p_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
  v_campaign_name TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT partner_id, campaign_name INTO v_partner_id, v_campaign_name
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_partner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Campaign not found'
    );
  END IF;

  -- Delete campaign (cascade deletes tasks)
  DELETE FROM public.campaigns WHERE id = p_campaign_id;

  -- Log activity
  PERFORM public.log_activity(
    v_partner_id, v_user_id, 'deleted',
    'campaign', p_campaign_id, NULL, NULL,
    'Campaign deleted: ' || v_campaign_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Campaign deleted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- ============================================================================
-- Program Management Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_create_program(p_partner_id uuid, p_created_by_user_id uuid, p_program_name text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_description text DEFAULT NULL::text, p_budget numeric DEFAULT NULL::numeric, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_program_id UUID;
BEGIN
  -- Validate dates
  IF p_end_date < p_start_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'End date must be after or equal to start date'
    );
  END IF;

  -- Create program (note: name and program_name both populated for backward compatibility)
  INSERT INTO public.programs (
    partner_id, created_by_user_id, program_name, name,
    description, start_date, end_date, budget, metadata, status
  )
  VALUES (
    p_partner_id, p_created_by_user_id, p_program_name, p_program_name,
    p_description, p_start_date, p_end_date, p_budget, p_metadata, 'draft'
  )
  RETURNING id INTO v_program_id;

  -- Log activity
  PERFORM public.log_activity(
    p_partner_id, p_created_by_user_id, 'created',
    'program', v_program_id, NULL,
    jsonb_build_object(
      'program_name', p_program_name,
      'status', 'draft',
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'Program created: ' || p_program_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'program_id', v_program_id,
    'message', 'Program created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_update_program(p_program_id uuid, p_program_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_budget numeric DEFAULT NULL::numeric, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT partner_id INTO v_partner_id
  FROM public.programs
  WHERE id = p_program_id;

  IF v_partner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Program not found'
    );
  END IF;

  -- Update program
  UPDATE public.programs
  SET
    program_name = COALESCE(p_program_name, program_name),
    name = COALESCE(p_program_name, name),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    budget = COALESCE(p_budget, budget),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_program_id;

  -- Log activity
  PERFORM public.log_activity(
    v_partner_id, v_user_id, 'updated',
    'program', p_program_id, NULL, NULL,
    'Program updated: ' || COALESCE(p_program_name, 'no name change')
  );

  RETURN jsonb_build_object(
    'success', true,
    'program_id', p_program_id,
    'message', 'Program updated successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_delete_program(p_program_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_partner_id UUID;
  v_user_id UUID;
  v_program_name TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT partner_id, program_name INTO v_partner_id, v_program_name
  FROM public.programs
  WHERE id = p_program_id;

  IF v_partner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Program not found'
    );
  END IF;

  DELETE FROM public.programs WHERE id = p_program_id;

  PERFORM public.log_activity(
    v_partner_id, v_user_id, 'deleted',
    'program', p_program_id, NULL, NULL,
    'Program deleted: ' || v_program_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Program deleted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- ============================================================================
-- Task Management Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_approve_task(p_task_id uuid, p_approver_user_id uuid, p_approval_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_task RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_approver_user_id, auth.uid());

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found'
    );
  END IF;

  -- Update task status
  UPDATE public.tasks
  SET
    status = 'approved',
    approver_user_id = v_user_id,
    approval_notes = p_approval_notes,
    approval_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_task_id;

  -- Log activity
  PERFORM public.log_activity(
    v_task.partner_id, v_user_id, 'approved',
    'task', p_task_id, NULL, NULL,
    'Task approved: ' || COALESCE(v_task.task_name, 'Task ' || p_task_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'approved',
    'message', 'Task approved successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_reject_task(p_task_id uuid, p_approver_user_id uuid, p_rejection_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_task RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_approver_user_id, auth.uid());

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found'
    );
  END IF;

  IF p_rejection_reason IS NULL OR p_rejection_reason = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rejection reason is required'
    );
  END IF;

  -- Update task status
  UPDATE public.tasks
  SET
    status = 'declined',
    approver_user_id = v_user_id,
    rejection_reason = p_rejection_reason,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_task_id;

  -- Log activity
  PERFORM public.log_activity(
    v_task.partner_id, v_user_id, 'rejected',
    'task', p_task_id, NULL, NULL,
    'Task rejected: ' || COALESCE(v_task.task_name, 'Task ' || p_task_id) || ' - ' || p_rejection_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'declined',
    'message', 'Task rejected successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- ============================================================================
-- Team Member Management Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_create_team_member(p_partner_id uuid, p_user_id uuid, p_role text, p_campaign_id uuid DEFAULT NULL::uuid, p_program_id uuid DEFAULT NULL::uuid, p_permission_level text DEFAULT 'member'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_team_member_id UUID;
BEGIN
  -- Validate role
  IF p_role NOT IN ('creator', 'approver', 'member', 'viewer', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role. Must be one of: creator, approver, member, viewer, admin'
    );
  END IF;

  -- Validate permission level
  IF p_permission_level NOT IN ('viewer', 'member', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid permission_level. Must be one of: viewer, member, admin'
    );
  END IF;

  -- At least one of campaign_id or program_id must be provided
  IF p_campaign_id IS NULL AND p_program_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Either campaign_id or program_id must be provided'
    );
  END IF;

  -- Create team member
  INSERT INTO public.team_members (
    partner_id, user_id, campaign_id, program_id,
    role, permission_level, is_active, invited_at
  )
  VALUES (
    p_partner_id, p_user_id, p_campaign_id, p_program_id,
    p_role, p_permission_level, true, CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_team_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'team_member_id', v_team_member_id,
    'message', 'Team member added successfully'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Team member already exists for this campaign/program'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_update_team_member(p_team_member_id uuid, p_role text DEFAULT NULL::text, p_permission_level text DEFAULT NULL::text, p_is_active boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Validate role if provided
  IF p_role IS NOT NULL AND p_role NOT IN ('creator', 'approver', 'member', 'viewer', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role. Must be one of: creator, approver, member, viewer, admin'
    );
  END IF;

  -- Validate permission level if provided
  IF p_permission_level IS NOT NULL AND p_permission_level NOT IN ('viewer', 'member', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid permission_level. Must be one of: viewer, member, admin'
    );
  END IF;

  UPDATE public.team_members
  SET
    role = COALESCE(p_role, role),
    permission_level = COALESCE(p_permission_level, permission_level),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_team_member_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Team member not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'team_member_id', p_team_member_id,
    'message', 'Team member updated successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- ============================================================================
-- Wallet & Transaction Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_record_transaction(p_wallet_id uuid, p_partner_id uuid, p_user_id uuid, p_transaction_type text, p_amount numeric, p_campaign_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_reference_number text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_transaction_id UUID;
  v_new_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('earnings', 'bonus', 'referral', 'adjustment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid transaction type: ' || p_transaction_type
    );
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction amount must be positive'
    );
  END IF;

  BEGIN
    -- Record transaction
    INSERT INTO public.transactions (
      wallet_id, partner_id, user_id, campaign_id, transaction_type, 
      amount, description, reference_number, metadata, status
    )
    VALUES (
      p_wallet_id, p_partner_id, p_user_id, p_campaign_id, p_transaction_type,
      p_amount, p_description, p_reference_number, p_metadata, 'completed'
    )
    RETURNING id INTO v_transaction_id;

    -- Update wallet balance and total earnings
    UPDATE public.wallets
    SET 
      balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      last_transaction_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_wallet_id
    RETURNING balance INTO v_new_balance;

    -- Record wallet history
    INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason, metadata)
    VALUES (
      p_wallet_id, 'transaction_recorded', p_amount, v_new_balance,
      p_transaction_type || ': ' || p_description,
      jsonb_build_object('transaction_id', v_transaction_id, 'type', p_transaction_type)
    );

    -- Update user performance metrics
    UPDATE public.user_performance_metrics
    SET 
      total_earnings = COALESCE(total_earnings, 0) + p_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Transaction recorded',
      'transaction_recorded',
      'transactions',
      v_transaction_id::text,
      jsonb_build_object(
        'type', p_transaction_type,
        'amount', p_amount,
        'wallet_id', p_wallet_id
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'new_balance', v_new_balance,
      'message', 'Transaction recorded successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_request_withdrawal(p_wallet_id uuid, p_partner_id uuid, p_user_id uuid, p_amount numeric, p_withdrawal_method text DEFAULT 'mpesa'::text, p_mpesa_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_withdrawal_id UUID;
  v_wallet_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Withdrawal amount must be positive'
    );
  END IF;

  BEGIN
    -- Get current wallet balance
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE id = p_wallet_id;

    -- Check sufficient balance (including pending withdrawals)
    SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
    FROM public.withdrawals
    WHERE wallet_id = p_wallet_id AND status IN ('pending', 'approved', 'processing');

    IF (v_wallet_balance - v_pending_withdrawals) < p_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient balance',
        'available', v_wallet_balance - v_pending_withdrawals,
        'requested', p_amount
      );
    END IF;

    -- Create withdrawal request
    INSERT INTO public.withdrawals (
      wallet_id, partner_id, user_id, amount, withdrawal_method, 
      mpesa_reference, status
    )
    VALUES (
      p_wallet_id, p_partner_id, p_user_id, p_amount, p_withdrawal_method,
      p_mpesa_reference, 'pending'
    )
    RETURNING id INTO v_withdrawal_id;

    -- Update pending withdrawals in wallet
    UPDATE public.wallets
    SET 
      pending_withdrawals = pending_withdrawals + p_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_wallet_id;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Withdrawal requested',
      'withdrawal_requested',
      'withdrawals',
      v_withdrawal_id::text,
      jsonb_build_object(
        'amount', p_amount,
        'method', p_withdrawal_method
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'withdrawal_id', v_withdrawal_id,
      'status', 'pending',
      'message', 'Withdrawal request created successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_process_withdrawal(p_withdrawal_id uuid, p_status text, p_reviewed_by_user_id uuid, p_review_notes text DEFAULT NULL::text, p_mpesa_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_withdrawal RECORD;
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate status
  IF p_status NOT IN ('approved', 'rejected', 'processing', 'completed', 'failed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid withdrawal status: ' || p_status
    );
  END IF;

  BEGIN
    -- Get withdrawal details
    SELECT * INTO v_withdrawal
    FROM public.withdrawals
    WHERE id = p_withdrawal_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Withdrawal not found'
      );
    END IF;

    v_wallet_id := v_withdrawal.wallet_id;

    -- Update withdrawal
    UPDATE public.withdrawals
    SET 
      status = p_status,
      reviewed_by_user_id = p_reviewed_by_user_id,
      review_notes = p_review_notes,
      mpesa_reference = COALESCE(p_mpesa_reference, mpesa_reference),
      processed_at = CASE WHEN p_status IN ('approved', 'processing') THEN CURRENT_TIMESTAMP ELSE processed_at END,
      completed_at = CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_withdrawal_id;

    -- If rejected or failed, return funds to available balance
    IF p_status IN ('rejected', 'failed') THEN
      UPDATE public.wallets
      SET 
        pending_withdrawals = pending_withdrawals - v_withdrawal.amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_wallet_id
      RETURNING balance INTO v_new_balance;

      -- Record wallet history
      INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason)
      VALUES (
        v_wallet_id, 'withdrawal_' || p_status, 0, v_new_balance,
        'Withdrawal ' || p_status || ': ' || COALESCE(p_review_notes, '')
      );
    ELSIF p_status = 'completed' THEN
      -- Deduct from balance completely
      UPDATE public.wallets
      SET 
        balance = balance - v_withdrawal.amount,
        pending_withdrawals = pending_withdrawals - v_withdrawal.amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_wallet_id
      RETURNING balance INTO v_new_balance;

      -- Record wallet history
      INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason)
      VALUES (
        v_wallet_id, 'withdrawal_completed', -v_withdrawal.amount, v_new_balance,
        'Withdrawal completed via ' || v_withdrawal.withdrawal_method
      );
    END IF;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Withdrawal processed: ' || p_status,
      'withdrawal_processed',
      'withdrawals',
      p_withdrawal_id::text,
      jsonb_build_object(
        'previous_status', v_withdrawal.status,
        'new_status', p_status,
        'amount', v_withdrawal.amount
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'withdrawal_id', p_withdrawal_id,
      'status', p_status,
      'new_balance', v_new_balance,
      'message', 'Withdrawal processed successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$function$;

-- ============================================================================
-- Partner Onboarding Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_onboard_partner_user(p_org_name text, p_partner_type text, p_user_email text, p_user_password text, p_full_name text, p_role text DEFAULT 'team_member'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- ============================================================================
-- Timestamp Update Trigger Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_partners_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_campaigns_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_programs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_transactions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_performance_metrics_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_wallets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_withdrawals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;
