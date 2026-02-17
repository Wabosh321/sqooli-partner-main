-- Phase 2: User Performance Metrics Table

CREATE TABLE IF NOT EXISTS public.user_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_campaigns INTEGER DEFAULT 0,
  active_campaigns INTEGER DEFAULT 0,
  total_earnings NUMERIC(12, 2) DEFAULT 0.00,
  pending_withdrawals NUMERIC(12, 2) DEFAULT 0.00,
  completed_withdrawals NUMERIC(12, 2) DEFAULT 0.00,
  engagements INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_user_id ON public.user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_parent_user_id ON public.user_performance_metrics(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_metrics_performance_score ON public.user_performance_metrics(performance_score);

-- Enable RLS
ALTER TABLE public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT
CREATE POLICY "Users can view own and team metrics" ON public.user_performance_metrics
  FOR SELECT USING (
    user_id = auth.uid()
    OR parent_user_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- RLS Policies: UPDATE - admin only
CREATE POLICY "Admin can update metrics" ON public.user_performance_metrics
  FOR UPDATE USING (
    is_super_admin(auth.uid())
  )
  WITH CHECK (
    is_super_admin(auth.uid())
  );

-- Trigger
CREATE OR REPLACE FUNCTION public.handle_user_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_performance_metrics_updated_at ON public.user_performance_metrics;
CREATE TRIGGER user_performance_metrics_updated_at
  BEFORE UPDATE ON public.user_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_performance_metrics_updated_at();
