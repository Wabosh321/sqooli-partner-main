-- Migration: Auto-update wallet_setup_completed when wallet is created
-- Purpose: Automatically set partners.wallet_setup_completed = true when a wallet is inserted

-- Create trigger function
CREATE OR REPLACE FUNCTION update_wallet_setup_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the partner's wallet_setup_completed flag when a wallet is created
  UPDATE public.partners
  SET 
    wallet_setup_completed = true,
    wallet_setup_completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.partner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wallets table
DROP TRIGGER IF EXISTS wallet_created_trigger ON public.wallets;

CREATE TRIGGER wallet_created_trigger
AFTER INSERT ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_setup_completed();

-- Backfill existing wallets (set wallet_setup_completed = true for partners that have wallets)
UPDATE public.partners
SET 
  wallet_setup_completed = true,
  wallet_setup_completed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT DISTINCT partner_id FROM public.wallets)
  AND wallet_setup_completed != true;

COMMENT ON FUNCTION update_wallet_setup_completed() IS 'Auto-updates partners.wallet_setup_completed when a wallet is created';
