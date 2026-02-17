-- ============================================================================
-- PHASE 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Purpose: Enforce role-based access control for campaigns, programs, tasks,
-- team members, and activity logs
-- Execution Order: After 010_phase4_functions.sql

-- ============================================================================
-- ENABLE RLS ON ALL PHASE 4 TABLES
-- ============================================================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CAMPAIGNS TABLE POLICIES
-- ============================================================================

-- SELECT: Own campaigns OR partner campaigns (if partner admin) OR super admin
CREATE POLICY "campaigns_select_own_or_partner"
ON public.campaigns FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
CREATE POLICY "campaigns_insert_partner_admin"
ON public.campaigns FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Campaign creator OR partner admin OR super admin
CREATE POLICY "campaigns_update_owner_or_admin"
ON public.campaigns FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Campaign creator OR super admin
CREATE POLICY "campaigns_delete_owner_or_super_admin"
ON public.campaigns FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================

-- SELECT: Own programs OR partner programs (if partner admin) OR super admin
CREATE POLICY "programs_select_own_or_partner"
ON public.programs FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
CREATE POLICY "programs_insert_partner_admin"
ON public.programs FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Program creator OR partner admin OR super admin
CREATE POLICY "programs_update_owner_or_admin"
ON public.programs FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Program creator OR super admin
CREATE POLICY "programs_delete_owner_or_super_admin"
ON public.programs FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- SELECT: Own tasks OR assigned tasks OR approver OR partner admin OR super admin
CREATE POLICY "tasks_select_own_or_assigned_or_approver"
ON public.tasks FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR approver_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Task creator (member) OR partner admin OR super admin
CREATE POLICY "tasks_insert_own_or_admin"
ON public.tasks FOR INSERT
WITH CHECK (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Task creator OR assigned user OR partner admin (not completed) OR super admin
CREATE POLICY "tasks_update_own_or_assigned_or_admin"
ON public.tasks FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR (partner_id = public.get_user_partner_id(auth.uid()) AND status != 'completed')
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Task creator OR super admin
CREATE POLICY "tasks_delete_owner_or_super_admin"
ON public.tasks FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- TEAM_MEMBERS TABLE POLICIES
-- ============================================================================

-- SELECT: Own team member record OR campaign/program admin OR partner admin OR super admin
CREATE POLICY "team_members_select_own_or_admin"
ON public.team_members FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
CREATE POLICY "team_members_insert_admin"
ON public.team_members FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Partner admin OR super admin (not own member record)
CREATE POLICY "team_members_update_admin"
ON public.team_members FOR UPDATE
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Partner admin OR super admin
CREATE POLICY "team_members_delete_admin"
ON public.team_members FOR DELETE
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- USER_ACTIVITY_LOG TABLE POLICIES (Immutable - INSERT only, no UPDATE/DELETE)
-- ============================================================================

-- SELECT: Own activities OR partner activities (if partner admin) OR super admin
CREATE POLICY "activity_log_select_own_or_partner"
ON public.user_activity_log FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: System only (via triggers and RPC functions)
CREATE POLICY "activity_log_insert_system_only"
ON public.user_activity_log FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'partner_admin')
  )
);

-- UPDATE: Never allowed (immutable)
-- (No UPDATE policy created)

-- DELETE: Never allowed (immutable)
-- (No DELETE policy created)

-- ============================================================================
-- USER_PERFORMANCE_METRICS TABLE POLICIES
-- ============================================================================

-- SELECT: Own metrics OR partner metrics (if partner admin) OR super admin
CREATE POLICY "metrics_select_own_or_partner"
ON public.user_performance_metrics FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: System (daily batch job) OR super admin
CREATE POLICY "metrics_insert_system_only"
ON public.user_performance_metrics FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
);

-- UPDATE: System OR super admin
CREATE POLICY "metrics_update_system_only"
ON public.user_performance_metrics FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
);

-- DELETE: Super admin only
CREATE POLICY "metrics_delete_super_admin_only"
ON public.user_performance_metrics FOR DELETE
USING (
  public.is_super_admin(auth.uid())
);

-- ============================================================================
-- END PHASE 4 RLS POLICIES
-- ============================================================================
