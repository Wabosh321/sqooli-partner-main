-- Sync partner_id and role to users table when partner is created/updated
-- This ensures users.partner_id and users.role are always in sync with partners table

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_partner_to_user_on_insert ON public.partners;
DROP TRIGGER IF EXISTS sync_partner_to_user_on_update ON public.partners;
DROP FUNCTION IF EXISTS sync_partner_to_user_fn();

-- Create function to sync partner changes to users table
CREATE OR REPLACE FUNCTION sync_partner_to_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user record to set partner_id and role
  UPDATE public.users
  SET 
    partner_id = NEW.id,
    role = 'partner',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER sync_partner_to_user_on_insert
AFTER INSERT ON public.partners
FOR EACH ROW
EXECUTE FUNCTION sync_partner_to_user_fn();

-- Trigger on UPDATE (in case partner is reassigned to different user)
CREATE TRIGGER sync_partner_to_user_on_update
AFTER UPDATE ON public.partners
FOR EACH ROW
WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
EXECUTE FUNCTION sync_partner_to_user_fn();

-- Fix existing data: update users where they own a partner but don't have partner_id set
UPDATE public.users u
SET 
  partner_id = p.id,
  role = 'partner',
  updated_at = CURRENT_TIMESTAMP
FROM public.partners p
WHERE u.id = p.user_id AND u.partner_id IS NULL;
