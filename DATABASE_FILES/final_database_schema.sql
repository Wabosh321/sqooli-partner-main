-- ============================================================================
-- SQOOLI PARTNER DATABASE SCHEMA - FRESH DEPLOYMENT
-- Authoritative schema derived from frontend types, CRUD operations, and Supabase definitions
-- ============================================================================

-- ============================================================================
-- CLEANUP: DROP ALL EXISTING OBJECTS
-- ============================================================================

-- Drop all triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON program_enrollments;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all tables with CASCADE
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS program_enrollments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS curricula CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table: System users and authentication mapping
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE,
  convex_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_convex_id ON users(convex_id);

-- Partners table: Organization/company partners
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  org_email TEXT,
  org_phone TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_convex_id ON partners(convex_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- Campaigns table: Marketing/fundraising campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  target_amount NUMERIC(15, 2),
  current_amount NUMERIC(15, 2),
  commission_rate NUMERIC(5, 2),
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_partner_id ON campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_convex_id ON campaigns(convex_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range ON campaigns(start_date, end_date);

-- Transactions table: Financial transactions and payments
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT,
  status TEXT,
  transaction_type TEXT,
  external_ref TEXT,
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_convex_id ON transactions(convex_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Wallets table: Partner financial accounts/wallets
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2),
  total_earned NUMERIC(15, 2),
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_partner_id ON wallets(partner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_convex_id ON wallets(convex_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_partner_unique ON wallets(partner_id);

-- Withdrawals table: Partner withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  status TEXT,
  reason TEXT,
  admin_notes TEXT,
  mpesa_receipt TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_partner_id ON withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_id ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_convex_id ON withdrawals(convex_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON withdrawals(requested_at);

-- ============================================================================
-- EDUCATION SYSTEM TABLES
-- ============================================================================

-- Curricula table: Curriculum definitions
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curricula_convex_id ON curricula(convex_id);

-- Subjects table: Subject definitions
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_convex_id ON subjects(convex_id);

-- Programs table: Educational programs
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  curriculum_id UUID REFERENCES curricula(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programs_curriculum_id ON programs(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_programs_convex_id ON programs(convex_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- Program Enrollments table: User enrollment in programs
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_campaign_id ON program_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_convex_id ON program_enrollments(convex_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON program_enrollments(status);

-- ============================================================================
-- NOTIFICATION & COMMUNICATION TABLES
-- ============================================================================

-- Notifications table: User notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_convex_id ON notifications(convex_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- ACCESS CONTROL & AUDIT TABLES
-- ============================================================================

-- Permissions table: Role-based permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_convex_id ON permissions(convex_id);

-- Audit Logs table: Activity and change tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_convex_id ON audit_logs(convex_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Ensure referential integrity
ALTER TABLE partners ADD CONSTRAINT fk_partners_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_partner_id 
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_campaign_id 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_partner_id 
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE wallets ADD CONSTRAINT fk_wallets_partner_id 
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;

ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawals_partner_id 
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;

ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawals_wallet_id 
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;

ALTER TABLE programs ADD CONSTRAINT fk_programs_curriculum_id 
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE SET NULL;

ALTER TABLE program_enrollments ADD CONSTRAINT fk_enrollments_program_id 
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE program_enrollments ADD CONSTRAINT fk_enrollments_campaign_id 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE program_enrollments ADD CONSTRAINT fk_enrollments_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTH INTEGRATION NOTES & FUNCTIONS
-- ============================================================================
-- Simple Email Verification Flow:
-- 1. User signs up → auth.users created, verification email sent
-- 2. User sees "Check email to verify" message
-- 3. User clicks email link → email verified
-- 4. Client detects email_confirmed = true
-- 5. Client calls create_user_profile() with full details
-- 6. Profile created in public.users with all information

-- Function to create user profile after email verification
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_username TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  username TEXT,
  role TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify user is authenticated and auth_id matches their token
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_auth_id THEN
    RAISE EXCEPTION 'auth_id mismatch';
  END IF;
  
  -- Insert the profile
  INSERT INTO public.users (auth_id, email, full_name, phone, username, role)
  VALUES (p_auth_id, p_email, p_full_name, p_phone, p_username, 'member')
  RETURNING users.id INTO v_user_id;
  
  -- Return the created user
  RETURN QUERY
  SELECT users.id, users.auth_id, users.email, users.full_name, users.phone, users.username, users.role
  FROM public.users
  WHERE users.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curricula_updated_at BEFORE UPDATE ON curricula
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON program_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

-- Note: INSERT happens via create_user_profile() function which has SECURITY DEFINER
-- Direct INSERT via client is not allowed via RLS policy

-- ============================================================================
-- PARTNERS TABLE POLICIES
-- ============================================================================

-- Users can view partners they own
CREATE POLICY "Users can view own partners"
  ON partners FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- Users can update their own partners
CREATE POLICY "Users can update own partners"
  ON partners FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert partners"
  ON partners FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CAMPAIGNS TABLE POLICIES
-- ============================================================================

-- Users can view campaigns from their partners
CREATE POLICY "Users can view own partner campaigns"
  ON campaigns FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth.uid() = auth_id
      )
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Users can view transactions from their campaigns
CREATE POLICY "Users can view own partner transactions"
  ON transactions FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth.uid() = auth_id
      )
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- WALLETS TABLE POLICIES
-- ============================================================================

-- Users can view their wallet
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth.uid() = auth_id
      )
    )
  );

-- Service role can insert/update
CREATE POLICY "Service role can manage wallets"
  ON wallets FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- WITHDRAWALS TABLE POLICIES
-- ============================================================================

-- Users can view their withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth.uid() = auth_id
      )
    )
  );

-- Service role can manage
CREATE POLICY "Service role can manage withdrawals"
  ON withdrawals FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================================

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- Service role can insert
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================

-- Anyone can view permissions
CREATE POLICY "Public can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================

-- Anyone can view programs
CREATE POLICY "Public can view programs"
  ON programs FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage programs"
  ON programs FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- CURRICULA TABLE POLICIES
-- ============================================================================

-- Anyone can view curricula
CREATE POLICY "Public can view curricula"
  ON curricula FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage curricula"
  ON curricula FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- SUBJECTS TABLE POLICIES
-- ============================================================================

-- Anyone can view subjects
CREATE POLICY "Public can view subjects"
  ON subjects FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage subjects"
  ON subjects FOR ALL
  WITH CHECK (true);

-- ============================================================================
-- PROGRAM ENROLLMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON program_enrollments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth.uid() = auth_id
    )
  );

-- Service role can manage
CREATE POLICY "Service role can manage enrollments"
  ON program_enrollments FOR ALL
  WITH CHECK (true);
