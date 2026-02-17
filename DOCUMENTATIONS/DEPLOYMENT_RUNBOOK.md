# SCHEMA SYNCHRONIZATION & DEPLOYMENT RUNBOOK

**Created:** January 27, 2026  
**Status:** Critical Fixes Required Before Deployment  
**Owner:** Engineering Leadership  
**Estimated Fix Time:** 1 hour  
**Estimated Test Time:** 2-3 hours  
**Total Estimated Time to Production:** 8 hours

---

## EXECUTIVE SUMMARY

The Supabase schema migration has **3 critical issues** that prevent production deployment:

1. 🔴 **SECURITY VULNERABILITY:** `is_partner_admin()` function incorrectly grants access (parameter shadow bug)
2. 🔴 **DATA INCONSISTENCY:** Dual columns for task approval (`approver_id` vs `approver_user_id`)
3. 🟠 **MAINTENANCE DEBT:** Policies reference inconsistent column names

**Current State:** ❌ NOT PRODUCTION READY  
**After Fixes:** ✅ PRODUCTION READY

---

## STEP-BY-STEP DEPLOYMENT PLAN

### PHASE 1: IMMEDIATE FIXES (30 minutes)

#### Fix 1.1: Apply Security Patch to is_partner_admin()

**File:** [002_functions.sql](supabase/migrations/002_functions.sql)

**What to do:**
1. In your Supabase dashboard, go to **SQL Editor**
2. Run this SQL immediately:

```sql
-- CRITICAL SECURITY FIX
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
```

**Why:** Current function has parameter shadow bug (`WHERE partner_id = partner_id`) that makes RLS access control ineffective.

**Risk:** If NOT applied, unauthorized users can access campaigns, wallets, and other resources.

**Verification:**
```sql
-- Should return TRUE only if current user is admin of the partner
SELECT public.is_partner_admin('your-test-partner-uuid') AS is_admin;
```

---

#### Fix 1.2: Create New Migration 013 for Column Standardization

**File:** Create [013_naming_standardization.sql](supabase/migrations/013_naming_standardization.sql)

**What to do:**
1. Copy the content from COMPREHENSIVE_SCHEMA_AUDIT_REPORT.md → "CORRECTED SQL IMPLEMENTATIONS" → "FIX #2"
2. Save as new file: `supabase/migrations/013_naming_standardization.sql`
3. Apply via Supabase migrations or manual SQL execution:

```bash
# Option A: Via Supabase Dashboard SQL Editor
# Copy entire contents of 013_naming_standardization.sql and run

# Option B: Via supabase CLI (if installed)
supabase db execute supabase/migrations/013_naming_standardization.sql
```

**Why:** Consolidates `approver_id` → `approver_user_id` naming, aligning with control file and Phase 4 functions.

**Risk:** If NOT applied, Phase 4 functions will reference inconsistent column names causing silent data issues.

**Verification:**
```sql
-- Check columns exist with correct names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks'
  AND column_name IN ('approver_user_id', 'assigned_to_user_id', 'approver_id')
ORDER BY ordinal_position;

-- Expected: approver_user_id and assigned_to_user_id present; approver_id absent
```

---

### PHASE 2: VALIDATION TESTING (2 hours)

#### Test 2.1: RLS Policy Security Test

**Objective:** Verify that RLS policies correctly enforce access control after fixes.

**Test Cases:**

**Test 2.1.1: Partner Admin Access to Own Partner's Campaigns**
```sql
-- Switch to test user with admin role
SET ROLE authenticated;
SET claim.sub = 'admin-user-uuid';  -- User with role 'partner_admin'

-- Should succeed: Admin viewing own partner's campaign
SELECT count(*) FROM public.campaigns 
WHERE partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid());
-- Expected: > 0 records

-- Should fail: Admin viewing another partner's campaign
-- (This should be blocked by RLS policy)
```

**Test 2.1.2: Non-Admin User Cannot Access Partner Data**
```sql
-- Switch to test user without admin role
SET ROLE authenticated;
SET claim.sub = 'non-admin-user-uuid';  -- User with role 'team_member'

-- Should fail: Non-admin cannot view campaigns
SELECT count(*) FROM public.campaigns 
WHERE partner_id != (SELECT partner_id FROM public.profiles WHERE id = auth.uid());
-- Expected: 0 records (blocked by RLS)
```

**Test 2.1.3: is_partner_admin() Function Works Correctly**
```sql
-- After fix, should return TRUE only for actual admins
SELECT public.is_partner_admin('partner-uuid-with-admin-user') AS is_admin;
-- Expected: true (if current user is admin of this partner)

SELECT public.is_partner_admin('partner-uuid-without-admin-user') AS is_admin;
-- Expected: false (if current user is NOT admin of this partner)
```

**Test 2.1.4: Task Approval Workflow**
```sql
-- Approver should be able to approve task
-- Create test task
INSERT INTO public.tasks (campaign_id, created_by_user_id, approver_user_id, task_name, status)
VALUES ('campaign-uuid', auth.uid(), 'approver-user-uuid', 'Test Task', 'pending');

-- Approver calls function
SELECT public.rpc_approve_task(
  'task-uuid',
  'approver-user-uuid',
  'Looks good'
);
-- Expected: {success: true, status: 'approved'}
```

