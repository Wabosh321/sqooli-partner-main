-- ============================================================================
-- PHASE 4: PERFORMANCE INDEXES
-- ============================================================================
-- Purpose: Create optimized indexes for Phase 4 table queries
-- Execution Order: After 011_phase4_policies.sql
--
-- PHASE 4 CORRECTIONS APPLIED:
-- 1. Moved all indexes from 009_phase4_tables.sql into this dedicated file
-- 2. Updated all indexes to reference corrected columns in Phase 4 tables
-- 3. Added indexes for newly added columns: partner_id, assigned_to_user_id, approver_user_id
-- 4. Added composite indexes for common query patterns
-- 5. Ensured all indexes reference existing columns (no "column does not exist" errors)

-- ============================================================================
-- CAMPAIGN INDEXES
-- ============================================================================
-- PHASE 4: These indexes support common campaign queries

-- Index for filtering campaigns by partner
CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id 
ON public.campaigns(partner_id);

-- Index for filtering campaigns by creator
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by 
ON public.campaigns(created_by_user_id);

-- Index for filtering campaigns by status
CREATE INDEX IF NOT EXISTS idx_campaigns_status 
ON public.campaigns(status);

-- Index for linking campaigns to programs
CREATE INDEX IF NOT EXISTS idx_campaigns_program_id 
ON public.campaigns(program_id);

-- Index for ordering campaigns by creation date (DESC for recent-first queries)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at 
ON public.campaigns(created_at DESC);

-- Composite index for common query: get partner's campaigns with specific status
CREATE INDEX IF NOT EXISTS idx_campaigns_partner_status 
ON public.campaigns(partner_id, status);

-- Composite index for common query: get user's campaigns with specific status
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by_status 
ON public.campaigns(created_by_user_id, status);

-- ============================================================================
-- PROGRAM INDEXES
-- ============================================================================
-- PHASE 4: These indexes support common program queries

-- Index for filtering programs by partner
CREATE INDEX IF NOT EXISTS idx_programs_partner_id 
ON public.programs(partner_id);

-- Index for filtering programs by creator
CREATE INDEX IF NOT EXISTS idx_programs_created_by 
ON public.programs(created_by_user_id);

-- Index for filtering programs by status
CREATE INDEX IF NOT EXISTS idx_programs_status 
ON public.programs(status);

-- Index for ordering programs by creation date (DESC for recent-first queries)
CREATE INDEX IF NOT EXISTS idx_programs_created_at 
ON public.programs(created_at DESC);

-- Composite index for common query: get partner's programs with specific status
CREATE INDEX IF NOT EXISTS idx_programs_partner_status 
ON public.programs(partner_id, status);

-- ============================================================================
-- TASK INDEXES
-- ============================================================================
-- PHASE 4 FIX: Updated all indexes to reference corrected columns
-- Added indexes for: partner_id, assigned_to_user_id, approver_user_id

-- Index for filtering tasks by partner
-- PHASE 4: Added index for partner_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_tasks_partner_id 
ON public.tasks(partner_id);

-- Index for linking tasks to campaigns
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id 
ON public.tasks(campaign_id);

-- Index for filtering tasks by status
CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON public.tasks(status);

-- Index for tasks assigned to a specific user
-- PHASE 4: Added index for assigned_to_user_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
ON public.tasks(assigned_to_user_id);

-- Index for tasks awaiting approval by a specific user
-- PHASE 4: Updated index to use approver_user_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_tasks_approver 
ON public.tasks(approver_user_id);

-- Index for ordering tasks by creation date (DESC for recent-first queries)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
ON public.tasks(created_at DESC);

-- Index for finding tasks by reference number
CREATE INDEX IF NOT EXISTS idx_tasks_reference_no 
ON public.tasks(reference_no);

-- Composite index for common query: get campaign's tasks with specific status
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_status 
ON public.tasks(campaign_id, status);

-- Composite index for common query: get tasks assigned to user with specific status
-- PHASE 4: Updated to use assigned_to_user_id
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status 
ON public.tasks(assigned_to_user_id, status);

-- Composite index for common query: get tasks pending approval for a user
-- PHASE 4: Uses approver_user_id
CREATE INDEX IF NOT EXISTS idx_tasks_approver_status 
ON public.tasks(approver_user_id, status);

