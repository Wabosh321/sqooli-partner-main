-- ============================================================================
-- PHASE 4: CAMPAIGNS, PROGRAMS, TASKS, TEAM MEMBERS, AND ACTIVITY TRACKING
-- ============================================================================
-- Purpose: Create comprehensive tables for campaign management, program coordination,
-- task workflows, team collaboration, and activity auditing
-- Execution Order: After Phase 1-3 tables (profiles, partners, wallets, etc.)
-- NOTE: Campaigns, Programs, Tasks already exist from Phase 1-2. Phase 4 adds columns.

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO CAMPAIGNS TABLE (if not already present)
-- ============================================================================
-- Campaigns table exists from Phase 1, add Phase 4 specific columns

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]';

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_link TEXT;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC(15,2) DEFAULT 0;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS target_audience JSONB;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO PROGRAMS TABLE (if not already present)
-- ============================================================================
-- Programs table exists from Phase 1, add Phase 4 specific columns

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS program_name TEXT;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS budget NUMERIC(15,2);

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS curriculum_subjects JSONB DEFAULT '[]';

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS capacity INTEGER;

ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================================================
-- PHASE 4: ADD MISSING COLUMNS TO TASKS TABLE (if not already present)
-- ============================================================================
-- Tasks table exists from Phase 1, add Phase 4 specific columns

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
-- TEAM_MEMBERS TABLE
-- ============================================================================
-- Stores team member assignments and roles
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'approver', 'member', 'viewer', 'admin')),
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
-- USER_ACTIVITY_LOG TABLE
-- ============================================================================
-- Immutable audit trail of all user actions
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- campaign, program, task, team_member, wallet
  entity_id UUID NOT NULL,
  before_state JSONB, -- Previous state for updates
  after_state JSONB, -- New state after action
  change_summary TEXT, -- Human-readable summary
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER_PERFORMANCE_METRICS TABLE
-- ============================================================================
-- Tracks user engagement and performance indicators
CREATE TABLE IF NOT EXISTS public.user_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  metric_date DATE NOT NULL,
  campaigns_created INTEGER DEFAULT 0,
  campaigns_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_approved INTEGER DEFAULT 0,
  engagement_score NUMERIC(5,2) DEFAULT 0.00,
  conversion_count INTEGER DEFAULT 0,
  click_through_rate NUMERIC(5,2),
  impressions INTEGER DEFAULT 0,
  revenue_generated NUMERIC(15,2) DEFAULT 0.00,
  roi NUMERIC(5,2),
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_id, user_id, campaign_id, metric_date)
);

-- ============================================================================
-- INDEXES FOR PHASE 4 TABLES
-- ============================================================================

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id ON public.campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_program_id ON public.campaigns(program_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- Program indexes
CREATE INDEX IF NOT EXISTS idx_programs_partner_id ON public.programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON public.programs(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs(created_at DESC);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_partner_id ON public.tasks(partner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_approver ON public.tasks(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_reference_no ON public.tasks(reference_no);

-- Team member indexes
CREATE INDEX IF NOT EXISTS idx_team_members_partner_id ON public.team_members(partner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_campaign_id ON public.team_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON public.team_members(is_active);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_partner_id ON public.user_activity_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.user_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.user_activity_log(action);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_metrics_partner_id ON public.user_performance_metrics(partner_id);
CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON public.user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_date ON public.user_performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_campaign_id ON public.user_performance_metrics(campaign_id);

-- ============================================================================
-- TABLE COMMENTS FOR PHASE 4
-- ============================================================================
COMMENT ON TABLE public.campaigns IS 'PHASE 4: Campaign management with status tracking and performance metrics';
COMMENT ON TABLE public.programs IS 'PHASE 4: Program/curriculum management with enrollment tracking';
COMMENT ON TABLE public.tasks IS 'PHASE 4: Task records with approval workflow for campaigns and programs';
COMMENT ON TABLE public.team_members IS 'PHASE 4: Team member assignments to campaigns and programs with role-based permissions';
COMMENT ON TABLE public.user_activity_log IS 'PHASE 4: Immutable audit trail of all user actions (append-only)';
COMMENT ON TABLE public.user_performance_metrics IS 'PHASE 4: User engagement and performance indicators by date and campaign';

-- ============================================================================
-- END PHASE 4 TABLES
-- ============================================================================
