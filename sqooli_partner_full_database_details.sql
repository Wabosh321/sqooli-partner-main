-- ============================================================================
-- SQOOLI PARTNER PLATFORM - DATABASE SCHEMA REFERENCE
-- ============================================================================
--
-- Generated: January 2, 2026
-- Source: Supabase MCP Live Session
-- Project: heqsfgmrosuupxahdtda
-- Schema: public
--
-- IMPORTANT: This file is a REFERENCE and DOCUMENTATION artifact.
-- It is NOT meant to be automatically applied to any environment.
-- Use for: Documentation, migration planning, schema backup, diffing
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE TABLES (Ordered by Dependency)
-- ============================================================================

-- ============================================================================
-- Table: users (Foundation - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE,
  convex_id text UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  username text UNIQUE,
  role text DEFAULT 'member'::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  partner_id uuid
);

-- ============================================================================
-- Table: partner_types (Foundation - referenced by partners and permissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  access_level integer DEFAULT 25,
  default_commission_rate numeric,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: permissions (Foundation - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: partner_type_permissions (Depends on: partner_types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_type_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug text NOT NULL,
  permission_key text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (partner_type_slug, permission_key),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug)
);

-- ============================================================================
-- Table: partner_type_roles (Depends on: partner_types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_type_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug text NOT NULL,
  role_name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (partner_type_slug, role_name),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug)
);

-- ============================================================================
-- Table: partners (Depends on: users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  user_id uuid NOT NULL,
  org_name text NOT NULL,
  org_email text,
  org_phone text,
  description text,
  logo_url text,
  status text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  partner_type text DEFAULT 'affiliate'::text,
  access_level integer DEFAULT 25,
  commission_rate numeric DEFAULT 5.00,
  wallet_setup_completed boolean DEFAULT false,
  campaign_created boolean DEFAULT false,
  users_added boolean DEFAULT false,
  two_factor_setup_completed boolean DEFAULT false,
  social_media_added boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamp with time zone,
  wallet_setup_completed_at timestamp with time zone,
  campaign_created_at timestamp with time zone,
  users_added_at timestamp with time zone,
  two_factor_setup_completed_at timestamp with time zone,
  social_media_completed boolean DEFAULT false,
  social_media_completed_at timestamp with time zone,
  two_factor_phone text,
  two_factor_phone_verified boolean DEFAULT false,
  two_factor_email text,
  two_factor_email_verified boolean DEFAULT false,
  social_media_links jsonb DEFAULT '{}'::jsonb,
  is_first_login boolean DEFAULT true,
  onboarding_steps_skipped jsonb DEFAULT '[]'::jsonb,
  onboarding_metadata jsonb DEFAULT '{}'::jsonb,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- Table: curricula (Foundation - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: programs (Depends on: curricula)
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  curriculum_id uuid,
  name text NOT NULL,
  description text,
  status text,
  start_date date,
  end_date date,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  pricing numeric,
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id)
);

