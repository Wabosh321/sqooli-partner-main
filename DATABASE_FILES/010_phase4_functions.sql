-- ============================================================================
-- PHASE 4: RPC FUNCTIONS FOR CAMPAIGNS, PROGRAMS, TASKS, AND TEAM MANAGEMENT
-- ============================================================================
-- Purpose: Implement business logic for campaign/program CRUD, task workflows,
-- team member management, and activity logging
-- Execution Order: After 009_phase4_tables.sql

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is campaign owner
CREATE OR REPLACE FUNCTION public.is_campaign_owner(
  p_campaign_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT created_by_user_id INTO v_creator_id
  FROM public.campaigns
  WHERE id = p_campaign_id;
  
  RETURN v_creator_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is program owner
CREATE OR REPLACE FUNCTION public.is_program_owner(
  p_program_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT created_by_user_id INTO v_creator_id
  FROM public.programs
  WHERE id = p_program_id;
  
  RETURN v_creator_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is task approver
CREATE OR REPLACE FUNCTION public.is_task_approver(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_approver_id UUID;
BEGIN
  SELECT approver_user_id INTO v_approver_id
  FROM public.tasks
  WHERE id = p_task_id;
  
  RETURN v_approver_id = p_user_id OR is_super_admin(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity action
CREATE OR REPLACE FUNCTION public.log_activity(
  p_partner_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_log (
    partner_id, user_id, action, entity_type, entity_id,
    before_state, after_state, change_summary,
    ip_address, user_agent
  )
  VALUES (
    p_partner_id, p_user_id, p_action, p_entity_type, p_entity_id,
    p_before_state, p_after_state, p_change_summary,
    inet_client_addr(), current_setting('http.headers')::jsonb->>'user-agent'
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CAMPAIGN MANAGEMENT FUNCTIONS
-- ============================================================================

-- Create campaign
CREATE OR REPLACE FUNCTION public.rpc_create_campaign(
  p_partner_id UUID,
  p_created_by_user_id UUID,
  p_campaign_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_duration_start TIMESTAMP WITH TIME ZONE,
  p_duration_end TIMESTAMP WITH TIME ZONE,
  p_program_id UUID DEFAULT NULL,
  p_channels JSONB DEFAULT '[]',
  p_budget NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
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

  -- Create campaign
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update campaign
CREATE OR REPLACE FUNCTION public.rpc_update_campaign(
  p_campaign_id UUID,
  p_campaign_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_budget NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete campaign
CREATE OR REPLACE FUNCTION public.rpc_delete_campaign(
  p_campaign_id UUID
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROGRAM MANAGEMENT FUNCTIONS
-- ============================================================================

-- Create program
CREATE OR REPLACE FUNCTION public.rpc_create_program(
  p_partner_id UUID,
  p_created_by_user_id UUID,
  p_program_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_budget NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
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

  -- Create program
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update program
CREATE OR REPLACE FUNCTION public.rpc_update_program(
  p_program_id UUID,
  p_program_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_budget NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete program
CREATE OR REPLACE FUNCTION public.rpc_delete_program(
  p_program_id UUID
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TASK MANAGEMENT FUNCTIONS
-- ============================================================================

-- Approve task
CREATE OR REPLACE FUNCTION public.rpc_approve_task(
  p_task_id UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

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
    'Task approved: ' || v_task.task_name
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject task
CREATE OR REPLACE FUNCTION public.rpc_reject_task(
  p_task_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

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
    'Task rejected: ' || v_task.task_name || ' - ' || p_rejection_reason
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TEAM MEMBER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Create team member
CREATE OR REPLACE FUNCTION public.rpc_create_team_member(
  p_partner_id UUID,
  p_user_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_program_id UUID DEFAULT NULL,
  p_role TEXT,
  p_permission_level TEXT DEFAULT 'member'
)
RETURNS JSONB AS $$
DECLARE
  v_team_member_id UUID;
BEGIN
  -- Validate role
  IF p_role NOT IN ('creator', 'approver', 'member', 'viewer', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role'
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
    role, permission_level, is_active
  )
  VALUES (
    p_partner_id, p_user_id, p_campaign_id, p_program_id,
    p_role, p_permission_level, true
  )
  RETURNING id INTO v_team_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'team_member_id', v_team_member_id,
    'message', 'Team member added successfully'
  );

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Team member already exists'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update team member
CREATE OR REPLACE FUNCTION public.rpc_update_team_member(
  p_team_member_id UUID,
  p_role TEXT DEFAULT NULL,
  p_permission_level TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END PHASE 4 FUNCTIONS
-- ============================================================================
