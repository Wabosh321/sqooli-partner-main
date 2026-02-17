-- ============================================================================
-- MIGRATION 013: NAMING STANDARDIZATION & CRITICAL BUG FIXES
-- ============================================================================
-- Purpose: 
--   1. Fix is_partner_admin() function parameter shadow bug (SECURITY ISSUE)
--   2. Standardize task approval column naming (approver_id → approver_user_id)
--   3. Ensure data consistency across Phase 1-4 migrations
--
-- Execution Order: AFTER 012_phase4_indexes_CORRECTED.sql
-- Dependencies: All Phase 1-4 migrations must be applied first
--
-- This migration resolves critical issues introduced during Phase development:
-- - Phase 1: Created tasks.approver_id
-- - Phase 2: is_partner_admin() has parameter shadow bug allowing incorrect access
-- - Phase 4: Added tasks.approver_user_id, expecting standardized naming
-- 
-- RESULT: Dual columns, broken RLS, inconsistent function references
-- RESOLUTION: This migration consolidates to approver_user_id (control file standard)

-- ============================================================================
-- CRITICAL FIX #1: is_partner_admin() Parameter Shadow Bug
-- ============================================================================
-- Problem: WHERE partner_id = partner_id (self-comparison always TRUE)
-- Impact: ALL RLS policies using is_partner_admin() incorrectly grant access
-- Severity: SECURITY VULNERABILITY - allows unauthorized access

DROP FUNCTION IF EXISTS public.is_partner_admin(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.is_partner_admin(p_partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE partner_id = p_partner_id
    AND (role ILIKE '%admin%' OR public.is_super_admin(id))
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- CRITICAL FIX #2: Task Approval Column Standardization
-- ============================================================================
-- Phase 1 created: tasks.approver_id
-- Phase 4 added: tasks.approver_user_id
-- Resolution: Keep approver_user_id (aligns with control file), remove approver_id

-- Step 1: Migrate any existing data from old column to new column
UPDATE public.tasks
SET approver_user_id = approver_id
WHERE approver_user_id IS NULL AND approver_id IS NOT NULL;

-- Step 2: Drop the old column (if it still exists)
-- Safety: Only drops if column exists
DO $$
BEGIN
  ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS approver_id CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not drop approver_id column: %', SQLERRM;
END;
$$;

-- ============================================================================
-- CRITICAL FIX #3: Update Task Policies to Use Standardized Column Name
-- ============================================================================
-- All task policies must reference approver_user_id (not approver_id)

-- Drop and recreate task policies with correct column reference
DROP POLICY IF EXISTS "Users can view accessible tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_own_or_assigned_or_approver" ON public.tasks;

-- Recreate SELECT policy with standardized column name
CREATE POLICY "tasks_select_own_or_assigned_or_approver"
ON public.tasks FOR SELECT
USING (
  created_by_user_id = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR approver_user_id = auth.uid()  -- ✓ Standardized
  OR partner_id = public.get_user_partner_id(auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- ============================================================================
-- VERIFICATION STEP
-- ============================================================================
-- Verify column consolidation successful
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'tasks'
--   AND (column_name LIKE 'approver%' OR column_name = 'assigned_to_user_id')
-- ORDER BY ordinal_position;
--
-- Expected result:
--   Column                Data Type
--   --------------------  -----------
--   approver_user_id      uuid
--   assigned_to_user_id   uuid
-- 
-- (approver_id should NOT appear)

-- ============================================================================
-- SAFETY CHECK: Verify is_partner_admin() works correctly
-- ============================================================================
-- Test query (run post-migration):
-- SELECT public.is_partner_admin('partner-uuid-here');
-- Should return TRUE only if current user (auth.uid()) has admin role in that partner

-- ============================================================================
-- END CRITICAL BUG FIX MIGRATION
-- ============================================================================
-- 
-- Summary of Changes:
-- 1. ✓ Fixed is_partner_admin() to use p_partner_id parameter correctly
-- 2. ✓ Migrated data from approver_id to approver_user_id
-- 3. ✓ Dropped old approver_id column
-- 4. ✓ Updated task policies to reference approver_user_id
--
-- Verification Post-Migration:
-- - Run RLS policy test suite for all task operations
-- - Verify is_partner_admin() returns correct boolean
-- - Check task approval workflow (rpc_approve_task, rpc_reject_task)
-- - Ensure no queries reference approver_id