-- ============================================================================
-- Table: subjects (Foundation - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: channels (Depends on: partners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  name text NOT NULL,
  subchannels jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- ============================================================================
-- Table: campaigns (Depends on: partners, programs, channels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  partner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text,
  target_amount numeric,
  current_amount numeric,
  commission_rate numeric,
  start_date date,
  end_date date,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  program_id uuid,
  channel_id uuid,
  subchannel text,
  target_signups integer,
  duration_start date,
  duration_end date,
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

-- ============================================================================
-- Table: audit_logs (Depends on: users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- Table: notifications (Depends on: users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- Table: program_enrollments (Depends on: users, programs, campaigns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  program_id uuid NOT NULL,
  campaign_id uuid,
  user_id uuid,
  status text,
  enrollment_date date DEFAULT CURRENT_DATE,
  completion_date date,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- Table: transactions (Depends on: users, partners, campaigns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  campaign_id uuid,
  user_id uuid,
  partner_id uuid,
  amount numeric NOT NULL,
  currency text,
  status text,
  transaction_type text,
  external_ref text,
  payment_method text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- ============================================================================
-- Table: two_factor_verifications (Depends on: partners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS two_factor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  verification_type text NOT NULL,
  contact_value text NOT NULL,
  otp_code text NOT NULL,
  attempts integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  verified_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '00:10:00'::interval),
  metadata jsonb,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- ============================================================================
-- Table: user_invites (Depends on: partners, users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  status text DEFAULT 'pending'::text,
  invited_by uuid,
  invitation_token text UNIQUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval),
  metadata jsonb,
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

-- ============================================================================
-- Table: wallets (Depends on: partners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  partner_id uuid NOT NULL UNIQUE,
  balance numeric,
  total_earned numeric,
  bank_name text,
  account_number text,
  account_holder text,
  status text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid,
  withdrawal_method text,
  paybill_number text,
  pin text,
  beneficiaries jsonb,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- ============================================================================
-- Table: withdrawals (Depends on: partners, wallets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convex_id text UNIQUE,
  partner_id uuid NOT NULL,
  wallet_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text,
  reason text,
  admin_notes text,
  mpesa_receipt text,
  requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  approved_at timestamp with time zone,
  completed_at timestamp with time zone,
  approved_by text,
  rejection_reason text,
  rejected_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- ============================================================================
-- Table: social_media_platforms (Foundation - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_media_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon_name text,
  url_pattern text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 2: FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Note: Foreign keys are defined inline with CREATE TABLE statements above.
-- This section documents all relationships for reference.

-- users → partners (1:1 optional) via users.partner_id
-- partners → users (1:1) via partners.user_id
-- partners → partner_types (implicit via partner_type column)
-- campaigns → partners (1:N) via campaigns.partner_id
-- campaigns → programs (1:N) via campaigns.program_id
-- campaigns → channels (1:N) via campaigns.channel_id
-- channels → partners (1:N) via channels.partner_id
-- program_enrollments → programs (1:N) via program_enrollments.program_id
-- program_enrollments → campaigns (1:N) via program_enrollments.campaign_id
-- program_enrollments → users (1:N) via program_enrollments.user_id
-- programs → curricula (1:N) via programs.curriculum_id
-- transactions → partners (1:N) via transactions.partner_id
-- transactions → users (1:N) via transactions.user_id
-- transactions → campaigns (1:N) via transactions.campaign_id
-- audit_logs → users (1:N) via audit_logs.user_id
-- notifications → users (1:N) via notifications.user_id
-- two_factor_verifications → partners (1:N) via two_factor_verifications.partner_id
-- user_invites → partners (1:N) via user_invites.partner_id
-- user_invites → users (1:N) via user_invites.invited_by
-- wallets → partners (1:1) via wallets.partner_id
-- withdrawals → partners (1:N) via withdrawals.partner_id
-- withdrawals → wallets (1:N) via withdrawals.wallet_id
-- partner_type_permissions → partner_types (1:N) via partner_type_permissions.partner_type_slug
-- partner_type_roles → partner_types (1:N) via partner_type_roles.partner_type_slug

-- ============================================================================
-- SECTION 3: PRIMARY KEY CONSTRAINTS (Already in CREATE TABLE)
-- ============================================================================

-- All 20 tables use 'id uuid PRIMARY KEY DEFAULT gen_random_uuid()'

-- ============================================================================
-- SECTION 4: UNIQUE CONSTRAINTS
-- ============================================================================

-- users
--   UNIQUE (auth_id)
--   UNIQUE (email)
--   UNIQUE (username)
--   UNIQUE (convex_id)

-- partner_types
--   UNIQUE (name)
--   UNIQUE (slug)

-- permissions
--   UNIQUE (name)
--   UNIQUE (convex_id)

-- partner_type_permissions
--   UNIQUE (partner_type_slug, permission_key)

-- partner_type_roles
--   UNIQUE (partner_type_slug, role_name)

-- partners
--   UNIQUE (convex_id)

-- curricula
--   UNIQUE (convex_id)

-- programs
--   UNIQUE (convex_id)

-- subjects
--   UNIQUE (convex_id)

-- campaigns
--   UNIQUE (convex_id)

-- audit_logs
--   UNIQUE (convex_id)

-- notifications
--   UNIQUE (convex_id)

-- program_enrollments
--   UNIQUE (convex_id)

-- transactions
--   UNIQUE (convex_id)

-- two_factor_verifications
--   No unique constraints (multiple codes per partner allowed)

-- user_invites
--   UNIQUE (invitation_token)

-- wallets
--   UNIQUE (convex_id)
--   UNIQUE (partner_id) - One wallet per partner

-- withdrawals
--   UNIQUE (convex_id)

-- social_media_platforms
--   UNIQUE (name)

-- ============================================================================
-- SECTION 5: INDEX DEFINITIONS
-- ============================================================================

-- audit_logs
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE UNIQUE INDEX audit_logs_convex_id_key ON public.audit_logs USING btree (convex_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);
CREATE INDEX idx_audit_logs_convex_id ON public.audit_logs USING btree (convex_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);

-- campaigns
CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id);
CREATE UNIQUE INDEX campaigns_convex_id_key ON public.campaigns USING btree (convex_id);
CREATE INDEX idx_campaigns_partner_id ON public.campaigns USING btree (partner_id);
CREATE INDEX idx_campaigns_program_id ON public.campaigns USING btree (program_id);
CREATE INDEX idx_campaigns_channel_id ON public.campaigns USING btree (channel_id);
CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);
CREATE INDEX idx_campaigns_date_range ON public.campaigns USING btree (start_date, end_date);
CREATE INDEX idx_campaigns_convex_id ON public.campaigns USING btree (convex_id);

-- channels
CREATE UNIQUE INDEX channels_pkey ON public.channels USING btree (id);
CREATE INDEX idx_channels_partner_id ON public.channels USING btree (partner_id);

-- curricula
CREATE UNIQUE INDEX curricula_pkey ON public.curricula USING btree (id);
CREATE UNIQUE INDEX curricula_convex_id_key ON public.curricula USING btree (convex_id);
CREATE INDEX idx_curricula_convex_id ON public.curricula USING btree (convex_id);

-- notifications
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE UNIQUE INDEX notifications_convex_id_key ON public.notifications USING btree (convex_id);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);
CREATE INDEX idx_notifications_convex_id ON public.notifications USING btree (convex_id);

-- partner_type_permissions
CREATE UNIQUE INDEX partner_type_permissions_pkey ON public.partner_type_permissions USING btree (id);
CREATE UNIQUE INDEX partner_type_permissions_partner_type_slug_permission_key_key ON public.partner_type_permissions USING btree (partner_type_slug, permission_key);
CREATE INDEX idx_partner_type_permissions_slug ON public.partner_type_permissions USING btree (partner_type_slug);

-- partner_type_roles
CREATE UNIQUE INDEX partner_type_roles_pkey ON public.partner_type_roles USING btree (id);
CREATE UNIQUE INDEX partner_type_roles_partner_type_slug_role_name_key ON public.partner_type_roles USING btree (partner_type_slug, role_name);

-- partner_types
CREATE UNIQUE INDEX partner_types_pkey ON public.partner_types USING btree (id);
CREATE UNIQUE INDEX partner_types_name_key ON public.partner_types USING btree (name);
CREATE UNIQUE INDEX partner_types_slug_key ON public.partner_types USING btree (slug);

-- partners
CREATE UNIQUE INDEX partners_pkey ON public.partners USING btree (id);
CREATE UNIQUE INDEX partners_convex_id_key ON public.partners USING btree (convex_id);
CREATE INDEX idx_partners_user_id ON public.partners USING btree (user_id);
CREATE INDEX idx_partners_type ON public.partners USING btree (partner_type);
CREATE INDEX idx_partners_status ON public.partners USING btree (status);
CREATE INDEX idx_partners_wallet_setup ON public.partners USING btree (wallet_setup_completed);
CREATE INDEX idx_partners_onboarding_completed ON public.partners USING btree (onboarding_completed);
CREATE INDEX idx_partners_is_first_login ON public.partners USING btree (is_first_login);
CREATE INDEX idx_partners_convex_id ON public.partners USING btree (convex_id);

-- permissions
CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);
CREATE UNIQUE INDEX permissions_convex_id_key ON public.permissions USING btree (convex_id);
CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);
CREATE INDEX idx_permissions_convex_id ON public.permissions USING btree (convex_id);
CREATE INDEX idx_permissions_name ON public.permissions USING btree (name);

-- program_enrollments
CREATE UNIQUE INDEX program_enrollments_pkey ON public.program_enrollments USING btree (id);
CREATE UNIQUE INDEX program_enrollments_convex_id_key ON public.program_enrollments USING btree (convex_id);
CREATE INDEX idx_enrollments_program_id ON public.program_enrollments USING btree (program_id);
CREATE INDEX idx_enrollments_campaign_id ON public.program_enrollments USING btree (campaign_id);
CREATE INDEX idx_enrollments_user_id ON public.program_enrollments USING btree (user_id);
CREATE INDEX idx_enrollments_status ON public.program_enrollments USING btree (status);
CREATE INDEX idx_enrollments_convex_id ON public.program_enrollments USING btree (convex_id);

-- programs
CREATE UNIQUE INDEX programs_pkey ON public.programs USING btree (id);
CREATE UNIQUE INDEX programs_convex_id_key ON public.programs USING btree (convex_id);
CREATE INDEX idx_programs_curriculum_id ON public.programs USING btree (curriculum_id);
CREATE INDEX idx_programs_status ON public.programs USING btree (status);
CREATE INDEX idx_programs_convex_id ON public.programs USING btree (convex_id);

-- social_media_platforms
CREATE UNIQUE INDEX social_media_platforms_pkey ON public.social_media_platforms USING btree (id);
CREATE UNIQUE INDEX social_media_platforms_name_key ON public.social_media_platforms USING btree (name);

-- subjects
CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id);
CREATE UNIQUE INDEX subjects_convex_id_key ON public.subjects USING btree (convex_id);
CREATE INDEX idx_subjects_convex_id ON public.subjects USING btree (convex_id);

-- transactions
CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);
CREATE UNIQUE INDEX transactions_convex_id_key ON public.transactions USING btree (convex_id);
CREATE INDEX idx_transactions_campaign_id ON public.transactions USING btree (campaign_id);
CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);
CREATE INDEX idx_transactions_partner_id ON public.transactions USING btree (partner_id);
CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);
CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);
CREATE INDEX idx_transactions_convex_id ON public.transactions USING btree (convex_id);