---

#### Test 2.2: Function Signature Test

**Objective:** Verify all Phase 4 functions execute without column reference errors.

```sql
-- Test rpc_create_campaign (should succeed)
SELECT public.rpc_create_campaign(
  'partner-uuid',
  'user-uuid',
  'Test Campaign',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  'Test campaign for validation'
);
-- Expected: {success: true, campaign_id: '...', message: '...'}

-- Test rpc_create_team_member (should succeed)
SELECT public.rpc_create_team_member(
  'partner-uuid',
  'user-uuid',
  'admin',
  'campaign-uuid',
  NULL,
  'member'
);
-- Expected: {success: true, team_member_id: '...', message: '...'}

-- Test rpc_approve_task (should succeed)
SELECT public.rpc_approve_task(
  'task-uuid',
  'approver-uuid',
  'Approved'
);
-- Expected: {success: true, task_id: '...', status: 'approved'}
```

---

#### Test 2.3: Column Existence Verification

**Objective:** Confirm all required columns exist with correct naming after fixes.

```sql
-- Phase 4 added columns check
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'user_activity_log', 'user_performance_metrics')
  AND column_name IN (
    'partner_id', 'approver_user_id', 'assigned_to_user_id',  -- tasks
    'entity_type', 'before_state', 'after_state', 'change_summary', 'ip_address', 'user_agent',  -- user_activity_log
    'campaign_id', 'metric_date', 'engagement_score'  -- user_performance_metrics
  )
ORDER BY table_name, ordinal_position;

-- Expected: All 22 columns present, correct data types, correct nullability
```

---

### PHASE 3: FULL INTEGRATION TEST (1 hour)

#### Test 3.1: End-to-End Campaign Workflow

```sql
-- 1. Partner admin creates campaign
INSERT INTO public.campaigns 
(partner_id, created_by_user_id, campaign_name, name, duration_start, duration_end, status)
VALUES (
  'partner-uuid',
  'admin-user-uuid',
  'Integration Test Campaign',
  'Integration Test Campaign',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  'draft'
)
RETURNING id AS campaign_id;
-- Expected: UUID returned

-- 2. Campaign creator creates task
INSERT INTO public.tasks 
(campaign_id, created_by_user_id, approver_user_id, task_name, partner_id, status)
VALUES (
  'campaign-uuid-from-step-1',
  'creator-user-uuid',
  'approver-user-uuid',
  'Task 1: Social Media Post',
  'partner-uuid',
  'pending'
)
RETURNING id AS task_id;
-- Expected: UUID returned

-- 3. Approver approves task
SELECT public.rpc_approve_task(
  'task-uuid-from-step-2',
  'approver-user-uuid',
  'Approved - looks great'
);
-- Expected: {success: true, status: 'approved'}

-- 4. Verify task status updated
SELECT status FROM public.tasks WHERE id = 'task-uuid-from-step-2';
-- Expected: 'approved'

-- 5. Verify activity was logged
SELECT COUNT(*) FROM public.user_activity_log 
WHERE entity_id = 'task-uuid-from-step-2' AND action = 'approved';
-- Expected: 1
```

---

#### Test 3.2: Team Member Management Workflow

```sql
-- 1. Partner admin creates team member
SELECT public.rpc_create_team_member(
  'partner-uuid',
  'new-team-member-uuid',
  'member',
  'campaign-uuid',
  NULL,
  'member'
);
-- Expected: {success: true, team_member_id: '...'}

-- 2. Verify team member can view campaign
SET ROLE authenticated;
SET claim.sub = 'new-team-member-uuid';

SELECT COUNT(*) FROM public.campaigns 
WHERE partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid());
-- Expected: > 0 (if RLS allows team member to view partner campaigns)

-- 3. Verify activity logged
SELECT COUNT(*) FROM public.user_activity_log 
WHERE user_id = 'new-team-member-uuid';
-- Expected: > 0
```

---

### PHASE 4: PERFORMANCE & LOAD TEST (1 hour)

#### Test 4.1: Index Performance

```sql
-- Verify indexes are being used for queries
EXPLAIN ANALYZE
SELECT * FROM public.campaigns 
WHERE partner_id = 'partner-uuid' AND status = 'active';
-- Expected: "Index Scan" on idx_campaigns_partner_status

EXPLAIN ANALYZE
SELECT * FROM public.tasks 
WHERE approver_user_id = 'approver-uuid' AND status = 'pending';
-- Expected: "Index Scan" on idx_tasks_approver_status
```

---

#### Test 4.2: Concurrent User Access Test

```bash
# Using Apache Bench or similar load testing tool
# Simulate 10 concurrent users

ab -n 100 -c 10 \
  -H "Authorization: Bearer your-test-token" \
  https://your-supabase-project.supabase.co/rest/v1/campaigns?partner_id=eq.partner-uuid

# Expected: All requests succeed, latency < 500ms
```

---

