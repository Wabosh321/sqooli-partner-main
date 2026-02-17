-- Phase 1: Partners Table (must be created before profiles)
-- Organization records

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partners_partner_type ON public.partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_org_name ON public.partners(org_name);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT - own partner
CREATE POLICY "Users can view own partner" ON public.partners
  FOR SELECT USING (
    id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
    OR is_super_admin(auth.uid())
  );

-- RLS Policies: INSERT - super admin only
CREATE POLICY "Only super admins can create partners" ON public.partners
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies: UPDATE - admin or super admin
CREATE POLICY "Partner admins can update own partner" ON public.partners
  FOR UPDATE USING (
    is_super_admin(auth.uid())
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND role ILIKE '%admin%')
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND role ILIKE '%admin%')
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partners_updated_at();
