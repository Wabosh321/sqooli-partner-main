-- ============================================================================
-- PHASE 3: WALLETS, TRANSACTIONS, AND WITHDRAWALS FUNCTIONS
-- ============================================================================

-- ============================================================================
-- RPC: Record Transaction (earnings, bonuses, referrals, adjustments)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_record_transaction(
  p_wallet_id UUID,
  p_partner_id UUID,
  p_user_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_campaign_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('earnings', 'bonus', 'referral', 'adjustment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid transaction type: ' || p_transaction_type
    );
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction amount must be positive'
    );
  END IF;

  BEGIN
    -- Record transaction
    INSERT INTO public.transactions (
      wallet_id, partner_id, user_id, campaign_id, transaction_type, 
      amount, description, reference_number, metadata, status
    )
    VALUES (
      p_wallet_id, p_partner_id, p_user_id, p_campaign_id, p_transaction_type,
      p_amount, p_description, p_reference_number, p_metadata, 'completed'
    )
    RETURNING id INTO v_transaction_id;

    -- Update wallet balance and total earnings
    UPDATE public.wallets
    SET 
      balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      last_transaction_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_wallet_id
    RETURNING balance INTO v_new_balance;

    -- Record wallet history
    INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason, metadata)
    VALUES (
      p_wallet_id, 'transaction_recorded', p_amount, v_new_balance,
      p_transaction_type || ': ' || p_description,
      jsonb_build_object('transaction_id', v_transaction_id, 'type', p_transaction_type)
    );

    -- Update user performance metrics
    UPDATE public.user_performance_metrics
    SET 
      total_earnings = COALESCE(total_earnings, 0) + p_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Transaction recorded',
      'transaction_recorded',
      'transactions',
      v_transaction_id::text,
      jsonb_build_object(
        'type', p_transaction_type,
        'amount', p_amount,
        'wallet_id', p_wallet_id
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'transaction_id', v_transaction_id,
      'new_balance', v_new_balance,
      'message', 'Transaction recorded successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Request Withdrawal
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_request_withdrawal(
  p_wallet_id UUID,
  p_partner_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_withdrawal_method TEXT DEFAULT 'mpesa',
  p_mpesa_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal_id UUID;
  v_wallet_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Withdrawal amount must be positive'
    );
  END IF;

  BEGIN
    -- Get current wallet balance
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE id = p_wallet_id;

    -- Check sufficient balance (including pending withdrawals)
    SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
    FROM public.withdrawals
    WHERE wallet_id = p_wallet_id AND status IN ('pending', 'approved', 'processing');

    IF (v_wallet_balance - v_pending_withdrawals) < p_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient balance',
        'available', v_wallet_balance - v_pending_withdrawals,
        'requested', p_amount
      );
    END IF;

    -- Create withdrawal request
    INSERT INTO public.withdrawals (
      wallet_id, partner_id, user_id, amount, withdrawal_method, 
      mpesa_reference, status
    )
    VALUES (
      p_wallet_id, p_partner_id, p_user_id, p_amount, p_withdrawal_method,
      p_mpesa_reference, 'pending'
    )
    RETURNING id INTO v_withdrawal_id;

    -- Update pending withdrawals in wallet
    UPDATE public.wallets
    SET 
      pending_withdrawals = pending_withdrawals + p_amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_wallet_id;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Withdrawal requested',
      'withdrawal_requested',
      'withdrawals',
      v_withdrawal_id::text,
      jsonb_build_object(
        'amount', p_amount,
        'method', p_withdrawal_method
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'withdrawal_id', v_withdrawal_id,
      'status', 'pending',
      'message', 'Withdrawal request created successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Process Withdrawal (approve/reject/complete)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_process_withdrawal(
  p_withdrawal_id UUID,
  p_status TEXT,
  p_reviewed_by_user_id UUID,
  p_review_notes TEXT DEFAULT NULL,
  p_mpesa_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Validate status
  IF p_status NOT IN ('approved', 'rejected', 'processing', 'completed', 'failed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid withdrawal status: ' || p_status
    );
  END IF;

  BEGIN
    -- Get withdrawal details
    SELECT * INTO v_withdrawal
    FROM public.withdrawals
    WHERE id = p_withdrawal_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Withdrawal not found'
      );
    END IF;

    v_wallet_id := v_withdrawal.wallet_id;

    -- Update withdrawal
    UPDATE public.withdrawals
    SET 
      status = p_status,
      reviewed_by_user_id = p_reviewed_by_user_id,
      review_notes = p_review_notes,
      mpesa_reference = COALESCE(p_mpesa_reference, mpesa_reference),
      processed_at = CASE WHEN p_status IN ('approved', 'processing') THEN CURRENT_TIMESTAMP ELSE processed_at END,
      completed_at = CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_withdrawal_id;

    -- If rejected or failed, return funds to available balance
    IF p_status IN ('rejected', 'failed') THEN
      UPDATE public.wallets
      SET 
        pending_withdrawals = pending_withdrawals - v_withdrawal.amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_wallet_id
      RETURNING balance INTO v_new_balance;

      -- Record wallet history
      INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason)
      VALUES (
        v_wallet_id, 'withdrawal_' || p_status, 0, v_new_balance,
        'Withdrawal ' || p_status || ': ' || COALESCE(p_review_notes, '')
      );
    ELSIF p_status = 'completed' THEN
      -- Deduct from balance completely
      UPDATE public.wallets
      SET 
        balance = balance - v_withdrawal.amount,
        pending_withdrawals = pending_withdrawals - v_withdrawal.amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_wallet_id
      RETURNING balance INTO v_new_balance;

      -- Record wallet history
      INSERT INTO public.wallet_history (wallet_id, action, change_amount, new_balance, reason)
      VALUES (
        v_wallet_id, 'withdrawal_completed', -v_withdrawal.amount, v_new_balance,
        'Withdrawal completed via ' || v_withdrawal.withdrawal_method
      );
    END IF;

    -- Log audit event
    PERFORM rpc_log_audit_event(
      'Withdrawal processed: ' || p_status,
      'withdrawal_processed',
      'withdrawals',
      p_withdrawal_id::text,
      jsonb_build_object(
        'previous_status', v_withdrawal.status,
        'new_status', p_status,
        'amount', v_withdrawal.amount
      )
    );

    v_result := jsonb_build_object(
      'success', true,
      'withdrawal_id', p_withdrawal_id,
      'status', p_status,
      'new_balance', v_new_balance,
      'message', 'Withdrawal processed successfully'
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR updated_at TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallets_updated_at ON public.wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_wallets_updated_at();

CREATE OR REPLACE FUNCTION public.handle_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_transactions_updated_at();

CREATE OR REPLACE FUNCTION public.handle_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawals_updated_at();
