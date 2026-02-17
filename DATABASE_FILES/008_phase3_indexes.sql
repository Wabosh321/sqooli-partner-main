-- ============================================================================
-- PHASE 3: WALLETS, TRANSACTIONS, AND WITHDRAWALS INDEXES
-- ============================================================================

-- ============================================================================
-- WALLETS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallets_partner_id ON public.wallets(partner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON public.wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_wallets_last_transaction_at ON public.wallets(last_transaction_at);

-- ============================================================================
-- TRANSACTIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON public.transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_campaign_id ON public.transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);

-- Composite index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_status ON public.transactions(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_created ON public.transactions(partner_id, created_at DESC);

-- ============================================================================
-- WITHDRAWALS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON public.withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_partner_id ON public.withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_at ON public.withdrawals(processed_at);

-- Composite index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_status ON public.withdrawals(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_partner_pending ON public.withdrawals(partner_id, status) 
  WHERE status IN ('pending', 'approved', 'processing');

-- ============================================================================
-- WALLET HISTORY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallet_history_wallet_id ON public.wallet_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_created_at ON public.wallet_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_history_action ON public.wallet_history(action);

-- Composite index for efficient audit trails
CREATE INDEX IF NOT EXISTS idx_wallet_history_wallet_created ON public.wallet_history(wallet_id, created_at DESC);
