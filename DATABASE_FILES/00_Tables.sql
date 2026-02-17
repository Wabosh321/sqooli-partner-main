-- ============================================================================
-- SQOOLI PARTNER DATABASE - TABLE DEFINITIONS
-- Generated: February 15, 2026
-- All CREATE TABLE statements with columns, types, defaults, PKs, FKs, indexes
-- ============================================================================

-- ============================================================================
-- FOUNDATION TABLES (No external dependencies)
-- ============================================================================

-- ============================================================================
-- Table: users
-- Purpose: System users and authentication mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE,
  convex_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'member'::TEXT,
  partner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_auth_id ON users(auth_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_users_convex_id ON users(convex_id);
CREATE INDEX idx_users_partner_id ON users(partner_id);

COMMENT ON TABLE users IS 'System users with authentication mapping to Supabase auth.users';
COMMENT ON COLUMN users.id IS 'Primary key - UUID';
COMMENT ON COLUMN users.auth_id IS 'Reference to auth.users.id (1:1 relationship)';
COMMENT ON COLUMN users.convex_id IS 'Legacy Convex ID for backwards compatibility';
COMMENT ON COLUMN users.role IS 'User role: member, partner, partner_admin, super_admin';

-- ============================================================================
-- Table: partner_types
-- Purpose: Partner type definitions (affiliate, agency, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  access_level INTEGER DEFAULT 25,
  default_commission_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_partner_types_name ON partner_types(name);
CREATE UNIQUE INDEX idx_partner_types_slug ON partner_types(slug);

COMMENT ON TABLE partner_types IS 'Partner type classification and access control';

-- ============================================================================
-- Table: permissions
-- Purpose: Role-based permission definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_permissions_name ON permissions(name);
CREATE UNIQUE INDEX idx_permissions_convex_id ON permissions(convex_id);

COMMENT ON TABLE permissions IS 'Permission definitions for role-based access control';

-- ============================================================================
-- Table: curricula
-- Purpose: Educational curriculum definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_curricula_convex_id ON curricula(convex_id);

COMMENT ON TABLE curricula IS 'Educational curriculum definitions';

-- ============================================================================
-- Table: subjects
-- Purpose: Subject definitions within curricula
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_subjects_convex_id ON subjects(convex_id);

COMMENT ON TABLE subjects IS 'Subject definitions for educational programs';

-- ============================================================================
-- Table: social_media_platforms
-- Purpose: Supported social media platforms configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_media_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon_name TEXT,
  url_pattern TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_social_media_platforms_name ON social_media_platforms(name);

COMMENT ON TABLE social_media_platforms IS 'Configuration for supported social media platforms';

-- ============================================================================
-- DEPENDENT TABLES (require users or foundation tables)
-- ============================================================================

-- ============================================================================
-- Table: partner_type_permissions
-- Purpose: Permissions assigned to partner types
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_type_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (partner_type_slug, permission_key),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug) ON DELETE CASCADE
);

CREATE INDEX idx_partner_type_permissions_slug ON partner_type_permissions(partner_type_slug);

COMMENT ON TABLE partner_type_permissions IS 'Many-to-many association of permissions to partner types';

-- ============================================================================
-- Table: partner_type_roles
-- Purpose: Roles available within partner types
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_type_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug TEXT NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (partner_type_slug, role_name),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug) ON DELETE CASCADE
);

COMMENT ON TABLE partner_type_roles IS 'Roles available within each partner type';

