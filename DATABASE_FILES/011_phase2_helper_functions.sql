-- DEPRECATED: This file is no longer used
-- 
-- The is_partner_admin() function has been moved to 003_ext_helper_functions.sql
-- which runs earlier in the migration sequence to support RLS policies in tables 005-007.
--
-- This file is kept for reference but should be skipped during migration execution.
-- If this file is accidentally run, it will just recreate the function (harmless).

-- is_partner_admin: Check if user is admin of a partner
-- DEPRECATED - See 003_ext_helper_functions.sql
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
