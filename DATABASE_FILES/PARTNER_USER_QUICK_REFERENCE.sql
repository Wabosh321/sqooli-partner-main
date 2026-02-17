-- ============================================================================
-- PARTNER USER IMPLEMENTATION - QUICK DEPLOYMENT REFERENCE
-- ============================================================================

-- EXECUTION SEQUENCE (Copy-paste ready):

-- Step 1: Create helper function
CREATE OR REPLACE FUNCTION public.is_partner_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'partner_member' AND is_active = true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 2: Create partner_member profile (REPLACE PLACEHOLDERS)
INSERT INTO public.profiles (id, email, full_name, partner_id, role, partner_type, access_level, permissions, is_first_login, is_active)
VALUES (
  'PARTNER-USER-UUID',
  'user@example.com',
  'Partner User',
  'PARTNER-ID',
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
  true,
  true
) ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions, role = EXCLUDED.role, is_active = true;

-- Step 3: Ensure wallet exists
INSERT INTO public.wallets (partner_id, user_id, balance, total_earnings, pending_withdrawals, payment_method, is_active)
VALUES ('PARTNER-ID', 'PARTNER-USER-UUID', 0.00, 0.00, 0.00, 'mpesa', true)
ON CONFLICT (partner_id, user_id) DO NOTHING;

-- ============================================================================
-- PARTNER USER ACCESS MATRIX
-- ============================================================================

-- ✅ DASHBOARD (dashboard)
--    RLS: No policy needed (frontend permission check only)
--    Access: Full view of dashboard metrics

-- ✅ CAMPAIGNS (campaigns)
--    RLS Policy: "campaigns_select_own_or_partner"
--    Access: View all campaigns in own partner
--    Condition: partner_id = get_user_partner_id(auth.uid())

-- ✅ PROGRAMS (programs)
--    RLS Policy: "programs_select_own_or_partner"
--    Access: View all programs in own partner
--    Condition: partner_id = get_user_partner_id(auth.uid())

-- ✅ TASKS (tasks)
--    RLS Policy: "tasks_select_own_or_assigned_or_approver"
--    Access: View tasks in own partner
--    Condition: partner_id = get_user_partner_id(auth.uid())

-- ✅ WALLET (wallet)
--    RLS Policy: "Users can view own wallet"
--    Access: View own wallet and partner wallets
--    Condition: user_id = auth.uid() OR partner_id = get_user_partner_id(auth.uid())

-- ✅ USERS (users)
--    RLS Policy: "Admins can view partner members"
--    Access: View users in own partner
--    Condition: partner_id = get_user_partner_id(auth.uid())

-- ✅ SETTINGS (settings)
--    RLS: Partner settings via profiles table (UPDATE restricted to own)
--    Access: View settings, limited update capability

-- ✅ TEAM MEMBERS (implicit in programs/campaigns)
--    RLS Policy: "team_members_select_own_or_admin"
--    Access: View team members in own partner
--    Condition: partner_id = get_user_partner_id(auth.uid())

-- ============================================================================
-- KEY INTEGRATION POINTS
-- ============================================================================

-- DATABASE ENFORCEMENT:
--   Table: profiles, partners, campaigns, programs, tasks, wallets, team_members, user_activity_log
--   Column: partner_id (UUID REFERENCES partners(id))
--   Function: get_user_partner_id(user_id) returns partner_id from profiles
--   Check: All SELECT policies include "partner_id = get_user_partner_id(auth.uid())"

-- FRONTEND ENFORCEMENT:
--   File: src/context/PermissionProvider.tsx
--   Check: hasPermission(category) returns true if permissions array contains {category, level}
--   File: src/components/ui/sidebar/sidebar.config.ts
--   Check: SIDEBAR_MENU items have requiredCategory matching permission category
--   File: src/hooks/usePartnerAccess.ts
--   Check: canAccessSection(section) returns true if category in permissions

-- PERMISSION ARRAY (JSONB):
--   Structure: [
--     {category: 'dashboard', level: 'view'},
--     {category: 'campaigns', level: 'view'},
--     ...
--   ]
--   Validation: category must match SIDEBAR_MENU id, level must be 'view' or 'full'

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check partner_member profile exists:
SELECT id, email, role, partner_id, permissions FROM profiles WHERE role = 'partner_member' LIMIT 1;

-- Check partner_member can access campaigns:
SELECT COUNT(*) FROM campaigns WHERE partner_id = (SELECT partner_id FROM profiles WHERE id = 'PARTNER-USER-UUID');

-- Check partner_member wallet exists:
SELECT id, balance FROM wallets WHERE user_id = 'PARTNER-USER-UUID';

-- Check permissions array valid:
SELECT jsonb_array_length(permissions) as perm_count FROM profiles WHERE id = 'PARTNER-USER-UUID';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Issue: RLS policies preventing access
-- Solution: Verify partner_id is set correctly in profiles
--   SELECT id, partner_id FROM profiles WHERE id = 'PARTNER-USER-UUID';

-- Issue: Dashboard not showing sections
-- Solution: Verify permissions array is valid JSONB
--   SELECT permissions FROM profiles WHERE id = 'PARTNER-USER-UUID';
--   Validate: Each object has {category, level} keys

-- Issue: Wallet section locked
-- Solution: Ensure wallet record exists for partner_member
--   SELECT * FROM wallets WHERE user_id = 'PARTNER-USER-UUID';
--   If missing: Run Step 3 again

-- Issue: RLS SELECT returning 0 rows
-- Solution: Run as partner_member JWT (not admin) and verify:
--   SELECT get_user_partner_id(auth.uid());  -- Should return partner_id
--   SELECT COUNT(*) FROM campaigns WHERE partner_id = get_user_partner_id(auth.uid());

-- ============================================================================
-- NO SCHEMA MODIFICATIONS REQUIRED
-- ============================================================================
-- All existing tables and columns already exist:
--   ✅ profiles.role
--   ✅ profiles.permissions (JSONB)
--   ✅ profiles.partner_id
--   ✅ campaigns.partner_id
--   ✅ programs.partner_id
--   ✅ tasks.partner_id
--   ✅ wallets.user_id, partner_id
--   ✅ team_members.partner_id, user_id
--   ✅ user_activity_log.partner_id
--   ✅ get_user_partner_id() function
--
-- All RLS policies already enforce partner_id-based access
-- Partner_member users automatically included in all policies
-- Frontend permission checks automatically recognize permissions array

-- ============================================================================
