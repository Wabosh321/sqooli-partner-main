## PHASE 4 DEPLOYMENT CHECKLIST

**Status: BACKEND READY FOR DEPLOYMENT** ✅
**Frontend Progress: 20% Complete** 🔄

---

## PRE-DEPLOYMENT VERIFICATION

### Database Schema ✅

- [x] 009_phase4_tables.sql - 6 tables with indexes
- [x] 010_phase4_functions.sql - 12 RPC + 4 helpers
- [x] 011_phase4_policies.sql - 22 RLS policies
- [x] 012_phase4_indexes.sql - 26+ performance indexes

**Action:** Copy SQL files to Supabase console and execute in order (009 → 010 → 011 → 012)

---

## BACKEND DEPLOYMENT (Ready Now)

### Step 1: Deploy Migrations to Supabase

```bash
# Option A: Supabase Console
# 1. Go to SQL Editor
# 2. Copy content of 009_phase4_tables.sql
# 3. Run Query
# 4. Repeat for 010, 011, 012

# Option B: Supabase CLI
supabase db push

# Verify:
- [ ] SELECT * FROM campaigns LIMIT 1; (should return no results initially)
- [ ] SELECT * FROM information_schema.tables WHERE table_name LIKE 'campaigns';
- [ ] SELECT count(*) FROM pg_indexes WHERE tablename = 'campaigns';
```

### Step 2: Run Seed Scripts

```bash
# Seed team members
npx tsx scripts/seed_team_members_from_json.ts
# Expected: "📊 Team Members Migration Summary"

# Seed user activity
npx tsx scripts/seed_user_activity_from_json.ts
# Expected: "📊 User Activity Migration Summary"

# Seed user metrics
npx tsx scripts/seed_user_metrics_from_json.ts
# Expected: "📊 User Metrics Migration Summary"

# Verify:
- [ ] SELECT count(*) FROM team_members;
- [ ] SELECT count(*) FROM user_activity_log;
- [ ] SELECT count(*) FROM user_performance_metrics;
```

### Step 3: Verify RPC Functions

```bash
# Test campaign creation RPC
SELECT rpc_create_campaign(
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- partner_id
  '550e8400-e29b-41d4-a716-446655440001'::uuid, -- created_by_user_id
  'Test Campaign',                                 -- campaign_name
  'Test Description',                              -- description
  '2025-02-01'::date,                             -- duration_start
  '2025-03-01'::date,                             -- duration_end
  null,                                            -- program_id
  '["email", "sms"]'::jsonb,                      -- channels
  1000,                                            -- budget
  '{}'::jsonb                                      -- metadata
);
# Expected: {success: true, campaign_id: <uuid>, error: null}

- [ ] Test rpc_create_campaign
- [ ] Test rpc_approve_task
- [ ] Test rpc_reject_task
- [ ] Test log_activity function
```

### Step 4: Verify RLS Policies

```bash
# Test policy enforcement
-- As partner_admin for partner A
SELECT * FROM campaigns WHERE partner_id != <partner_a_id>;
# Expected: 0 rows (RLS blocks access)

-- As partner_member
SELECT * FROM tasks WHERE assigned_to_user_id != current_user_id;
# Expected: 0 rows or filtered results (RLS enforced)

- [ ] Campaigns table RLS enforced
- [ ] Programs table RLS enforced
- [ ] Tasks table RLS enforced
- [ ] Activity log RLS enforced (append-only)
- [ ] Metrics RLS enforced (super_admin only for writes)
```

---

## FRONTEND DEPLOYMENT (20% Complete)

### Completed ✅

- [x] CampaignSection.tsx - Supabase integration + subscriptions
- [x] campaign.service.ts - RPC methods ready
- [x] program.service.ts - RPC methods ready
- [x] task.service.ts - RPC methods ready

### In Progress 🔄

- [ ] ProgramSection.tsx - Supabase integration (ready to start)
- [ ] TasksSection.tsx - Approval workflow (ready to start)
- [ ] UserSection.tsx - Audit logs (ready to start)
- [ ] RecentActivity.tsx - Activity subscriptions (ready to start)

### Frontend Deployment Steps

```bash
# Step 1: Verify service imports
import { CampaignService } from "../infrastructure/campaign/campaign.service";
import { ProgramService } from "../infrastructure/program/program.service";
import { TaskService } from "../infrastructure/task/task.service";

# Step 2: Update components
- [ ] Update ProgramSection.tsx (copy pattern from CampaignSection.tsx)
- [ ] Update TasksSection.tsx (add approveTask/rejectTask handlers)
- [ ] Update UserSection.tsx (add audit log display)
- [ ] Update RecentActivity.tsx (add activity subscriptions)

# Step 3: Test in browser
npm run dev
# Expected: All components load data from Supabase
# Expected: Real-time updates when data changes

# Step 4: Test real-time subscriptions
- [ ] Open campaign in window A
- [ ] Create campaign in window B
- [ ] Window A updates in real-time (no page refresh)
```

---

## TESTING CHECKLIST

### Unit Tests (Backend RPC Functions)

```bash
# Verify each RPC function independently
- [ ] rpc_create_campaign returns correct schema
- [ ] rpc_update_campaign updates and logs
- [ ] rpc_delete_campaign cascades delete
- [ ] rpc_approve_task updates status
- [ ] rpc_reject_task records reason
- [ ] log_activity prevents update/delete
- [ ] is_campaign_owner checks ownership
```

