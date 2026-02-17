-- Phase 1: Profiles Table
-- Extends Supabase auth.users with partner metadata and permissions
-- Note: Partners table must be created first (001_phase1_partners_table.sql)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON public.profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_user_id ON public.profiles(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT - self or admin
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can view partner members" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE partner_id = profiles.partner_id 
      AND role ILIKE '%admin%'
    )
  );

-- RLS Policies: UPDATE - self limited fields
CREATE POLICY "Users can update own limited fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies: INSERT - admin only
CREATE POLICY "Only admins can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profiles_updated_at();
