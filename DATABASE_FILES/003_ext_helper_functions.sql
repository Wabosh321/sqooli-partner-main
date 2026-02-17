-- Phase 1 Extended: Additional Helper Functions
-- These must run after basic helper functions (003) and before tables that use them

-- is_partner_admin: Check if user is admin of a partner
-- Used by: campaigns (004), programs (005), tasks (006) RLS policies
CREATE OR REPLACE FUNCTION public.is_partner_admin(partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE partner_id = partner_id 
    AND (role ILIKE '%admin%' OR is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;