-- two_factor_verifications
CREATE UNIQUE INDEX two_factor_verifications_pkey ON public.two_factor_verifications USING btree (id);
CREATE INDEX idx_2fa_partner_id ON public.two_factor_verifications USING btree (partner_id);
CREATE INDEX idx_2fa_type ON public.two_factor_verifications USING btree (verification_type);
CREATE INDEX idx_2fa_contact ON public.two_factor_verifications USING btree (contact_value);
CREATE INDEX idx_2fa_verified ON public.two_factor_verifications USING btree (is_verified);
CREATE INDEX idx_2fa_expires ON public.two_factor_verifications USING btree (expires_at);

-- user_invites
CREATE UNIQUE INDEX user_invites_pkey ON public.user_invites USING btree (id);
CREATE UNIQUE INDEX user_invites_invitation_token_key ON public.user_invites USING btree (invitation_token);
CREATE INDEX idx_user_invites_partner_id ON public.user_invites USING btree (partner_id);
CREATE INDEX idx_user_invites_email ON public.user_invites USING btree (email);
CREATE INDEX idx_user_invites_status ON public.user_invites USING btree (status);
CREATE INDEX idx_user_invites_expires_at ON public.user_invites USING btree (expires_at);
CREATE INDEX idx_user_invites_token ON public.user_invites USING btree (invitation_token);

