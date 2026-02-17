-- ============================================================================
-- PHASE 4: PERFORMANCE INDEXES
-- ============================================================================
-- Purpose: Create optimized indexes for Phase 4 table queries
-- Note: Indexes defined in 009_phase4_tables.sql for simplicity,
-- but this file serves as reference and can be applied separately if needed

-- All Phase 4 indexes are defined in 009_phase4_tables.sql
-- This file is kept for documentation and potential future index additions

-- ============================================================================
-- CAMPAIGN INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id ON public.campaigns(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by_user_id);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_program_id ON public.campaigns(program_id);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- ============================================================================
-- PROGRAM INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_programs_partner_id ON public.programs(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_programs_created_by ON public.programs(created_by_user_id);
-- CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
-- CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs(created_at DESC);

-- ============================================================================
-- TASK INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_tasks_partner_id ON public.tasks(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
-- CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_user_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_approver ON public.tasks(approver_user_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_tasks_reference_no ON public.tasks(reference_no);

-- ============================================================================
-- TEAM_MEMBER INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_team_members_partner_id ON public.team_members(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
-- CREATE INDEX IF NOT EXISTS idx_team_members_campaign_id ON public.team_members(campaign_id);
-- CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
-- CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON public.team_members(is_active);

-- ============================================================================
-- ACTIVITY_LOG INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_activity_log_partner_id ON public.user_activity_log(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.user_activity_log(user_id);
-- CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.user_activity_log(entity_type, entity_id);
-- CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.user_activity_log(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.user_activity_log(action);

-- ============================================================================
-- PERFORMANCE_METRICS INDEXES (from 009_phase4_tables.sql)
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_metrics_partner_id ON public.user_performance_metrics(partner_id);
-- CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON public.user_performance_metrics(user_id);
-- CREATE INDEX IF NOT EXISTS idx_metrics_metric_date ON public.user_performance_metrics(metric_date DESC);
-- CREATE INDEX IF NOT EXISTS idx_metrics_campaign_id ON public.user_performance_metrics(campaign_id);

-- ============================================================================
-- ADDITIONAL COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Campaign queries by partner and status
CREATE INDEX IF NOT EXISTS idx_campaigns_partner_status ON public.campaigns(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by_status ON public.campaigns(created_by_user_id, status);

-- Program queries by partner and status
CREATE INDEX IF NOT EXISTS idx_programs_partner_status ON public.programs(partner_id, status);

-- Task queries by campaign and status
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_status ON public.tasks(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON public.tasks(assigned_to_user_id, status);

-- Team member queries by campaign and role
CREATE INDEX IF NOT EXISTS idx_team_members_campaign_role ON public.team_members(campaign_id, role);
CREATE INDEX IF NOT EXISTS idx_team_members_user_active ON public.team_members(user_id, is_active);

-- Performance metrics queries by user and date
CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON public.user_performance_metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date ON public.user_performance_metrics(campaign_id, metric_date DESC);

-- Activity log queries by entity
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_created ON public.user_activity_log(action, created_at DESC);

-- ============================================================================
-- END PHASE 4 INDEXES
-- ============================================================================
