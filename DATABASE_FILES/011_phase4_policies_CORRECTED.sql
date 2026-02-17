-- ============================================================================
-- PHASE 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Purpose: Enforce role-based access control for campaigns, programs, tasks,
-- team members, and activity logs
-- Execution Order: After 010_phase4_functions.sql
--
-- PHASE 4 CORRECTIONS APPLIED:
-- 1. Ensured all referenced columns exist in tables (partner_id, assigned_to_user_id, etc.)
-- 2. Updated to use corrected helper functions: is_super_admin(), get_user_partner_id()
-- 3. Fixed task policies to reference partner_id and approver_user_id
-- 4. Fixed activity log policies to reference partner_id
-- 5. All RLS policies now safe to apply with corrected 009 and 010

-- ============================================================================
-- ENABLE RLS ON ALL PHASE 4 TABLES
-- ============================================================================
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CAMPAIGNS TABLE POLICIES
-- ============================================================================
-- PHASE 4 FIX: All policies now properly reference partner_id and created_by_user_id
-- which exist in campaigns table and corrected helper functions

-- SELECT: Own campaigns OR partner campaigns (if partner admin) OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "campaigns_select_own_or_partner"
ON public.campaigns FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "campaigns_insert_partner_admin"
ON public.campaigns FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Campaign creator OR partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "campaigns_update_owner_or_admin"
ON public.campaigns FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Campaign creator OR super admin
-- PHASE 4: Uses corrected is_super_admin() function
CREATE POLICY "campaigns_delete_owner_or_super_admin"
ON public.campaigns FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================
-- PHASE 4 FIX: All policies now properly reference partner_id and created_by_user_id
-- which exist in programs table and corrected helper functions

-- SELECT: Own programs OR partner programs (if partner admin) OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "programs_select_own_or_partner"
ON public.programs FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "programs_insert_partner_admin"
ON public.programs FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Program creator OR partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "programs_update_owner_or_admin"
ON public.programs FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Program creator OR super admin
-- PHASE 4: Uses corrected is_super_admin() function
CREATE POLICY "programs_delete_owner_or_super_admin"
ON public.programs FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================
-- PHASE 4 FIX: All policies now properly reference partner_id (added in corrected 009),
-- assigned_to_user_id (added in corrected 009), and approver_user_id (added in corrected 009)

-- SELECT: Own tasks OR assigned tasks OR approver OR partner admin OR super admin
-- PHASE 4: Fixed to use partner_id and approver_user_id that now exist
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
-- PHASE 4: Fixed to use partner_id that now exists
CREATE POLICY "tasks_insert_own_or_admin"
ON public.tasks FOR INSERT
WITH CHECK (
  created_by_user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Task creator OR assigned user OR partner admin (not completed) OR super admin
-- PHASE 4: Fixed to use partner_id and assigned_to_user_id that now exist
CREATE POLICY "tasks_update_own_or_assigned_or_admin"
ON public.tasks FOR UPDATE
USING (
  created_by_user_id = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR (partner_id = public.get_user_partner_id(auth.uid()) AND status != 'completed')
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Task creator OR super admin
-- PHASE 4: Uses corrected is_super_admin() function
CREATE POLICY "tasks_delete_owner_or_super_admin"
ON public.tasks FOR DELETE
USING (
  created_by_user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- TEAM_MEMBERS TABLE POLICIES
-- ============================================================================
-- PHASE 4: Team members table newly created; policies safe to apply

-- SELECT: Own team member record OR campaign/program admin OR partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "team_members_select_own_or_admin"
ON public.team_members FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: Partner admin OR super admin
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "team_members_insert_admin"
ON public.team_members FOR INSERT
WITH CHECK (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- UPDATE: Partner admin OR super admin (not own member record)
-- PHASE 4: Uses corrected get_user_partner_id() function
CREATE POLICY "team_members_update_admin"
ON public.team_members FOR UPDATE
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- DELETE: Partner admin OR super admin
-- PHASE 4: Uses corrected is_super_admin() function
CREATE POLICY "team_members_delete_admin"
ON public.team_members FOR DELETE
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- USER_ACTIVITY_LOG TABLE POLICIES (Immutable - INSERT only, no UPDATE/DELETE)
-- ============================================================================
-- PHASE 4 FIX: Now uses partner_id column that was added in corrected 009

-- SELECT: Own activities OR partner activities (if partner admin) OR super admin
-- PHASE 4: Fixed to use partner_id that now exists
CREATE POLICY "activity_log_select_own_or_partner"
ON public.user_activity_log FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: System only (via RPC functions and system processes)
-- PHASE 4: Allows super_admin or partner_admin roles to insert activity logs
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

-- UPDATE: Never allowed (immutable audit log)
-- PHASE 4: Activity logs cannot be modified; no UPDATE policy created

-- DELETE: Never allowed (immutable audit log)
-- PHASE 4: Activity logs cannot be deleted; no DELETE policy created

-- ============================================================================
-- USER_PERFORMANCE_METRICS TABLE POLICIES
-- ============================================================================
-- PHASE 4 FIX: Now uses partner_id column that was added in corrected 009

-- SELECT: Own metrics OR partner metrics (if partner admin) OR super admin
-- PHASE 4: Fixed to use partner_id that now exists
CREATE POLICY "metrics_select_own_or_partner"
ON public.user_performance_metrics FOR SELECT
USING (
  user_id = auth.uid()
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- INSERT: System (daily batch job) OR super admin only
-- PHASE 4: Only super admin can insert metrics
CREATE POLICY "metrics_insert_system_only"
ON public.user_performance_metrics FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
);

-- UPDATE: System OR super admin only
-- PHASE 4: Only super admin can update metrics
CREATE POLICY "metrics_update_system_only"
ON public.user_performance_metrics FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
);

-- DELETE: Super admin only
-- PHASE 4: Only super admin can delete metrics
CREATE POLICY "metrics_delete_super_admin_only"
ON public.user_performance_metrics FOR DELETE
USING (
  public.is_super_admin(auth.uid())
);

-- ============================================================================
-- END PHASE 4 RLS POLICIES
-- ============================================================================
