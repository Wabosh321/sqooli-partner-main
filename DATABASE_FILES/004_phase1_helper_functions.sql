-- Phase 1: Helper SQL Functions

-- is_super_admin: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- get_user_partner_id: Get partner ID for a user
CREATE OR REPLACE FUNCTION public.get_user_partner_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT partner_id FROM public.profiles 
    WHERE id = user_id 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- is_authenticated: Check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;
