-- Phase 2: Campaigns Table

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id ON public.campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_program_id ON public.campaigns(program_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by_user_id ON public.campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_promo_code ON public.campaigns(promo_code);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT
CREATE POLICY "Users can view own partner campaigns" ON public.campaigns
  FOR SELECT USING (
    partner_id = public.get_user_partner_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

-- RLS Policies: INSERT
CREATE POLICY "Partner admins can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    public.is_partner_admin(partner_id)
  );

-- RLS Policies: UPDATE
CREATE POLICY "Partner admins can update campaigns" ON public.campaigns
  FOR UPDATE USING (
    public.is_partner_admin(partner_id)
  )
  WITH CHECK (
    public.is_partner_admin(partner_id)
  );

-- RLS Policies: DELETE
CREATE POLICY "Partner admins can delete campaigns" ON public.campaigns
  FOR DELETE USING (
    public.is_partner_admin(partner_id)
  );

-- Trigger
CREATE OR REPLACE FUNCTION public.handle_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_campaigns_updated_at();
