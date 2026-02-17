-- Phase 2: Tasks Table

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_user_id ON public.tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_approver_id ON public.tasks(approver_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_reference_no ON public.tasks(reference_no);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT
CREATE POLICY "Stakeholders can view tasks" ON public.tasks
  FOR SELECT USING (
    created_by_user_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- RLS Policies: INSERT
CREATE POLICY "Partner admins can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    public.is_partner_admin(
      (SELECT partner_id FROM public.campaigns WHERE id = campaign_id)
    )
  );

-- RLS Policies: UPDATE
CREATE POLICY "Creator or approver can update tasks" ON public.tasks
  FOR UPDATE USING (
    created_by_user_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR approver_id = auth.uid()
    OR is_super_admin(auth.uid())
  );

-- Trigger
CREATE OR REPLACE FUNCTION public.handle_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tasks_updated_at();