### PHASE 5: STAGING DEPLOYMENT (1 hour)

#### Step 5.1: Deploy to Staging Environment

```bash
# 1. Create staging database backup (if exists)
supabase db export backup_staging_$(date +%Y%m%d).sql

# 2. Apply migration 013_naming_standardization.sql
supabase db execute supabase/migrations/013_naming_standardization.sql

# 3. Verify migration success
supabase status
# Should show all migrations with ✓ status
```

---

#### Step 5.2: Run Automated Test Suite

```bash
# Run TypeScript validation
npm run type-check

# Run integration tests
npm run test:staging

# Expected: All tests pass
```

---

### PHASE 6: PRODUCTION DEPLOYMENT (30 minutes)

#### Step 6.1: Pre-Deployment Checklist

- [ ] All Phase 1-5 tests passed
- [ ] Staging environment verified
- [ ] Rollback plan documented (see below)
- [ ] On-call engineer notified
- [ ] Incident response team on standby
- [ ] Monitoring alerts configured
- [ ] Backup created

---

#### Step 6.2: Apply Fixes to Production

```bash
# 1. Create production backup
supabase db export backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply critical fix (is_partner_admin)
supabase db execute - << 'SQL'
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
SQL

# 3. Apply standardization migration
supabase db execute supabase/migrations/013_naming_standardization.sql

# 4. Verify production status
supabase status
```

---

#### Step 6.3: Post-Deployment Verification (10 minutes)

```bash
# 1. Check for errors in logs
supabase logs tail --filter "error" | head -20

# 2. Run smoke tests
npm run test:production-smoke

# 3. Verify key metrics
- API response time < 500ms
- Error rate < 1%
- RLS violations = 0
- is_partner_admin() returns correct values
```

---

## ROLLBACK PLAN

**If production deployment fails:**

### Immediate Rollback (< 5 minutes)

```bash
# 1. Restore database from backup
supabase db restore backup_prod_TIMESTAMP.sql

# 2. Revert application to previous version
git revert HEAD

# 3. Deploy previous version
npm run deploy
```

### Disable Features (< 2 minutes)

```bash
# If only specific features fail, disable them:
# In src/lib/flags.ts:
export const FEATURES = {
  campaignCRUD: false,      // Disable campaign creation
  teamManagement: false,    // Disable team member management
  taskApprovals: false,     // Disable task approval workflow
};
```

---

## SUCCESS CRITERIA

**Deployment is successful if:**

- ✅ All RLS policies return correct authorization results
- ✅ is_partner_admin() returns TRUE only for actual admins
- ✅ Phase 4 functions execute without column errors
- ✅ Task approval column is standardized (approver_user_id only)
- ✅ All team member CRUD operations succeed
- ✅ Campaign creation/update/delete workflows complete
- ✅ No "column does not exist" errors in logs
- ✅ Performance metrics within SLA (< 500ms response time)
- ✅ Zero RLS policy failures in error logs
- ✅ Activity logs recording correctly for all operations

---

## POST-DEPLOYMENT MONITORING

### First 24 Hours

Monitor these metrics in your APM/logging dashboard:

```
1. Error Rate: Should be < 1%
2. RLS Policy Failures: Should be 0
3. Function Execution Failures: Should be 0
4. Average Response Time: Should be < 500ms
5. is_partner_admin() Calls: Should succeed with correct boolean
6. Task Approval Workflow: Should succeed with status changes
```

### On-Call Escalation Criteria

Page on-call engineer if:
- Error rate exceeds 5% for more than 5 minutes
- More than 3 "column does not exist" errors
- RLS policy failures > 10 per hour
- Response time exceeds 2 seconds
- is_partner_admin() returns incorrect values

---

## COMMUNICATION PLAN

### Pre-Deployment (24 hours before)
- [ ] Notify all team leads
- [ ] Brief customer success on expected changes
- [ ] Send Slack notification: "Schema deployment scheduled for [TIME]"

### During Deployment (Real-time updates)
- [ ] Update Slack #incidents channel every 15 minutes
- [ ] Report: Current phase, estimated time to completion

### Post-Deployment (Immediately after)
- [ ] Send completion message with status
- [ ] List any issues encountered and mitigation steps taken

---

## DOCUMENT REFERENCES

- **Control File:** [JSON_TO_SUPABASE_PHASES.md](JSON_TO_SUPABASE_PHASES.md)
- **Schema Audit:** [COMPREHENSIVE_SCHEMA_AUDIT_REPORT.md](COMPREHENSIVE_SCHEMA_AUDIT_REPORT.md)
- **Bug Fix:** [IMMEDIATE_BUG_FIX_002_FUNCTIONS.md](IMMEDIATE_BUG_FIX_002_FUNCTIONS.md)
- **Standardization Migration:** [013_naming_standardization.sql](supabase/migrations/013_naming_standardization.sql)

---

## SIGN-OFF

**Deployment Owner:** _________________  
**Date:** _________________  

**Engineering Lead:** _________________  
**Date:** _________________  

**DevOps/Infrastructure:** _________________  
**Date:** _________________  

