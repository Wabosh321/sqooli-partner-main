-- Phase 2: Programs Table

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_partner_id ON public.programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by_user_id ON public.programs(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT
CREATE POLICY "Users can view own partner programs" ON public.programs
  FOR SELECT USING (
    partner_id = public.get_user_partner_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

-- RLS Policies: INSERT
CREATE POLICY "Partner admins can create programs" ON public.programs
  FOR INSERT WITH CHECK (
    public.is_partner_admin(partner_id)
  );

-- RLS Policies: UPDATE
CREATE POLICY "Partner admins can update programs" ON public.programs
  FOR UPDATE USING (
    public.is_partner_admin(partner_id)
  )
  WITH CHECK (
    public.is_partner_admin(partner_id)
  );

-- RLS Policies: DELETE
CREATE POLICY "Partner admins can delete programs" ON public.programs
  FOR DELETE USING (
    public.is_partner_admin(partner_id)
  );

-- Trigger
CREATE OR REPLACE FUNCTION public.handle_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON public.programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_programs_updated_at();