-- users
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX users_auth_id_key ON public.users USING btree (auth_id);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE UNIQUE INDEX users_convex_id_key ON public.users USING btree (convex_id);
CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_convex_id ON public.users USING btree (convex_id);
CREATE INDEX idx_users_partner_id ON public.users USING btree (partner_id);

-- wallets
CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);
CREATE UNIQUE INDEX wallets_convex_id_key ON public.wallets USING btree (convex_id);
CREATE UNIQUE INDEX idx_wallets_partner_unique ON public.wallets USING btree (partner_id);
CREATE INDEX idx_wallets_partner_id ON public.wallets USING btree (partner_id);
CREATE INDEX idx_wallets_convex_id ON public.wallets USING btree (convex_id);

-- withdrawals
CREATE UNIQUE INDEX withdrawals_pkey ON public.withdrawals USING btree (id);
CREATE UNIQUE INDEX withdrawals_convex_id_key ON public.withdrawals USING btree (convex_id);
CREATE INDEX idx_withdrawals_partner_id ON public.withdrawals USING btree (partner_id);
CREATE INDEX idx_withdrawals_wallet_id ON public.withdrawals USING btree (wallet_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals USING btree (status);
CREATE INDEX idx_withdrawals_requested_at ON public.withdrawals USING btree (requested_at);
CREATE INDEX idx_withdrawals_convex_id ON public.withdrawals USING btree (convex_id);

-- ============================================================================
-- SECTION 6: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function 1: check_partner_onboarding_complete
CREATE OR REPLACE FUNCTION check_partner_onboarding_complete(p_partner_id uuid)
RETURNS boolean AS $$
DECLARE
    is_complete BOOLEAN;
BEGIN
    SELECT 
        wallet_setup_completed AND 
        campaign_created AND 
        two_factor_setup_completed
    INTO is_complete
    FROM partners
    WHERE id = p_partner_id;
    
    RETURN COALESCE(is_complete, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function 2: cleanup_expired_2fa_codes
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS integer AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM two_factor_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP
    AND is_verified = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function 3: create_campaign
CREATE OR REPLACE FUNCTION create_campaign(
    p_partner_id uuid,
    p_name text,
    p_description text,
    p_target_signups integer,
    p_duration_start date,
    p_duration_end date,
    p_program_id uuid DEFAULT NULL,
    p_channel_id uuid DEFAULT NULL,
    p_subchannel text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS campaigns AS $$
DECLARE
  v_campaign campaigns%ROWTYPE;
BEGIN
  -- Validate partner_id is not null
  IF p_partner_id IS NULL THEN
    RAISE EXCEPTION 'partner_id is required';
  END IF;

  -- Validate name and description
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'campaign name is required';
  END IF;

  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'campaign description is required';
  END IF;

  -- Validate target_signups
  IF p_target_signups IS NULL OR p_target_signups <= 0 THEN
    RAISE EXCEPTION 'target_signups must be a positive integer';
  END IF;

  -- Validate dates
  IF p_duration_start IS NULL OR p_duration_end IS NULL THEN
    RAISE EXCEPTION 'start and end dates are required';
  END IF;

  IF p_duration_start > p_duration_end THEN
    RAISE EXCEPTION 'start_date must be before or equal to end_date';
  END IF;

  -- Validate program_id (if provided) belongs to partner or is global
  IF p_program_id IS NOT NULL THEN
    PERFORM 1 FROM programs
      WHERE id = p_program_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'program does not exist or does not belong to partner';
    END IF;
  END IF;

  -- Validate channel_id (if provided) belongs to partner
  IF p_channel_id IS NOT NULL THEN
    PERFORM 1 FROM channels
      WHERE id = p_channel_id AND partner_id = p_partner_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'channel does not exist or does not belong to partner';
    END IF;
  END IF;

  -- Insert campaign
  INSERT INTO campaigns (
    partner_id,
    program_id,
    channel_id,
    subchannel,
    name,
    description,
    target_signups,
    duration_start,
    duration_end,
    created_at,
    updated_at
  ) VALUES (
    p_partner_id,
    p_program_id,
    p_channel_id,
    p_subchannel,
    p_name,
    p_description,
    p_target_signups,
    p_duration_start,
    p_duration_end,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) RETURNING * INTO v_campaign;

  RETURN v_campaign;
END;
$$ LANGUAGE plpgsql;

-- Function 4: create_user_profile
CREATE OR REPLACE FUNCTION create_user_profile(
    p_auth_id uuid,
    p_email text,
    p_full_name text DEFAULT NULL,
    p_phone text DEFAULT NULL
)
RETURNS record AS $$
BEGIN
  -- Verify user is authenticated and auth_id matches their token
  IF auth.uid() != p_auth_id THEN
    RAISE EXCEPTION 'Unauthorized: auth_id mismatch';
  END IF;
  
  -- Insert or update the profile
  RETURN QUERY
  INSERT INTO public.users (auth_id, email, full_name, phone, role, created_at, updated_at)
  VALUES (p_auth_id, p_email, p_full_name, p_phone, 'member', NOW(), NOW())
  ON CONFLICT (auth_id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = CASE WHEN EXCLUDED.full_name IS NOT NULL THEN EXCLUDED.full_name ELSE public.users.full_name END,
        phone = CASE WHEN EXCLUDED.phone IS NOT NULL THEN EXCLUDED.phone ELSE public.users.phone END,
        updated_at = NOW()
  RETURNING public.users.id, public.users.auth_id, public.users.email, public.users.full_name, public.users.phone, public.users.role, public.users.created_at, public.users.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function 5: get_partner_onboarding_status
CREATE OR REPLACE FUNCTION get_partner_onboarding_status(p_partner_id uuid)
RETURNS TABLE(step_name text, step_number integer, completed boolean, required boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (VALUES
        ('wallet_setup', 1, (SELECT wallet_setup_completed FROM partners WHERE id = p_partner_id), TRUE),
        ('campaign_created', 2, (SELECT campaign_created FROM partners WHERE id = p_partner_id), TRUE),
        ('users_added', 3, (SELECT users_added FROM partners WHERE id = p_partner_id), FALSE),
        ('two_factor_setup', 4, (SELECT two_factor_setup_completed FROM partners WHERE id = p_partner_id), TRUE),
        ('social_media', 5, (SELECT social_media_added FROM partners WHERE id = p_partner_id), FALSE)
    ) AS steps(step_name, step_number, completed, required);
END;
$$ LANGUAGE plpgsql;

-- Function 6: handle_auth_user_delete (Trigger Function)
CREATE OR REPLACE FUNCTION handle_auth_user_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.users WHERE auth_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function 7: handle_new_auth_user (Trigger Function)
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 8: handle_new_user (Trigger Function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (auth_id) DO UPDATE SET updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 9: sync_partner_to_user_fn (Trigger Function)
CREATE OR REPLACE FUNCTION sync_partner_to_user_fn()
RETURNS trigger AS $$
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

-- Function 10: update_partner_onboarding_step
CREATE OR REPLACE FUNCTION update_partner_onboarding_step(
    p_partner_id uuid,
    p_step_name text,
    p_completed boolean
)
RETURNS void AS $$
BEGIN
    -- Update the specific step
    CASE p_step_name
        WHEN 'wallet_setup' THEN
            UPDATE partners SET wallet_setup_completed = p_completed WHERE id = p_partner_id;
        WHEN 'campaign_created' THEN
            UPDATE partners SET campaign_created = p_completed WHERE id = p_partner_id;
        WHEN 'users_added' THEN
            UPDATE partners SET users_added = p_completed WHERE id = p_partner_id;
        WHEN 'two_factor_setup' THEN
            UPDATE partners SET two_factor_setup_completed = p_completed WHERE id = p_partner_id;
        WHEN 'social_media' THEN
            UPDATE partners SET social_media_added = p_completed WHERE id = p_partner_id;
    END CASE;
    
    -- Check if all required steps are complete
    IF check_partner_onboarding_complete(p_partner_id) THEN
        UPDATE partners 
        SET 
            onboarding_completed = TRUE,
            onboarding_completed_at = CURRENT_TIMESTAMP
        WHERE id = p_partner_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function 11: update_updated_at_column (Trigger Function)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 12: update_wallet_setup_completed (Trigger Function)
CREATE OR REPLACE FUNCTION update_wallet_setup_completed()
RETURNS trigger AS $$
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

-- ============================================================================
-- SECTION 7: TRIGGER DEFINITIONS
-- ============================================================================

-- Trigger: Sync new auth users to public.users
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();

-- Trigger: Delete public.users when auth user deleted
CREATE TRIGGER handle_user_delete_trigger
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_delete();

-- Trigger: Update user role when partner is created
CREATE TRIGGER sync_partner_insert_trigger
  AFTER INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION sync_partner_to_user_fn();

-- Trigger: Update timestamp on campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on partners
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on withdrawals
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Set wallet_setup_completed when wallet created
CREATE TRIGGER wallet_setup_completed_trigger
  AFTER INSERT ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_setup_completed();

-- ============================================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE partner_type_permissions ENABLE ROW LEVEL SECURITY;  -- TODO: Currently disabled
-- ALTER TABLE partner_type_roles ENABLE ROW LEVEL SECURITY;  -- TODO: Currently disabled
-- ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;  -- TODO: Currently disabled
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE social_media_platforms ENABLE ROW LEVEL SECURITY;  -- TODO: Currently disabled
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE two_factor_verifications ENABLE ROW LEVEL SECURITY;  -- TODO: CRITICAL - Currently disabled
-- ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;  -- TODO: Currently disabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 9: RLS POLICY DEFINITIONS
-- ============================================================================

-- audit_logs Policies
CREATE POLICY "audit_logs_service_insert" ON audit_logs FOR INSERT USING (true) WITH CHECK (true);
CREATE POLICY "audit_logs_user_select" ON audit_logs FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- campaigns Policies
CREATE POLICY "campaigns_service_insert" ON campaigns FOR INSERT USING (true) WITH CHECK (true);
CREATE POLICY "campaigns_user_select" ON campaigns FOR SELECT 
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  ));
CREATE POLICY "campaigns_user_update" ON campaigns FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM partners p WHERE p.id = campaigns.partner_id AND p.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM partners p WHERE p.id = campaigns.partner_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "campaigns_user_delete" ON campaigns FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM partners p WHERE p.id = campaigns.partner_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "campaigns_prevent_direct_insert" ON campaigns FOR INSERT WITH CHECK (false);

-- channels Policies
CREATE POLICY "channels_prevent_direct_insert" ON channels FOR INSERT WITH CHECK (false);
CREATE POLICY "channels_user_select" ON channels FOR SELECT 
  USING (partner_id IN (
    SELECT id FROM partners WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- curricula Policies
CREATE POLICY "curricula_public_select" ON curricula FOR SELECT USING (true);
CREATE POLICY "curricula_service_all" ON curricula FOR ALL USING (true) WITH CHECK (true);

-- notifications Policies
CREATE POLICY "notifications_service_insert" ON notifications FOR INSERT USING (true) WITH CHECK (true);
CREATE POLICY "notifications_user_select" ON notifications FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "notifications_user_update" ON notifications FOR UPDATE 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- partners Policies
CREATE POLICY "partners_service_insert" ON partners FOR INSERT USING (true) WITH CHECK (true);
CREATE POLICY "partners_user_select" ON partners FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "partners_user_update" ON partners FOR UPDATE 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- permissions Policies
CREATE POLICY "permissions_public_select" ON permissions FOR SELECT USING (true);

-- program_enrollments Policies
CREATE POLICY "enrollments_service_all" ON program_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "enrollments_user_select" ON program_enrollments FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- programs Policies
CREATE POLICY "programs_public_select" ON programs FOR SELECT USING (true);
CREATE POLICY "programs_service_all" ON programs FOR ALL USING (true) WITH CHECK (true);

-- subjects Policies
CREATE POLICY "subjects_public_select" ON subjects FOR SELECT USING (true);
CREATE POLICY "subjects_service_all" ON subjects FOR ALL USING (true) WITH CHECK (true);

-- transactions Policies
CREATE POLICY "transactions_service_insert" ON transactions FOR INSERT USING (true) WITH CHECK (true);
CREATE POLICY "transactions_user_select" ON transactions FOR SELECT 
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  ));

-- users Policies
CREATE POLICY "users_self_select" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (auth_id = auth.uid());

-- wallets Policies
CREATE POLICY "wallets_service_all" ON wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "wallets_user_select" ON wallets FOR SELECT 
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  ));

-- withdrawals Policies
CREATE POLICY "withdrawals_service_all" ON withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "withdrawals_user_select" ON withdrawals FOR SELECT 
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  ));