-- ============================================================================
-- Table: partners
-- Purpose: Organization/company partners and affiliates
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID NOT NULL,
  org_name TEXT NOT NULL,
  org_email TEXT,
  org_phone TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT,
  partner_type TEXT DEFAULT 'affiliate'::TEXT,
  access_level INTEGER DEFAULT 25,
  commission_rate NUMERIC DEFAULT 5.00,
  metadata JSONB,
  wallet_setup_completed BOOLEAN DEFAULT FALSE,
  wallet_setup_completed_at TIMESTAMP WITH TIME ZONE,
  campaign_created BOOLEAN DEFAULT FALSE,
  campaign_created_at TIMESTAMP WITH TIME ZONE,
  users_added BOOLEAN DEFAULT FALSE,
  users_added_at TIMESTAMP WITH TIME ZONE,
  two_factor_setup_completed BOOLEAN DEFAULT FALSE,
  two_factor_setup_completed_at TIMESTAMP WITH TIME ZONE,
  social_media_added BOOLEAN DEFAULT FALSE,
  social_media_completed_at TIMESTAMP WITH TIME ZONE,
  two_factor_phone TEXT,
  two_factor_phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_email TEXT,
  two_factor_email_verified BOOLEAN DEFAULT FALSE,
  social_media_links JSONB DEFAULT '{}'::JSONB,
  is_first_login BOOLEAN DEFAULT TRUE,
  onboarding_steps_skipped JSONB DEFAULT '[]'::JSONB,
  onboarding_metadata JSONB DEFAULT '{}'::JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_partners_user_id ON partners(user_id);
CREATE UNIQUE INDEX idx_partners_convex_id ON partners(convex_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_wallet_setup ON partners(wallet_setup_completed);
CREATE INDEX idx_partners_onboarding_completed ON partners(onboarding_completed);
CREATE INDEX idx_partners_is_first_login ON partners(is_first_login);

COMMENT ON TABLE partners IS 'Organization/company partners in the Sqooli affiliate program';
COMMENT ON COLUMN partners.user_id IS 'Foreign key to users.id - Partner primary contact';
COMMENT ON COLUMN partners.commission_rate IS '% commission for this partner (decimal 0-100)';

-- ============================================================================
-- Table: channels
-- Purpose: Communication channels for partners
-- ============================================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  name TEXT NOT NULL,
  subchannels JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX idx_channels_partner_id ON channels(partner_id);

COMMENT ON TABLE channels IS 'Marketing channels for partner campaigns';

-- ============================================================================
-- Table: programs
-- Purpose: Educational programs partners can promote
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  curriculum_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  pricing NUMERIC,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE SET NULL
);

CREATE INDEX idx_programs_curriculum_id ON programs(curriculum_id);
CREATE UNIQUE INDEX idx_programs_convex_id ON programs(convex_id);
CREATE INDEX idx_programs_status ON programs(status);

COMMENT ON TABLE programs IS 'Educational programs in the system';

-- ============================================================================
-- Table: campaigns
-- Purpose: Marketing campaigns created by partners
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL,
  program_id UUID,
  channel_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  subchannel TEXT,
  target_signups INTEGER,
  target_amount NUMERIC,
  current_amount NUMERIC,
  commission_rate NUMERIC,
  start_date DATE,
  end_date DATE,
  duration_start DATE,
  duration_end DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
);

