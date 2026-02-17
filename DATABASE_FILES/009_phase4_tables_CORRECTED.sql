-- ============================================================================
-- PHASE 4: CAMPAIGNS, PROGRAMS, TASKS, TEAM MEMBERS, AND ACTIVITY TRACKING
-- ============================================================================
-- Purpose: Create comprehensive tables for campaign management, program coordination,
-- task workflows, team collaboration, and activity auditing
-- Execution Order: After Phase 1-3 tables (profiles, partners, wallets, etc.)
-- 
-- PHASE 4 CORRECTIONS APPLIED:
-- 1. Changed campaigns/programs/tasks from CREATE TABLE to ALTER TABLE ADD COLUMN IF NOT EXISTS
--    (These tables already exist from Phase 1; Phase 4 adds new columns)
-- 2. Added missing columns to tasks table: partner_id, assigned_to_user_id, approver_user_id
-- 3. Added missing columns to user_activity_log: before_state, after_state, change_summary, ip_address, user_agent
-- 4. Added missing columns to user_performance_metrics: partner_id, campaign_id, metric_date
-- 5. All indexes moved from 009 to 012 for clarity; this file is table-only

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO CAMPAIGNS TABLE
-- ============================================================================
-- Campaigns table exists from Phase 1 (001_tables.sql)
-- Add Phase 4 specific columns while preserving existing data and structure

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_link TEXT;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC(15,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS target_audience JSONB;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO PROGRAMS TABLE
-- ============================================================================
-- Programs table exists from Phase 1 (001_tables.sql)
-- Add Phase 4 specific columns while preserving existing data and structure

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS program_name TEXT;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS curriculum_subjects JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS capacity INTEGER;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO TASKS TABLE (CRITICAL FIX)
-- ============================================================================
-- Tasks table exists from Phase 1 (001_tables.sql) with campaign_id and approver_id
-- PHASE 4 FIX: Add missing columns that functions (010) and policies (011) reference:
-- - partner_id: Required by RLS policies and functions
-- - assigned_to_user_id: Referenced in policies and functions for task assignment
-- - approver_user_id: Referenced in policies and functions for task approval
-- These columns were missing, causing "column does not exist" errors

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE;

-- PHASE 4: Rename approver_id to approver_user_id for consistency
-- Check if approver_id exists first, if so it will be used as-is (backward compatible)
-- If approver_user_id doesn't exist and approver_id does, the functions reference will work
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS approver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- PHASE 4: Add assigned_to_user_id for task assignment
ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS task_name TEXT;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS public.tasks 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- PHASE 4: CREATE TEAM_MEMBERS TABLE (if not exists)
-- ============================================================================
-- Stores team member assignments to campaigns and programs with role-based permissions
-- NEW TABLE: Does not exist in Phase 1

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'approver', 'member', 'viewer', 'admin')),
  permission_level TEXT DEFAULT 'member' CHECK (permission_level IN ('viewer', 'member', 'admin')),
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP WITH TIME ZONE,
  removed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_id, user_id, campaign_id),
  UNIQUE(partner_id, user_id, program_id)
);

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO USER_ACTIVITY_LOG TABLE (CRITICAL FIX)
-- ============================================================================
-- user_activity_log table exists from Phase 1 (001_tables.sql)
-- PHASE 4 FIX: Add missing columns that functions (010) reference:
-- - partner_id: Required for activity tracking and RLS policies
-- - before_state: Store previous state before updates for audit trail
-- - after_state: Store new state after updates for audit trail
-- - change_summary: Human-readable summary of changes
-- - ip_address: Track IP address of user action
-- - user_agent: Track user agent of user action
-- These columns were referenced in log_activity() function but didn't exist in table

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS entity_type TEXT;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS entity_id UUID;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS before_state JSONB;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS after_state JSONB;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS change_summary TEXT;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS ip_address INET;

ALTER TABLE IF EXISTS public.user_activity_log 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO USER_PERFORMANCE_METRICS TABLE
-- ============================================================================
-- user_performance_metrics table exists from Phase 1 (001_tables.sql)
-- PHASE 4 FIX: Add missing columns for policy and function support

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS metric_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS campaigns_created INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS campaigns_completed INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS tasks_approved INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(5,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS click_through_rate NUMERIC(5,2);

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS revenue_generated NUMERIC(15,2) DEFAULT 0.00;

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS roi NUMERIC(5,2);

ALTER TABLE IF EXISTS public.user_performance_metrics 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- TABLE COMMENTS FOR PHASE 4
-- ============================================================================
COMMENT ON TABLE public.campaigns IS 'PHASE 4: Campaign management with status tracking, performance metrics, and multi-channel support';
COMMENT ON TABLE public.programs IS 'PHASE 4: Program/curriculum management with enrollment tracking and capacity planning';
COMMENT ON TABLE public.tasks IS 'PHASE 4: Task records with approval workflow for campaigns and programs; includes partner_id, assigned_to_user_id, and approver_user_id for proper RLS';
COMMENT ON TABLE public.team_members IS 'PHASE 4: Team member assignments to campaigns and programs with role-based permissions';
COMMENT ON TABLE public.user_activity_log IS 'PHASE 4: Immutable audit trail of all user actions (append-only); includes before_state, after_state, and change_summary for detailed audit logging';
COMMENT ON TABLE public.user_performance_metrics IS 'PHASE 4: User engagement and performance indicators by date and campaign with partner and campaign tracking';

-- ============================================================================
-- PHASE 4: UNIQUE CONSTRAINT ON METRICS
-- ============================================================================
-- Ensure one metric record per user per partner per campaign per date
ALTER TABLE IF EXISTS public.user_performance_metrics
ADD CONSTRAINT unique_metrics_per_user_campaign_date UNIQUE (user_id, partner_id, campaign_id, metric_date);

-- ============================================================================
-- END PHASE 4 TABLE DEFINITIONS
-- ============================================================================