### Integration Tests (Frontend Components)

```bash
# Test CampaignSection.tsx
- [ ] Page loads campaigns from Supabase
- [ ] Create campaign via wizard
- [ ] Campaign appears in list
- [ ] Real-time update when creating in another window
- [ ] Delete campaign via RPC
- [ ] Campaign removed from list

# Test TasksSection.tsx
- [ ] Approve task button calls RPC
- [ ] Task status changes to 'approved'
- [ ] Reject task button calls RPC
- [ ] Task status changes to 'declined'
- [ ] Activity logged with before/after states
```

### Performance Tests

```bash
# Test subscription limits
- [ ] Subscribe to 100 campaigns (no crash)
- [ ] Unsubscribe cleans up (memory release)

# Test RPC performance
- [ ] Create campaign completes in <2s
- [ ] Update campaign completes in <1s
- [ ] Approve task completes in <1s
- [ ] Batch seed script completes in <10s per 100 records
```

### Security Tests

```bash
# Test RLS enforcement
- [ ] Partner A cannot see Partner B's campaigns
- [ ] Partner member cannot create campaigns
- [ ] Activity log cannot be updated/deleted
- [ ] Metrics only writeable by super_admin

# Test RPC validation
- [ ] Invalid FK reference returns error
- [ ] Missing required fields return error
- [ ] Invalid status value returns error
- [ ] Unauthorized user returns error
```

---

## ROLLBACK PLAN

If issues arise:

```sql
-- Drop Phase 4 tables (cascades delete all data)
DROP TABLE IF EXISTS user_performance_metrics CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;

-- Drop Phase 4 functions
DROP FUNCTION IF EXISTS rpc_create_campaign CASCADE;
DROP FUNCTION IF EXISTS rpc_update_campaign CASCADE;
DROP FUNCTION IF EXISTS rpc_delete_campaign CASCADE;
DROP FUNCTION IF EXISTS rpc_create_program CASCADE;
DROP FUNCTION IF EXISTS rpc_update_program CASCADE;
DROP FUNCTION IF EXISTS rpc_delete_program CASCADE;
DROP FUNCTION IF EXISTS rpc_create_task CASCADE;
DROP FUNCTION IF EXISTS rpc_approve_task CASCADE;
DROP FUNCTION IF EXISTS rpc_reject_task CASCADE;
DROP FUNCTION IF EXISTS rpc_create_team_member CASCADE;
DROP FUNCTION IF EXISTS rpc_update_team_member CASCADE;
DROP FUNCTION IF EXISTS is_campaign_owner CASCADE;
DROP FUNCTION IF EXISTS is_program_owner CASCADE;
DROP FUNCTION IF EXISTS is_task_approver CASCADE;
DROP FUNCTION IF EXISTS log_activity CASCADE;

-- Verify rollback
SELECT count(*) FROM information_schema.tables
WHERE table_name IN ('campaigns', 'programs', 'tasks', 'team_members', 'user_activity_log', 'user_performance_metrics');
# Expected: 0 rows
```

---

## DEPLOYMENT TIMELINE

**Phase 4A - Backend (Now)** ✅

- [ ] Deploy SQL migrations (10 min)
- [ ] Run seed scripts (5 min)
- [ ] Verify RPC functions (10 min)
- [ ] Total: ~25 minutes

**Phase 4B - Frontend (Next)** 🔄

- [ ] Update remaining 4 components (60 min)
- [ ] Integration testing (30 min)
- [ ] Performance testing (20 min)
- [ ] Total: ~110 minutes

**Phase 4C - Production** 🟡

- [ ] Final testing in staging (30 min)
- [ ] Deploy to production (10 min)
- [ ] Monitor for errors (15 min)
- [ ] Total: ~55 minutes

**Estimated Total Time: 2-3 hours**

---

## ROLLBACK CRITERIA

Rollback if:

- ❌ RPC functions not accessible in Supabase
- ❌ RLS policies blocking legitimate queries
- ❌ Seed scripts failing > 10% records
- ❌ Real-time subscriptions not working
- ❌ Component errors blocking dashboard
- ❌ Data loss or corruption detected

---

## POST-DEPLOYMENT MONITORING

**First 24 Hours:**

- [ ] Monitor Supabase logs for errors
- [ ] Check subscription counts (should be low initially)
- [ ] Monitor RPC execution times (should be <1s)
- [ ] Verify seed data integrity
- [ ] Test real-time updates with live data

**First Week:**

- [ ] Monitor performance under load
- [ ] Check for subscription memory leaks
- [ ] Verify all RLS policies working correctly
- [ ] User feedback on new features

---

## CONTACTS & ESCALATION

**Database Issues:**

- Check Supabase status dashboard
- Review SQL query performance
- Check RLS policy logs

**Frontend Issues:**

- Check browser console for errors
- Review React component lifecycle
- Check subscription cleanup on unmount

**Performance Issues:**

- Review query execution plans
- Add indexes if needed
- Consider query optimization

---

**Last Updated:** 2025-01-20
**Prepared By:** Phase 4 Implementation Team
**Ready for Deployment:** YES ✅