CREATE INDEX idx_campaigns_partner_id ON campaigns(partner_id);
CREATE INDEX idx_campaigns_program_id ON campaigns(program_id);
CREATE INDEX idx_campaigns_channel_id ON campaigns(channel_id);
CREATE UNIQUE INDEX idx_campaigns_convex_id ON campaigns(convex_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_date_range ON campaigns(start_date, end_date);

COMMENT ON TABLE campaigns IS 'Marketing campaigns created by partners for specific programs';

-- ============================================================================
-- Table: program_enrollments
-- Purpose: User enrollment in educational programs
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  program_id UUID NOT NULL,
  campaign_id UUID,
  user_id UUID,
  status TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX idx_enrollments_campaign_id ON program_enrollments(campaign_id);
CREATE INDEX idx_enrollments_user_id ON program_enrollments(user_id);
CREATE UNIQUE INDEX idx_enrollments_convex_id ON program_enrollments(convex_id);
CREATE INDEX idx_enrollments_status ON program_enrollments(status);

COMMENT ON TABLE program_enrollments IS 'User enrollment tracking for educational programs';

-- ============================================================================
-- Table: transactions
-- Purpose: Financial transactions and payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  campaign_id UUID,
  user_id UUID,
  partner_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT,
  status TEXT,
  transaction_type TEXT,
  external_ref TEXT,
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

CREATE INDEX idx_transactions_campaign_id ON transactions(campaign_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_partner_id ON transactions(partner_id);
CREATE UNIQUE INDEX idx_transactions_convex_id ON transactions(convex_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

COMMENT ON TABLE transactions IS 'Financial transactions between users, partners, and campaigns';

-- ============================================================================
-- Table: wallets
-- Purpose: Partner financial accounts for fund management
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL UNIQUE,
  user_id UUID,
  balance NUMERIC,
  total_earned NUMERIC,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  status TEXT,
  withdrawal_method TEXT,
  paybill_number TEXT,
  pin TEXT,
  beneficiaries JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallets_partner_id ON wallets(partner_id);
CREATE UNIQUE INDEX idx_wallets_convex_id ON wallets(convex_id);

COMMENT ON TABLE wallets IS 'Partner wallets for tracking earnings and managing funds';
COMMENT ON COLUMN wallets.partner_id IS 'Unique constraint - one wallet per partner (1:1)';

-- ============================================================================
-- Table: withdrawals
-- Purpose: Partner withdrawal requests and management
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  partner_id UUID NOT NULL,
  wallet_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX idx_withdrawals_partner_id ON withdrawals(partner_id);
CREATE INDEX idx_withdrawals_wallet_id ON withdrawals(wallet_id);
CREATE UNIQUE INDEX idx_withdrawals_convex_id ON withdrawals(convex_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_requested_at ON withdrawals(requested_at);

COMMENT ON TABLE withdrawals IS 'Partner withdrawal requests with approval workflow';

-- ============================================================================
-- Table: audit_logs
-- Purpose: Activity and change tracking for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE UNIQUE INDEX idx_audit_logs_convex_id ON audit_logs(convex_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS 'Complete audit trail for all system changes';

-- ============================================================================
-- Table: notifications
-- Purpose: User notifications and alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id TEXT UNIQUE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE UNIQUE INDEX idx_notifications_convex_id ON notifications(convex_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS 'User notifications for system events and alerts';

-- ============================================================================
-- Table: two_factor_verifications
-- Purpose: Two-factor authentication OTP codes and verification
-- ============================================================================
CREATE TABLE IF NOT EXISTS two_factor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  verification_type TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + '00:10:00'::INTERVAL),
  metadata JSONB,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX idx_2fa_partner_id ON two_factor_verifications(partner_id);
CREATE INDEX idx_2fa_type ON two_factor_verifications(verification_type);
CREATE INDEX idx_2fa_contact ON two_factor_verifications(contact_value);
CREATE INDEX idx_2fa_verified ON two_factor_verifications(is_verified);
CREATE INDEX idx_2fa_expires ON two_factor_verifications(expires_at);

COMMENT ON TABLE two_factor_verifications IS 'Two-factor authentication codes and verification status';
COMMENT ON COLUMN two_factor_verifications.expires_at IS 'OTP expires 10 minutes after creation';

-- ============================================================================
-- Table: user_invites
-- Purpose: User invitation tracking and management
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'::TEXT,
  status TEXT DEFAULT 'pending'::TEXT,
  invited_by UUID,
  invitation_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + '7 days'::INTERVAL),
  metadata JSONB,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_invites_partner_id ON user_invites(partner_id);
CREATE INDEX idx_user_invites_email ON user_invites(email);
CREATE UNIQUE INDEX idx_user_invites_token ON user_invites(invitation_token);
CREATE INDEX idx_user_invites_status ON user_invites(status);
CREATE INDEX idx_user_invites_expires_at ON user_invites(expires_at);

COMMENT ON TABLE user_invites IS 'User invitation tokens and acceptance tracking';
COMMENT ON COLUMN user_invites.expires_at IS 'Invitations expire after 7 days';

-- ============================================================================
-- End of table definitions
-- Total tables created: 22
-- ============================================================================
