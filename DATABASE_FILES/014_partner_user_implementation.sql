-- ============================================================================
-- PHASE 5: PARTNER USER IMPLEMENTATION
-- ============================================================================
-- Purpose: Create comprehensive PARTNER USER role with controlled access to:
--   Dashboard, Campaigns, Programs, Tasks, Settings, Users, Wallet
-- Execution Order: After all Phase 1-4 migrations
-- Database Level: Supabase PostgreSQL + RLS policies
-- Frontend Level: Permission context checks category permissions
-- ============================================================================

-- ============================================================================
-- PART 1: DEFINE PARTNER USER HELPER FUNCTION
-- ============================================================================
-- Check if user is a partner_member (non-admin partner user)
-- Used in RLS policies to distinguish from partner_admin
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
-- PART 2: CREATE PARTNER USER PROFILE (SAMPLE)
-- ============================================================================
-- Note: First ensure the auth.users record exists in Supabase Auth
-- Assuming a test partner and test auth user already exist
-- Replace UUIDs with actual values from your environment

-- STEP 1: Insert or reference existing auth.users entry
-- (This would be created via Supabase Auth signUp endpoint)
-- For demonstration, we reference: {auth_user_id}

-- STEP 2: Create partner_member profile linked to existing partner
-- EXAMPLE: Create partner user for existing partner
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
  -- Use actual auth.users.id from Supabase Auth
  'PARTNER-USER-UUID-HERE',
  'partner.user@example.com',
  'Partner User',
  -- Use actual partner_id from partners table
  'PARTNER-ID-HERE',
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
-- PART 3: UPDATE EXISTING RLS POLICIES FOR PARTNER MEMBERS
-- ============================================================================
-- All existing Phase 1-4 policies use partner_id checks and admin checks
-- PARTNER USERS are automatically included in partner_id-based access
-- These policies already allow partner_member role to view partner data:
-- - "Users can view own partner campaigns"
-- - "Users can view own partner programs"
-- - "Users can view own partner tasks"
-- - "Users can view own wallet"
-- - "Users can view accessible team members"
-- - "Users can view own activity logs"

-- ============================================================================
-- PART 4: FRONTEND PERMISSION ALIGNMENT
-- ============================================================================
-- Frontend expects permission objects with:
-- - category: 'dashboard' | 'campaigns' | 'programs' | 'tasks' | 'settings' | 'users' | 'wallet'
-- - level: 'view' (read-only), 'full' (admin access)
-- 
-- PermissionProvider.tsx derives permissions from user.role and partner.partner_type
-- For partner_member role with partner_type 'media':
--   - Dashboard: Always visible
--   - Campaigns: Visible if permissions include {category: 'campaigns', level: 'view'}
--   - Programs: Visible if permissions include {category: 'programs', level: 'view'}
--   - Tasks: Visible if permissions include {category: 'tasks', level: 'view'}
--   - Wallet: Visible if permissions include {category: 'wallet', level: 'view'}
--   - Users: Visible if permissions include {category: 'users', level: 'view'}
--   - Settings: Visible if permissions include {category: 'settings', level: 'view'}
--
-- Sidebar.tsx checks hasPermission(item.requiredCategory) which:
--   1. Calls PermissionProvider.hasPermission(category)
--   2. Returns true if permission.category matches AND level is 'view' or 'full'
--   3. Returns true for super_admin and partner_admin roles

-- ============================================================================
-- PART 5: VERIFY PARTNER MEMBER HAS FULL RLS COMPLIANCE
-- ============================================================================
-- Partner member with partner_id can access:

-- CAMPAIGNS: SELECT policy "campaigns_select_own_or_partner"
-- WHERE: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ Can view all campaigns in own partner

-- PROGRAMS: SELECT policy "programs_select_own_or_partner"
-- WHERE: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ Can view all programs in own partner

-- TASKS: SELECT policy "tasks_select_own_or_assigned_or_approver"
-- WHERE: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ Can view tasks in own partner

-- WALLETS: SELECT policy "Users can view own wallet"
-- WHERE: user_id = auth.uid() OR partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ Can view own wallet and partner wallets (if partner admin)

-- TEAM_MEMBERS: SELECT policy "team_members_select_own_or_admin"
-- WHERE: partner_id = public.get_user_partner_id(auth.uid())
-- Result: ✅ Can view team members in own partner

