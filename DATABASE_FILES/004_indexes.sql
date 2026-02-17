-- Phase 1 & 2: All Indexes
-- Create indexes for performance

-- ============================================================================
-- PHASE 1: PARTNERS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_partners_partner_type ON public.partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_org_name ON public.partners(org_name);

-- ============================================================================
-- PHASE 1: PROFILES INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON public.profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_user_id ON public.profiles(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- PHASE 2: CAMPAIGNS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id ON public.campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_program_id ON public.campaigns(program_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by_user_id ON public.campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_promo_code ON public.campaigns(promo_code);

-- ============================================================================
-- PHASE 2: PROGRAMS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_programs_partner_id ON public.programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by_user_id ON public.programs(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);

-- ============================================================================
-- PHASE 2: TASKS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_user_id ON public.tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_approver_id ON public.tasks(approver_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_reference_no ON public.tasks(reference_no);

-- ============================================================================
-- PHASE 2: AUDIT LOGS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- ============================================================================
-- PHASE 2: USER ACTIVITY LOG INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_parent_user_id ON public.user_activity_log(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_timestamp ON public.user_activity_log(timestamp);

-- ============================================================================
-- PHASE 2: USER PERFORMANCE METRICS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_user_id ON public.user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_parent_user_id ON public.user_performance_metrics(parent_user_id);
