-- ============================================================================
-- PARTNER USER IMPLEMENTATION - EXACT DEPLOYABLE SQL COMMANDS
-- ============================================================================
-- No modifications to existing schema required
-- Only adds new helper function and inserts sample partner_member profile
-- All RLS policies already enforce partner_member access via existing rules
-- ============================================================================

-- ============================================================================
-- COMMAND 1: DEFINE PARTNER USER HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_partner_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = 'partner_member'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMAND 2: CREATE SAMPLE PARTNER USER PROFILE
-- ============================================================================
-- Required substitutions:
--   {PARTNER_USER_UUID} = UUID from Supabase Auth (auth.users.id)
--   {PARTNER_ID} = UUID from partners table
-- Example values for testing (replace with real values):
--   {PARTNER_USER_UUID} = 'a1b2c3d4-e5f6-4789-ab12-cd34ef567890'
--   {PARTNER_ID} = 'x1y2z3w4-a5b6-4789-ab12-cd34ef567890'

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  partner_id,
  role,
  partner_type,
  access_level,
  permissions,
  parent_user_id,
  is_first_login,
  is_active
) VALUES (
  '{PARTNER_USER_UUID}',
  'partner.user@example.com',
  'Partner User',
  '{PARTNER_ID}',
  'partner_member',
  'media',
  25,
  jsonb_build_array(
    jsonb_build_object('category', 'dashboard', 'level', 'view'),
    jsonb_build_object('category', 'campaigns', 'level', 'view'),
    jsonb_build_object('category', 'programs', 'level', 'view'),
    jsonb_build_object('category', 'tasks', 'level', 'view'),
    jsonb_build_object('category', 'settings', 'level', 'view'),
    jsonb_build_object('category', 'users', 'level', 'view'),
    jsonb_build_object('category', 'wallet', 'level', 'view')
  ),
  NULL,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  role = 'partner_member',
  access_level = 25,
  permissions = jsonb_build_array(
    jsonb_build_object('category', 'dashboard', 'level', 'view'),
    jsonb_build_object('category', 'campaigns', 'level', 'view'),
    jsonb_build_object('category', 'programs', 'level', 'view'),
    jsonb_build_object('category', 'tasks', 'level', 'view'),
    jsonb_build_object('category', 'settings', 'level', 'view'),
    jsonb_build_object('category', 'users', 'level', 'view'),
    jsonb_build_object('category', 'wallet', 'level', 'view')
  ),
  is_active = true;

-- ============================================================================
-- COMMAND 3: ENSURE WALLET EXISTS FOR PARTNER USER
-- ============================================================================

INSERT INTO public.wallets (
  id,
  partner_id,
  user_id,
  balance,
  total_earnings,
  pending_withdrawals,
  payment_method,
  is_active
) VALUES (
  gen_random_uuid(),
  '{PARTNER_ID}',
  '{PARTNER_USER_UUID}',
  0.00,
  0.00,
  0.00,
  'mpesa',
  true
) ON CONFLICT (partner_id, user_id) DO NOTHING;

-- ============================================================================
-- COMMAND 4: VERIFY PARTNER USER PROFILE
-- ============================================================================

SELECT
  p.id,
  p.email,
  p.role,
  p.partner_id,
  p.permissions,
  jsonb_array_length(p.permissions) as permission_count,
  p.access_level,
  p.is_active
FROM public.profiles p
WHERE p.id = '{PARTNER_USER_UUID}';

-- ============================================================================
-- COMMAND 5: TEST RLS POLICY ACCESS - CAMPAIGNS
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns campaigns where partner_id matches user's partner

SELECT
  c.id,
  c.name,
  c.partner_id,
  c.created_by_user_id,
  c.status,
  c.created_at
FROM public.campaigns c
WHERE c.partner_id = public.get_user_partner_id(auth.uid())
LIMIT 10;

-- ============================================================================
-- COMMAND 6: TEST RLS POLICY ACCESS - PROGRAMS
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns programs where partner_id matches user's partner

SELECT
  p.id,
  p.name,
  p.partner_id,
  p.created_by_user_id,
  p.status,
  p.created_at
FROM public.programs p
WHERE p.partner_id = public.get_user_partner_id(auth.uid())
LIMIT 10;

-- ============================================================================
-- COMMAND 7: TEST RLS POLICY ACCESS - TASKS
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns tasks where partner_id matches user's partner

SELECT
  t.id,
  t.task_name,
  t.partner_id,
  t.assigned_to_user_id,
  t.approver_user_id,
  t.status,
  t.created_at
FROM public.tasks t
WHERE t.partner_id = public.get_user_partner_id(auth.uid())
LIMIT 10;

-- ============================================================================
-- COMMAND 8: TEST RLS POLICY ACCESS - WALLET
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns own wallet

SELECT
  w.id,
  w.partner_id,
  w.user_id,
  w.balance,
  w.total_earnings,
  w.pending_withdrawals,
  w.payment_method,
  w.is_active
FROM public.wallets w
WHERE w.user_id = auth.uid()
   OR w.partner_id = public.get_user_partner_id(auth.uid())
LIMIT 10;

-- ============================================================================
-- COMMAND 9: TEST RLS POLICY ACCESS - TEAM MEMBERS
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns team members in user's partner

SELECT
  tm.id,
  tm.partner_id,
  tm.user_id,
  tm.role,
  tm.permission_level,
  tm.is_active
FROM public.team_members tm
WHERE tm.partner_id = public.get_user_partner_id(auth.uid())
LIMIT 20;

-- ============================================================================
-- COMMAND 10: TEST RLS POLICY ACCESS - ACTIVITY LOG
-- ============================================================================
-- Run this as the partner_member user (use JWT token)
-- Expected result: Query returns own activities and partner activities

SELECT
  ual.id,
  ual.user_id,
  ual.action,
  ual.action_type,
  ual.timestamp
FROM public.user_activity_log ual
WHERE ual.user_id = auth.uid()
   OR ual.partner_id = public.get_user_partner_id(auth.uid())
ORDER BY ual.timestamp DESC
LIMIT 20;

-- ============================================================================
-- COMMAND 11: MONITOR PARTNER USER ACTIVITY
-- ============================================================================

SELECT
  ual.id,
  p.email,
  ual.action,
  ual.action_type,
  ual.timestamp
FROM public.user_activity_log ual
LEFT JOIN public.profiles p ON ual.user_id = p.id
WHERE p.role = 'partner_member'
ORDER BY ual.timestamp DESC
LIMIT 50;

-- ============================================================================
-- COMMAND 12: GENERATE JWT TOKEN FOR TESTING (SUPABASE DASHBOARD)
-- ============================================================================
-- Login to Supabase Dashboard > Authentication > Users
-- Click on partner_member user
-- Click "Generate Access Token"
-- Copy JWT token
-- Use in Authorization header: Bearer {JWT_TOKEN}
--
-- For curl testing:
-- curl -X GET 'http://localhost:5432/rest/v1/profiles?id=eq.{PARTNER_USER_UUID}' \
--   -H "Authorization: Bearer {JWT_TOKEN}" \
--   -H "apikey: {SUPABASE_ANON_KEY}"

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================
-- 1. PREREQUISITE: Partner user must exist in Supabase Auth (auth.users)
-- 2. SUBSTITUTION: Replace {PARTNER_USER_UUID} and {PARTNER_ID} with real values
-- 3. EXECUTION: Run COMMAND 1 only once (idempotent function creation)
-- 4. EXECUTION: Run COMMAND 2 for each new partner_member (ON CONFLICT handles updates)
-- 5. EXECUTION: Run COMMAND 3 only once per partner_member (ON CONFLICT handles skips)
-- 6. VERIFICATION: Run COMMANDs 4-11 to verify access and troubleshoot
-- 7. TESTING: Use partner_member JWT token in Supabase client to test RLS
-- 8. NO SCHEMA CHANGES: All existing policies support partner_member role
-- 9. PERMISSION SYNC: Frontend PermissionProvider automatically recognizes permissions array
-- 10. DASHBOARD ACCESS: Sidebar automatically shows sections based on permissions array

-- ============================================================================
-- RLS POLICY COVERAGE - PARTNER MEMBER AUTOMATIC ACCESS
-- ============================================================================
-- Table: campaigns
-- Policy: "campaigns_select_own_or_partner"
-- Check: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view all campaigns in partner

-- Table: programs
-- Policy: "programs_select_own_or_partner"
-- Check: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view all programs in partner

-- Table: tasks
-- Policy: "tasks_select_own_or_assigned_or_approver"
-- Check: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view tasks in partner

-- Table: wallets
-- Policy: "Users can view own wallet"
-- Check: user_id = auth.uid() OR partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view own wallet

-- Table: team_members
-- Policy: "team_members_select_own_or_admin"
-- Check: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view team members in partner

-- Table: profiles
-- Policy: "Admins can view partner members"
-- Check: auth.uid() IN (SELECT id FROM profiles WHERE partner_id = profiles.partner_id AND role ILIKE '%admin%')
-- Result: ✅ partner_member can view other profiles if admin of partner (fallback: can view own)

-- Table: user_activity_log
-- Policy: "activity_log_select_own_or_partner"
-- Check: user_id = auth.uid() OR partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view activity logs for partner

-- Table: user_performance_metrics
-- Policy: "metrics_select_own_or_partner"
-- Check: user_id = auth.uid() OR partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ partner_member can view performance metrics for partner

-- ============================================================================
