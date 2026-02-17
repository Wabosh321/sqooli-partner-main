-- ============================================================================
-- SQOOLI PARTNER DATABASE - FUNCTIONS & TRIGGERS
-- Generated: February 15, 2026
-- Business logic functions and auto-update trigger functions
-- ============================================================================

-- ============================================================================
-- SECTION 1: UTILITY & HELPER FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: update_updated_at_column
-- Purpose: Auto-update the updated_at timestamp on record modifications
-- Usage: Attached to triggers on all tables with updated_at columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: is_authenticated
-- Purpose: Check if the current user is authenticated
-- Returns: TRUE if auth.uid() is not null
-- ============================================================================
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: get_user_partner_id
-- Purpose: Get the partner ID associated with a user
-- Parameters: user_id (UUID)
-- Returns: UUID of the associated partner or NULL
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_partner_id(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT partner_id FROM users
    WHERE id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: is_super_admin
-- Purpose: Check if a user has super admin role
-- Parameters: user_id (UUID)
-- Returns: TRUE if user is super admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users
    WHERE id = p_user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: is_partner_admin
-- Purpose: Check if a user is an admin of a specific partner
-- Parameters: partner_id (UUID)
-- Returns: TRUE if authenticated user manages this partner
-- ============================================================================
CREATE OR REPLACE FUNCTION is_partner_admin(p_partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM partners p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_partner_id AND u.auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SECTION 2: BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: create_user_profile
-- Purpose: Create user profile after email verification in auth
-- Parameters:
--   p_auth_id: UUID from auth.users
--   p_email: User email address (redundant but included for data integrity)
--   p_full_name: User's full name
--   p_phone: User's phone number (optional)
-- Returns: Created user record (id, auth_id, email, full_name, phone, role)
-- Security: Requires authenticated user with matching auth_id
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user_profile(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify user is authenticated and auth_id matches their token
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Email verification required before profile creation.';
  END IF;

  IF auth.uid() != p_auth_id THEN
    RAISE EXCEPTION 'Unauthorized: auth_id mismatch. Cannot create profile for another user.';
  END IF;

  -- Insert the profile with role defaulting to 'member'
  INSERT INTO users (auth_id, email, full_name, phone, role, created_at, updated_at)
  VALUES (p_auth_id, p_email, p_full_name, COALESCE(p_phone, ''), 'member', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING users.id INTO v_user_id;

  -- Return the created user record
  RETURN QUERY
  SELECT users.id, users.auth_id, users.email, users.full_name, COALESCE(users.phone, ''), users.role
  FROM users
  WHERE users.id = v_user_id;

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email or username already exists. User may already be registered.';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Function: check_partner_onboarding_complete
-- Purpose: Verify if all required onboarding steps are completed
-- Parameters: partner_id (UUID)
-- Returns: TRUE if wallet_setup, campaign_created, and 2fa are all complete
-- ============================================================================
CREATE OR REPLACE FUNCTION check_partner_onboarding_complete(p_partner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_complete BOOLEAN;
BEGIN
  SELECT (
    wallet_setup_completed AND
    campaign_created AND
    two_factor_setup_completed
  ) INTO is_complete
  FROM partners
  WHERE id = p_partner_id;

  RETURN COALESCE(is_complete, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: create_campaign
-- Purpose: Create a marketing campaign for a partner with validation
-- Parameters:
--   p_partner_id: Partner creating the campaign (required)
--   p_name: Campaign name (required)
--   p_description: Campaign description (required)
--   p_target_signups: Target number of signups (required, > 0)
--   p_duration_start: Campaign start date (required)
--   p_duration_end: Campaign end date (required, >= start)
--   p_program_id: Linked educational program (optional)
--   p_channel_id: Marketing channel (optional, must belong to partner)
--   p_subchannel: Subchannel identifier (optional)
--   p_user_id: Creating user ID (optional, for audit)
-- Returns: campaigns record
-- Raises: Exception on validation failure
-- ============================================================================
CREATE OR REPLACE FUNCTION create_campaign(
  p_partner_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_target_signups INTEGER,
  p_duration_start DATE,
  p_duration_end DATE,
  p_program_id UUID DEFAULT NULL,
  p_channel_id UUID DEFAULT NULL,
  p_subchannel TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS campaigns AS $$
DECLARE
  v_campaign campaigns%ROWTYPE;
BEGIN
  -- Validate required fields
  IF p_partner_id IS NULL THEN
    RAISE EXCEPTION 'partner_id is required';
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'campaign name is required';
  END IF;

  IF p_description IS NULL OR p_description = '' THEN
    RAISE EXCEPTION 'campaign description is required';
  END IF;

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

  -- Validate references if provided
  IF p_program_id IS NOT NULL THEN
    PERFORM 1 FROM programs WHERE id = p_program_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'program with id % does not exist', p_program_id;
    END IF;
  END IF;

  -- Validate channel belongs to partner
  IF p_channel_id IS NOT NULL THEN
    PERFORM 1 FROM channels
    WHERE id = p_channel_id AND partner_id = p_partner_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'channel does not exist or does not belong to partner';
    END IF;
  END IF;

  -- Validate partner exists
  PERFORM 1 FROM partners WHERE id = p_partner_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'partner with id % does not exist', p_partner_id;
  END IF;

  -- Insert campaign
  INSERT INTO campaigns (
    partner_id, program_id, channel_id, subchannel,
    name, description, target_signups,
    duration_start, duration_end,
    created_at, updated_at
  ) VALUES (
    p_partner_id, p_program_id, p_channel_id, p_subchannel,
    p_name, p_description, p_target_signups,
    p_duration_start, p_duration_end,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) RETURNING * INTO v_campaign;

  -- Mark campaign_created flag on partner
  UPDATE partners
  SET campaign_created = TRUE, campaign_created_at = CURRENT_TIMESTAMP
  WHERE id = p_partner_id AND campaign_created = FALSE;

  RETURN v_campaign;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Campaign creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Function: get_partner_onboarding_status
-- Purpose: Get detailed onboarding progress for a partner
-- Parameters: partner_id (UUID)
-- Returns: Table with step_name, step_number, completed, required
-- ============================================================================
CREATE OR REPLACE FUNCTION get_partner_onboarding_status(p_partner_id UUID)
RETURNS TABLE(step_name TEXT, step_number INTEGER, completed BOOLEAN, required BOOLEAN) AS $$
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
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: update_partner_onboarding_step
-- Purpose: Update a specific onboarding step and check completion
-- Parameters:
--   p_partner_id: Partner ID
--   p_step_name: Step identifier (wallet_setup, campaign_created, users_added, two_factor_setup, social_media)
--   p_completed: Whether the step is complete
-- Side effects: Updates onboarding_completed flag if all required steps done
-- ============================================================================
CREATE OR REPLACE FUNCTION update_partner_onboarding_step(
  p_partner_id UUID,
  p_step_name TEXT,
  p_completed BOOLEAN
)
RETURNS VOID AS $$
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
    ELSE
      RAISE EXCEPTION 'Unknown onboarding step: %', p_step_name;
  END CASE;

  -- Check if all required steps are now complete
  IF check_partner_onboarding_complete(p_partner_id) THEN
    UPDATE partners
    SET
      onboarding_completed = TRUE,
      onboarding_completed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_partner_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Function: cleanup_expired_2fa_codes
-- Purpose: Delete expired and unverified two-factor codes (scheduled maintenance)
-- Returns: Count of deleted codes
-- Note: Schedule via pg_cron: SELECT cron.schedule('cleanup_2fa', '0 * * * *', 'SELECT cleanup_expired_2fa_codes()');
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM two_factor_verifications
  WHERE expires_at < CURRENT_TIMESTAMP AND is_verified = FALSE;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Function: rpc_log_audit_event
-- Purpose: Log audit events for compliance and debugging
-- Parameters:
--   p_action: Action description (e.g., 'campaign_created')
--   p_action_type: Type classification (e.g., 'create', 'update', 'delete')
--   p_resource_type: Resource type (e.g., 'campaign', 'partner')
--   p_resource_id: ID of affected resource
--   p_changes: JSONB of changed fields {old: {...}, new: {...}}
-- Returns: audit_logs.id or NULL on failure
-- Note: Failures logged as WARNING but not raised (permissive)
-- ============================================================================
CREATE OR REPLACE FUNCTION rpc_log_audit_event(
  p_action TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, new_values, created_at
  ) VALUES (
    (SELECT id FROM users WHERE auth_id = auth.uid()),
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to log audit event: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- SECTION 3: TRIGGER FUNCTIONS
-- ============================================================================

-- ============================================================================
-- Function: handle_new_auth_user
-- Purpose: Create user record when new auth.users row is created
-- Usage: Trigger on auth.users INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: handle_auth_user_delete
-- Purpose: Delete user record when auth.users row is deleted
-- Usage: Trigger on auth.users DELETE
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM users WHERE auth_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: sync_partner_to_user_fn
-- Purpose: Update user role and partner_id when partner is created
-- Usage: Trigger on partners INSERT
-- Side effects: Sets user.partner_id and user.role = 'partner'
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_partner_to_user_fn()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    partner_id = NEW.id,
    role = 'partner',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: update_wallet_setup_completed
-- Purpose: Mark wallet_setup_completed when wallet is created
-- Usage: Trigger on wallets INSERT
-- Side effects: Updates partners.wallet_setup_completed and timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_wallet_setup_completed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partners
  SET
    wallet_setup_completed = TRUE,
    wallet_setup_completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.partner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: TRIGGER DEFINITIONS
-- ============================================================================
-- Note: Triggers are attached to functions to maintain updated_at timestamps
-- and perform automated synchronization tasks

-- Automatically update updated_at on INSERT/UPDATE
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

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON program_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curricula_updated_at BEFORE UPDATE ON curricula
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth user synchronization triggers
CREATE TRIGGER handle_new_user_trigger AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE TRIGGER handle_user_delete_trigger BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_delete();

-- Partner lifecycle triggers
CREATE TRIGGER sync_partner_insert_trigger AFTER INSERT ON partners
  FOR EACH ROW EXECUTE FUNCTION sync_partner_to_user_fn();

-- Wallet creation triggers
CREATE TRIGGER wallet_setup_completed_trigger AFTER INSERT ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_setup_completed();

-- ============================================================================
-- FUNCTION SUMMARY
-- ============================================================================
-- Total Functions: 13
--   Helper Functions: 5
--   Business Logic: 5
--   Trigger Functions: 4
--
-- Total Triggers: 17
--   Auto-update Timestamp: 13
--   Auth Sync: 2
--   Wallet Setup: 1
--   Partner Lifecycle: 1
--
-- ============================================================================