-- ============================================================================
-- TEAM_MEMBER INDEXES
-- ============================================================================
-- PHASE 4: These indexes support team member queries

-- Index for filtering team members by partner
CREATE INDEX IF NOT EXISTS idx_team_members_partner_id 
ON public.team_members(partner_id);

-- Index for filtering team members by user
CREATE INDEX IF NOT EXISTS idx_team_members_user_id 
ON public.team_members(user_id);

-- Index for filtering team members by campaign
CREATE INDEX IF NOT EXISTS idx_team_members_campaign_id 
ON public.team_members(campaign_id);

-- Index for filtering team members by role
CREATE INDEX IF NOT EXISTS idx_team_members_role 
ON public.team_members(role);

-- Index for filtering active/inactive team members
CREATE INDEX IF NOT EXISTS idx_team_members_is_active 
ON public.team_members(is_active);

-- Composite index for common query: get team members for a specific campaign
CREATE INDEX IF NOT EXISTS idx_team_members_campaign_active 
ON public.team_members(campaign_id, is_active);

-- Composite index for common query: get user's team memberships by campaign
CREATE INDEX IF NOT EXISTS idx_team_members_user_campaign 
ON public.team_members(user_id, campaign_id);

-- ============================================================================
-- ACTIVITY_LOG INDEXES
-- ============================================================================
-- PHASE 4 FIX: Added indexes for corrected columns in user_activity_log

-- Index for filtering activities by partner
-- PHASE 4: Added index for partner_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_activity_log_partner_id 
ON public.user_activity_log(partner_id);

-- Index for filtering activities by user
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id 
ON public.user_activity_log(user_id);

-- Index for filtering activities by entity
-- PHASE 4: Uses entity_type and entity_id (now added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_activity_log_entity 
ON public.user_activity_log(entity_type, entity_id);

-- Index for ordering activities by creation date (DESC for recent-first queries)
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at 
ON public.user_activity_log(created_at DESC);

-- Index for filtering activities by action type
CREATE INDEX IF NOT EXISTS idx_activity_log_action 
ON public.user_activity_log(action);

-- Composite index for common query: get partner's recent activities
-- PHASE 4: Uses partner_id
CREATE INDEX IF NOT EXISTS idx_activity_log_partner_created_at 
ON public.user_activity_log(partner_id, created_at DESC);

-- Composite index for common query: get user's activities of specific type
CREATE INDEX IF NOT EXISTS idx_activity_log_user_action 
ON public.user_activity_log(user_id, action);

-- ============================================================================
-- PERFORMANCE_METRICS INDEXES
-- ============================================================================
-- PHASE 4 FIX: Added indexes for corrected columns in user_performance_metrics

-- Index for filtering metrics by partner
-- PHASE 4: Added index for partner_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_metrics_partner_id 
ON public.user_performance_metrics(partner_id);

-- Index for filtering metrics by user
CREATE INDEX IF NOT EXISTS idx_metrics_user_id 
ON public.user_performance_metrics(user_id);

-- Index for filtering metrics by date
-- PHASE 4: Added index for metric_date column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_metrics_metric_date 
ON public.user_performance_metrics(metric_date DESC);

-- Index for filtering metrics by campaign
-- PHASE 4: Added index for campaign_id column (newly added in corrected 009)
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_id 
ON public.user_performance_metrics(campaign_id);

-- Composite index for common query: get metrics for a user on a specific date
-- PHASE 4: Uses user_id and metric_date
CREATE INDEX IF NOT EXISTS idx_metrics_user_date 
ON public.user_performance_metrics(user_id, metric_date DESC);

-- Composite index for common query: get metrics for a campaign on a specific date
-- PHASE 4: Uses campaign_id and metric_date
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date 
ON public.user_performance_metrics(campaign_id, metric_date DESC);

-- Composite index for common query: get partner's metrics on a specific date
-- PHASE 4: Uses partner_id and metric_date
CREATE INDEX IF NOT EXISTS idx_metrics_partner_date 
ON public.user_performance_metrics(partner_id, metric_date DESC);

-- ============================================================================
-- END PHASE 4 INDEXES
-- ============================================================================
