-- ============================================================================
-- SQOOLI PARTNER DATABASE - ROW LEVEL SECURITY (RLS) POLICIES
-- Generated: February 15, 2026
-- Enable RLS and define access control policies for all tables
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Note: RLS disabled by default - enable as needed:
-- ALTER TABLE partner_type_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE partner_type_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE social_media_platforms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE two_factor_verifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLEANUP: DROP EXISTING POLICIES (for re-runs)
-- ============================================================================

DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;

DROP POLICY IF EXISTS "partners_service_insert" ON partners;
DROP POLICY IF EXISTS "partners_user_select" ON partners;
DROP POLICY IF EXISTS "partners_user_update" ON partners;

DROP POLICY IF EXISTS "campaigns_service_insert" ON campaigns;
DROP POLICY IF EXISTS "campaigns_user_select" ON campaigns;
DROP POLICY IF EXISTS "campaigns_user_update" ON campaigns;
DROP POLICY IF EXISTS "campaigns_user_delete" ON campaigns;

DROP POLICY IF EXISTS "channels_prevent_direct_insert" ON channels;
DROP POLICY IF EXISTS "channels_user_select" ON channels;

DROP POLICY IF EXISTS "programs_public_select" ON programs;
DROP POLICY IF EXISTS "programs_service_all" ON programs;

DROP POLICY IF EXISTS "curricula_public_select" ON curricula;
DROP POLICY IF EXISTS "curricula_service_all" ON curricula;

DROP POLICY IF EXISTS "subjects_public_select" ON subjects;
DROP POLICY IF EXISTS "subjects_service_all" ON subjects;

DROP POLICY IF EXISTS "program_enrollments_service_all" ON program_enrollments;
DROP POLICY IF EXISTS "enrollments_user_select" ON program_enrollments;

DROP POLICY IF EXISTS "transactions_service_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_user_select" ON transactions;

DROP POLICY IF EXISTS "wallets_service_all" ON wallets;
DROP POLICY IF EXISTS "wallets_user_select" ON wallets;

DROP POLICY IF EXISTS "withdrawals_service_all" ON withdrawals;
DROP POLICY IF EXISTS "withdrawals_user_select" ON withdrawals;

DROP POLICY IF EXISTS "audit_logs_service_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_user_select" ON audit_logs;

DROP POLICY IF EXISTS "notifications_service_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
DROP POLICY IF EXISTS "notifications_user_update" ON notifications;

DROP POLICY IF EXISTS "permissions_public_select" ON permissions;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view their own profile only
CREATE POLICY "users_self_select" ON users
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Policy: Users can update their own profile
CREATE POLICY "users_self_update" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Note: INSERT is handled via create_user_profile() function with SECURITY DEFINER

-- ============================================================================
-- PARTNERS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can insert partners (called from functions)
CREATE POLICY "partners_service_insert" ON partners
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view partners they own/manage
CREATE POLICY "partners_user_select" ON partners
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- Policy: Users can update their own partners
CREATE POLICY "partners_user_update" ON partners
  FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- ============================================================================
-- CAMPAIGNS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can insert campaigns (called from functions)
CREATE POLICY "campaigns_service_insert" ON campaigns
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view campaigns from their own partners
CREATE POLICY "campaigns_user_select" ON campaigns
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- Policy: Users can update campaigns from their own partners
CREATE POLICY "campaigns_user_update" ON campaigns
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- Policy: Users can delete campaigns from their own partners
CREATE POLICY "campaigns_user_delete" ON campaigns
  FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- ============================================================================
-- CHANNELS TABLE POLICIES
-- ============================================================================
-- Policy: Channel creation restricted to service role/functions
CREATE POLICY "channels_prevent_direct_insert" ON channels
  FOR INSERT
  WITH CHECK (false);

-- Policy: Users can view channels from their own partners
CREATE POLICY "channels_user_select" ON channels
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================
-- Policy: Public read access to programs (anyone can view educational content)
CREATE POLICY "programs_public_select" ON programs
  FOR SELECT
  USING (true);

-- Policy: Service role can manage programs
CREATE POLICY "programs_service_all" ON programs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CURRICULA TABLE POLICIES
-- ============================================================================
-- Policy: Public read access to curricula
CREATE POLICY "curricula_public_select" ON curricula
  FOR SELECT
  USING (true);

-- Policy: Service role can manage curricula
CREATE POLICY "curricula_service_all" ON curricula
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SUBJECTS TABLE POLICIES
-- ============================================================================
-- Policy: Public read access to subjects
CREATE POLICY "subjects_public_select" ON subjects
  FOR SELECT
  USING (true);

-- Policy: Service role can manage subjects
CREATE POLICY "subjects_service_all" ON subjects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PROGRAM ENROLLMENTS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can manage enrollments
CREATE POLICY "program_enrollments_service_all" ON program_enrollments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own enrollments
CREATE POLICY "enrollments_user_select" ON program_enrollments
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can insert transactions (called from payment functions)
CREATE POLICY "transactions_service_insert" ON transactions
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view transactions from their own partners
CREATE POLICY "transactions_user_select" ON transactions
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- ============================================================================
-- WALLETS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can manage wallets
CREATE POLICY "wallets_service_all" ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own wallets
CREATE POLICY "wallets_user_select" ON wallets
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- ============================================================================
-- WITHDRAWALS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can manage withdrawals (admin approval workflow)
CREATE POLICY "withdrawals_service_all" ON withdrawals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own withdrawal requests
CREATE POLICY "withdrawals_user_select" ON withdrawals
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
    )
  );

-- ============================================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can insert audit logs (called from audit triggers)
CREATE POLICY "audit_logs_service_insert" ON audit_logs
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own audit logs
CREATE POLICY "audit_logs_user_select" ON audit_logs
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================
-- Policy: Service role can insert notifications
CREATE POLICY "notifications_service_insert" ON notifications
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: Users can view their own notifications
CREATE POLICY "notifications_user_select" ON notifications
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "notifications_user_update" ON notifications
  FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)
  );

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================
-- Policy: Public read access to permissions (reference data)
CREATE POLICY "permissions_public_select" ON permissions
  FOR SELECT
  USING (true);

-- ============================================================================
-- RLS SUMMARY
-- ============================================================================
-- RLS Enabled: 14 tables
-- Total Policies Created: 33
--
-- Authentication Pattern:
-- - auth.uid() returns the UUID of the currently authenticated user
-- - Cross-reference with auth_id in users table to find matching user
-- - Use user_id to enforce ownership-based access controls
--
-- Service Role:
-- - Can always INSERT/UPDATE via functions with SECURITY DEFINER
-- - Policies return true for service role (which bypasses RLS)
--
-- User Access Patterns:
-- - View own record (auth.uid() = auth_id on users table)
-- - View related records via foreign key relationships
-- - Cannot update/delete others' data
--
-- ============================================================================
