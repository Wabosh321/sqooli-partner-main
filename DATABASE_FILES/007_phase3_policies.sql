-- ============================================================================
-- PHASE 3: WALLETS, TRANSACTIONS, AND WITHDRAWALS RLS POLICIES
-- ============================================================================

-- ============================================================================
-- WALLETS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view own wallet or partner admin or super admin
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (
    user_id = auth.uid()
    OR partner_id = public.get_user_partner_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

-- INSERT: Finance admin or partner admin only
CREATE POLICY "Partner admins can create wallets" ON public.wallets
  FOR INSERT WITH CHECK (
    is_super_admin(auth.uid())
    OR public.is_partner_admin(partner_id)
  );

-- UPDATE: Owner or partner admin or super admin
CREATE POLICY "Authorized users can update wallets" ON public.wallets
  FOR UPDATE USING (
    user_id = auth.uid()
    OR public.is_partner_admin(partner_id)
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_partner_admin(partner_id)
    OR is_super_admin(auth.uid())
  );

-- DELETE: Super admin only
CREATE POLICY "Only super admins can delete wallets" ON public.wallets
  FOR DELETE USING (is_super_admin(auth.uid()));

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view own transactions or partner finance can view all partner transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    user_id = auth.uid()
    OR partner_id = public.get_user_partner_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

-- INSERT: System/RPC or partner admin (via RPC)
CREATE POLICY "System can record transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    is_super_admin(auth.uid())
    OR public.is_partner_admin(partner_id)
  );

-- UPDATE: Finance admin or super admin only
CREATE POLICY "Finance admins can update transactions" ON public.transactions
  FOR UPDATE USING (
    is_super_admin(auth.uid())
    OR (
      public.is_partner_admin(partner_id)
      AND status != 'completed'
    )
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR (
      public.is_partner_admin(partner_id)
      AND status != 'completed'
    )
  );

-- DELETE: Super admin only
CREATE POLICY "Only super admins can delete transactions" ON public.transactions
  FOR DELETE USING (is_super_admin(auth.uid()));

-- ============================================================================
-- WITHDRAWALS TABLE POLICIES
-- ============================================================================

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view own withdrawals or finance can view all
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (
    user_id = auth.uid()
    OR partner_id = public.get_user_partner_id(auth.uid())
    OR is_super_admin(auth.uid())
  );

-- INSERT: User can request own withdrawal or partner admin
CREATE POLICY "Users can request own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR public.is_partner_admin(partner_id)
    OR is_super_admin(auth.uid())
  );

-- UPDATE: Finance admin or super admin (status changes)
CREATE POLICY "Finance admins can update withdrawal status" ON public.withdrawals
  FOR UPDATE USING (
    is_super_admin(auth.uid())
    OR public.is_partner_admin(partner_id)
  )
  WITH CHECK (
    is_super_admin(auth.uid())
    OR public.is_partner_admin(partner_id)
  );

-- DELETE: Super admin only
CREATE POLICY "Only super admins can delete withdrawals" ON public.withdrawals
  FOR DELETE USING (is_super_admin(auth.uid()));

-- ============================================================================
-- WALLET HISTORY TABLE POLICIES (AUDIT TRAIL)
-- ============================================================================

ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view own wallet history or partner admin or super admin
CREATE POLICY "Users can view own wallet history" ON public.wallet_history
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM public.wallets
      WHERE user_id = auth.uid()
        OR partner_id = public.get_user_partner_id(auth.uid())
        OR is_super_admin(auth.uid())
    )
  );

-- INSERT: System only (via triggers)
CREATE POLICY "System can record wallet history" ON public.wallet_history
  FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE on wallet history (immutable audit trail)
