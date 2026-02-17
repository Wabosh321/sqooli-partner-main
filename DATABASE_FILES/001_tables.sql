-- Phase 1 & 2: All Table Definitions (in dependency order)
-- This file creates all tables without functions, triggers, or policies

-- ============================================================================
-- PHASE 1: CORE TABLES
-- ============================================================================

-- Partners Table (no dependencies)
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  partner_type TEXT NOT NULL,
  access_level INTEGER DEFAULT 0 CHECK (access_level >= 0 AND access_level <= 100),
  commission_rate NUMERIC(5, 2) DEFAULT 0.00,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table (depends on partners, auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  username TEXT UNIQUE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'team_member',
  partner_type TEXT,
  access_level INTEGER DEFAULT 0 CHECK (access_level >= 0 AND access_level <= 100),
  permissions JSONB DEFAULT '[]'::jsonb,
  parent_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_first_login BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 2: DATA TABLES
-- ============================================================================

-- Campaigns Table (depends on partners, profiles, programs via deferred FK)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  program_id UUID,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_user_role TEXT,
  name TEXT NOT NULL,
  promo_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  duration_start TIMESTAMP WITH TIME ZONE,
  duration_end TIMESTAMP WITH TIME ZONE,
  budget NUMERIC(12, 2) DEFAULT 0.00,
  spent NUMERIC(12, 2) DEFAULT 0.00,
  revenue_projection NUMERIC(12, 2) DEFAULT 0.00,
  target_signups INTEGER DEFAULT 0,
  daily_target INTEGER DEFAULT 0,
  whatsapp_number TEXT,
  bundled_offers JSONB,
  discount_rule JSONB,
  revenue_share JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Programs Table (depends on partners, profiles)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  target_audience TEXT,
  budget NUMERIC(12, 2) DEFAULT 0.00,
  commission_structure JSONB,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add deferred FK constraint for campaigns.program_id → programs.id
ALTER TABLE public.campaigns
ADD CONSTRAINT fk_campaigns_program_id 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;

-- Tasks Table (depends on campaigns, profiles)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_no TEXT UNIQUE,
  description TEXT,
  channel TEXT,
  sub_channel TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (depends on profiles)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Activity Log Table (depends on profiles)
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Performance Metrics Table (depends on profiles)
CREATE TABLE IF NOT EXISTS public.user_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_campaigns INTEGER DEFAULT 0,
  active_campaigns INTEGER DEFAULT 0,
  total_earnings NUMERIC(12, 2) DEFAULT 0.00,
  pending_withdrawals NUMERIC(12, 2) DEFAULT 0.00,
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  performance_score NUMERIC(5, 2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
