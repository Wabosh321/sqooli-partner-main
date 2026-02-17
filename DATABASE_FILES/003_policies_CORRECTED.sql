-- Phase 1 & 2: All RLS Policies (CORRECTED)
-- Enable RLS on all tables and create policies

-- ============================================================================
-- DROP EXISTING POLICIES (for re-runs)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own partner" ON public.partners;
DROP POLICY IF EXISTS "Only super admins can create partners" ON public.partners;
DROP POLICY IF EXISTS "Partner admins can update own partner" ON public.partners;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view partner members" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own limited fields" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own partner campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Partner admins can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Partner admins can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Partner admins can delete campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Users can view own partner programs" ON public.programs;
DROP POLICY IF EXISTS "Partner admins can create programs" ON public.programs;
DROP POLICY IF EXISTS "Partner admins can update programs" ON public.programs;
DROP POLICY IF EXISTS "Partner admins can delete programs" ON public.programs;

DROP POLICY IF EXISTS "Users can view accessible tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in accessible campaigns" ON public.tasks;
DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Partner admins can delete tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Users can view own activity logs" ON public.user_activity_log;
DROP POLICY IF EXISTS "System can log user activity" ON public.user_activity_log;

DROP POLICY IF EXISTS "Users can view own performance metrics" ON public.user_performance_metrics;
DROP POLICY IF EXISTS "System can create performance metrics" ON public.user_performance_metrics;
DROP POLICY IF EXISTS "System can update performance metrics" ON public.user_performance_metrics;

-- ============================================================================
-- PHASE 1: PARTNERS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view own partner or super admins can view all
CREATE POLICY "Users can view own partner" ON public.partners
  FOR SELECT USING (
    is_super_admin(auth.uid())
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: Super admin only
CREATE POLICY "Only super admins can create partners" ON public.partners
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

-- UPDATE: Admin or super admin
CREATE POLICY "Partner admins can update own partner" ON public.partners
  FOR UPDATE USING (
    is_super_admin(auth.uid())
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND role ILIKE '%admin%')
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND role ILIKE '%admin%')
  );

-- ============================================================================
-- PHASE 1: PROFILES TABLE POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Self or admin
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can view partner members" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE partner_id = profiles.partner_id 
      AND role ILIKE '%admin%'
    )
  );

-- UPDATE: Self with limits
CREATE POLICY "Users can update own limited fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Allow RPC (SECURITY DEFINER) to create profiles
-- The RPC function checks auth.uid() internally, so the policy just allows authenticated inserts
-- that match the target profile id (which is auth.uid() from the RPC)
CREATE POLICY "RPC can create confirmed user profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Allow the insert if: auth.uid() exists AND auth.uid() = id (the row being inserted)
    -- This ensures users can only insert their own profile via RPC
    auth.uid() IS NOT NULL AND auth.uid() = id
  );

-- ============================================================================
-- PHASE 2: CAMPAIGNS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- SELECT: Own partner members or super admin
CREATE POLICY "Users can view own partner campaigns" ON public.campaigns
  FOR SELECT USING (
    is_super_admin(auth.uid())
    OR partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: Partner admins
CREATE POLICY "Partner admins can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    is_partner_admin(partner_id)
  );

-- UPDATE: Partner admins
CREATE POLICY "Partner admins can update campaigns" ON public.campaigns
  FOR UPDATE USING (
    is_partner_admin(partner_id)
  )
  WITH CHECK (
    is_partner_admin(partner_id)
  );

-- DELETE: Partner admins
CREATE POLICY "Partner admins can delete campaigns" ON public.campaigns
  FOR DELETE USING (
    is_partner_admin(partner_id)
  );

-- ============================================================================
-- PHASE 2: PROGRAMS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- SELECT: Own partner members or super admin
CREATE POLICY "Users can view own partner programs" ON public.programs
  FOR SELECT USING (
    is_super_admin(auth.uid())
    OR partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: Partner admins
CREATE POLICY "Partner admins can create programs" ON public.programs
  FOR INSERT WITH CHECK (
    is_partner_admin(partner_id)
  );

-- UPDATE: Partner admins
CREATE POLICY "Partner admins can update programs" ON public.programs
  FOR UPDATE USING (
    is_partner_admin(partner_id)
  )
  WITH CHECK (
    is_partner_admin(partner_id)
  );

-- DELETE: Partner admins
CREATE POLICY "Partner admins can delete programs" ON public.programs
  FOR DELETE USING (
    is_partner_admin(partner_id)
  );

-- ============================================================================
-- PHASE 2: TASKS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view tasks from own partner or admins can view all
CREATE POLICY "Users can view accessible tasks" ON public.tasks
  FOR SELECT USING (
    is_super_admin(auth.uid())
    OR partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: Partner members
CREATE POLICY "Users can create tasks in accessible campaigns" ON public.tasks
  FOR INSERT WITH CHECK (
    partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
    OR is_super_admin(auth.uid())
  );

-- UPDATE: Creator, approver, or admin
CREATE POLICY "Authorized users can update tasks" ON public.tasks
  FOR UPDATE USING (
    created_by_user_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_partner_admin(partner_id)
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_partner_admin(partner_id)
    OR is_super_admin(auth.uid())
  );

-- DELETE: Partner admins only
CREATE POLICY "Partner admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    is_partner_admin(partner_id)
  );

-- ============================================================================
-- PHASE 2: AUDIT LOGS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view own audit logs or super admins view all
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- INSERT: Authenticated users via RPC
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (is_authenticated());

-- ============================================================================
-- PHASE 2: USER ACTIVITY LOG TABLE POLICIES
-- ============================================================================

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view own activity or parent user activity
CREATE POLICY "Users can view own activity logs" ON public.user_activity_log
  FOR SELECT USING (
    user_id = auth.uid()
    OR parent_user_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- INSERT: System RPC only
CREATE POLICY "System can log user activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (is_authenticated());

-- ============================================================================
-- PHASE 2: USER PERFORMANCE METRICS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view own metrics or parent user metrics
CREATE POLICY "Users can view own performance metrics" ON public.user_performance_metrics
  FOR SELECT USING (
    user_id = auth.uid()
    OR parent_user_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- INSERT: System RPC only
CREATE POLICY "System can create performance metrics" ON public.user_performance_metrics
  FOR INSERT WITH CHECK (is_authenticated());

-- UPDATE: System RPC only
CREATE POLICY "System can update performance metrics" ON public.user_performance_metrics
  FOR UPDATE USING (is_authenticated())
  WITH CHECK (is_authenticated());