-- ============================================================================
-- SECTION 10: TODO - MISSING RLS POLICIES
-- ============================================================================

-- The following tables currently have NO RLS policies and should be addressed:
--
-- 1. partner_type_permissions - MEDIUM PRIORITY
--    Add policies to restrict visibility to service role
--
-- 2. partner_type_roles - MEDIUM PRIORITY
--    Add policies to restrict visibility to service role
--
-- 3. partner_types - MEDIUM PRIORITY
--    Consider public read-only access for clients
--
-- 4. two_factor_verifications - CRITICAL PRIORITY
--    This table contains OTP codes and verification status
--    Must restrict to service role and partner owner
--
-- 5. user_invites - HIGH PRIORITY
--    Contains invitation tokens and email addresses
--    Must restrict to service role and partner owner
--
-- 6. social_media_platforms - LOW PRIORITY
--    Can be public read-only (configuration data)

-- ============================================================================
-- SECTION 11: METADATA & NOTES
-- ============================================================================

-- Generated: January 2, 2026
-- Source: Supabase MCP Live Project Session
-- Project Reference: heqsfgmrosuupxahdtda
-- Database Version: PostgreSQL 14+
--
-- Total Objects:
--   - Tables: 20
--   - Functions: 11
--   - Triggers: 9
--   - Indexes: 127
--   - RLS Policies: 33 (15 tables enabled, 5 disabled)
--
-- This file should NOT be directly applied to production.
-- It serves as documentation and reference for:
--   1. Database schema understanding
--   2. Migration planning
--   3. Disaster recovery
--   4. Development environment setup
--
-- For actual schema changes, use Supabase CLI migrations:
--   supabase migration new <name>
--   supabase db push
--
-- ============================================================================