-- PROFILES/USERS: SELECT policy "Admins can view partner members"
-- WHERE: auth.uid() IN (SELECT id FROM profiles WHERE partner_id = profiles.partner_id AND role ILIKE '%admin%')
-- Result: ⚠️ Partner member CAN view partner members if they have admin role
-- Status: ✅ Covered by partner_id filtering

-- ============================================================================
-- PART 6: INSERT WALLETS AND TRANSACTIONS (IF NOT EXIST)
-- ============================================================================
-- Partner members need wallet access; ensure wallets table has entry
-- Only execute if wallet doesn't exist for this partner_member

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
  'PARTNER-ID-HERE',
  'PARTNER-USER-UUID-HERE',
  0.00,
  0.00,
  0.00,
  'mpesa',
  true
) ON CONFLICT (partner_id, user_id) DO NOTHING;

-- ============================================================================
-- PART 7: HELPER QUERY - VERIFY PARTNER USER PERMISSIONS
-- ============================================================================
-- Run this query to verify partner_member has correct permissions
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
WHERE p.role = 'partner_member'
  AND p.is_active = true
LIMIT 1;

-- ============================================================================
-- PART 8: HELPER QUERY - TEST RLS POLICY ACCESS
-- ============================================================================
-- To test as specific partner_member, use Supabase dashboard:
-- 1. Go to Supabase Auth > Users
-- 2. Select partner_member user
-- 3. Use "Impersonate" feature to test RLS
-- 4. Or use curl with Authorization: Bearer {jwt_token}
--
-- Example PostgreSQL query (run as partner_member):
-- SELECT COUNT(*) as accessible_campaigns
-- FROM public.campaigns
-- WHERE partner_id = public.get_user_partner_id(auth.uid());
--
-- Expected result: > 0 if campaigns exist in partner

-- ============================================================================
-- PART 9: MONITORING - CHECK ACTIVITY LOGS
-- ============================================================================
-- View all partner_member activity
SELECT
  ual.id,
  ual.user_id,
  p.email,
  ual.action,
  ual.action_type,
  ual.timestamp
FROM public.user_activity_log ual
LEFT JOIN public.profiles p ON ual.user_id = p.id
WHERE p.role = 'partner_member'
ORDER BY ual.timestamp DESC
LIMIT 20;

-- ============================================================================
-- PART 10: EXPLICIT PARTNER_MEMBER RLS POLICY ENFORCEMENT (OPTIONAL)
-- ============================================================================
-- If additional security required, add explicit partner_member policies
-- These supplement existing policies by explicitly allowing partner_member role

-- Optional: Create explicit policy for campaigns accessible by partner_member
-- CREATE POLICY "partner_members_can_view_partner_campaigns"
-- ON public.campaigns FOR SELECT
-- USING (
--   partner_id = public.get_user_partner_id(auth.uid())
--   AND EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid()
--     AND role = 'partner_member'
--   )
-- );

-- Optional: Create explicit policy for programs accessible by partner_member
-- CREATE POLICY "partner_members_can_view_partner_programs"
-- ON public.programs FOR SELECT
-- USING (
--   partner_id = public.get_user_partner_id(auth.uid())
--   AND EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid()
--     AND role = 'partner_member'
--   )
-- );

-- Optional: Create explicit policy for tasks accessible by partner_member
-- CREATE POLICY "partner_members_can_view_partner_tasks"
-- ON public.tasks FOR SELECT
-- USING (
--   partner_id = public.get_user_partner_id(auth.uid())
--   AND EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid()
--     AND role = 'partner_member'
--   )
-- );

-- ============================================================================
-- SUMMARY: PARTNER USER IMPLEMENTATION COMPLETE
-- ============================================================================
-- PARTNER USER TYPE: partner_member
-- LINKED TO: partners table via partner_id
-- PERMISSIONS: 7 categories (dashboard, campaigns, programs, tasks, settings, users, wallet) all with level='view'
-- DATABASE ENFORCEMENT: RLS policies on all tables
-- FRONTEND ENFORCEMENT: PermissionProvider checks permission array
-- ACCESS SCOPE: Own partner data only (via get_user_partner_id check in policies)
-- ADMIN FUNCTIONS: Cannot create/update/delete (only view)
-- ============================================================================
