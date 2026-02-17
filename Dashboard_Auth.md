# Dashboard Authentication & Data Flow Analysis

**Generated:** February 15, 2026  
**Workspace:** `d:\PROJECTS\sqoolipartner-main`  
**Analysis Scope:** Dashboard-related frontend sections and UI components with backend authentication/authorization flows

---

## Executive Summary

This document maps all dashboard-related data queries, authentication checks, and authorization flows across the Sqooli Partner application. The analysis identifies:

- **11 Frontend Components** (CampaignSection, DashboardSection, PaymentSection, WalletSection, LineChart, RecentActivity, SmallCardsGrid, TabbedMetricsChart, UpcomingCampaigns, WalletBalanceCard, WalletBalanceDisplay)
- **3 Application Layer Hooks** (useCampaigns, useWalletData, useWalletFiltering)
- **2 Service Classes** (CampaignService, WalletService)
- **Direct Supabase Queries** in components (LineChart, RecentActivity, SmallCardsGrid, TabbedMetricsChart, UpcomingCampaigns, PaymentSection)
- **6 Primary Tables** (campaigns, transactions, wallets, withdrawals, audit_logs, users)
- **3 RLS Policies** protecting data access by partner ownership

---

## Data Flow Architecture

### Authentication Layer

- **useAuth()** Hook: Retrieves current user and partner via `initializeAuthContext()`
- **usePermissions()** Hook: Provides role-based permission checks (dashboard.read, campaigns.write, etc.)
- **usePartnerAccess()** Hook: Determines section access based on partner_type and access_level

### Authorization Layer

- **RLS Policies**: partner-based data filtering via `partner_id` relationship
- **Permission Context**: RBAC via PermissionContext provider
- **Role Validation**: super_admin, partner_admin, partner, member roles

### Data Fetching Patterns

1. **Centralized Services**: CampaignService, WalletService (recommended pattern)
2. **Direct Queries in Components**: LineChart, SmallCardsGrid (scattered pattern)
3. **RPC Functions**: get_partner_campaigns, get_partner_wallet (used in DashboardSection)

---

## Detailed Mapping Table

| Frontend File Name           | Called From Workspace | Function(s) Used                                        | Is Function In Script/Supabase Written | Target Table(s)                      | Target Column(s)                                         | RLS Policies Involved                                                    | Modular File Status             | Suggestions                                                  |
| ---------------------------- | --------------------- | ------------------------------------------------------- | -------------------------------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------ |
| **CampaignSection.tsx**      | src/sections/         | useCampaigns(partnerId, canViewCampaigns)               | Script Hook (useCampaigns.ts)          | campaigns                            | id, partner_id, name, status, duration_start, promo_code | campaigns_user_select                                                    | ✓ Modularized via useCampaigns  | Consolidate delete operation into CampaignService method     |
| **CampaignSection.tsx**      | src/sections/         | supabase.from('campaigns').update()                     | Direct Supabase Client                 | campaigns                            | status                                                   | campaigns_user_update                                                    | ✓ Modularized                   | Move to CampaignService.updateCampaignStatus()               |
| **DashboardSection.tsx**     | src/sections/         | supabase.rpc('get_partner_campaigns')                   | Supabase RPC                           | campaigns                            | all columns                                              | campaigns_user_select, partner-based filtering                           | Not found in current DB files   | Create RPC function in Phase 4 migrations                    |
| **DashboardSection.tsx**     | src/sections/         | supabase.rpc('get_partner_wallet')                      | Supabase RPC                           | wallets                              | all columns                                              | wallets_user_select, partner-based filtering                             | Not found in current DB files   | Create RPC function in Phase 4 migrations                    |
| **PaymentSection.tsx**       | src/sections/         | supabase.from('campaigns').select()                     | Direct Supabase Client                 | campaigns                            | all columns                                              | campaigns_user_select                                                    | ✗ Not modularized               | Migrate to useCampaigns hook or CampaignService              |
| **WalletSection.tsx**        | src/sections/         | useWalletData(partnerId)                                | Script Hook (useWalletData.ts)         | campaigns, transactions, withdrawals | all columns                                              | campaigns_user_select, transactions_user_select, withdrawals_user_select | ✓ Modularized via useWalletData | Already well-structured using WalletService                  |
| **WalletSection.tsx**        | src/sections/         | useWalletFiltering(walletData, searchQuery)             | Script Hook (useWalletFiltering.ts)    | None (client-side filtering)         | N/A                                                      | N/A                                                                      | ✓ Modularized                   | Pure client-side filtering; no backend dependency            |
| **LineChart.tsx**            | src/ui/dashboard/     | supabase.from('transactions').select()                  | Direct Supabase Client                 | transactions                         | id, amount, transaction_type, created_at, partner_id     | transactions_user_select                                                 | ✗ Not modularized               | Create useTransactionChart hook; parameterize date range     |
| **RecentActivity.tsx**       | src/ui/dashboard/     | supabase.from('audit_logs').select()                    | Direct Supabase Client                 | audit_logs, users                    | id, user_id, action, created_at                          | audit_logs_user_select                                                   | ✗ Not modularized               | Create useAuditLogs hook with batch user lookup              |
| **RecentActivity.tsx**       | src/ui/dashboard/     | supabase.from('users').select()                         | Direct Supabase Client                 | users                                | id, full_name, email                                     | users_self_select                                                        | ✗ Not modularized               | Combine audit_logs query to avoid N+1 (use RPC or LEFT JOIN) |
| **SmallCardsGrid.tsx**       | src/ui/dashboard/     | supabase.from('campaigns').select(...count: 'exact')    | Direct Supabase Client                 | campaigns                            | id (count)                                               | campaigns_user_select                                                    | ✗ Not modularized               | Create useDashboardStats hook (aggregate query)              |
| **SmallCardsGrid.tsx**       | src/ui/dashboard/     | supabase.from('transactions').select(...count: 'exact') | Direct Supabase Client                 | transactions                         | id (count)                                               | transactions_user_select                                                 | ✗ Not modularized               | Merge into single RPC: get_dashboard_summary                 |
| **SmallCardsGrid.tsx**       | src/ui/dashboard/     | supabase.from('wallets').select('.single()')            | Direct Supabase Client                 | wallets                              | balance, total_earned                                    | wallets_user_select                                                      | ✗ Not modularized               | Use existing get_partner_wallet RPC or WalletService         |
| **TabbedMetricsChart.tsx**   | src/ui/dashboard/     | supabase.from('transactions').select()                  | Direct Supabase Client                 | transactions                         | id, amount, transaction_type, created_at, partner_id     | transactions_user_select                                                 | ✗ Not modularized               | Consolidate with LineChart into single metric hook           |
| **UpcomingCampaigns.tsx**    | src/ui/dashboard/     | supabase.from('campaigns').select()                     | Direct Supabase Client                 | campaigns                            | id, name, start_date                                     | campaigns_user_select                                                    | ✗ Not modularized               | Create useUpcomingCampaigns hook with date filtering         |
| **WalletBalanceCard.tsx**    | src/ui/dashboard/     | (Props: wallet)                                         | Display Component                      | wallets (via parent)                 | balance, paybill_number, account_number                  | wallets_user_select                                                      | N/A - Pure Display              | No direct queries; depends on parent data prop               |
| **WalletBalanceDisplay.tsx** | src/ui/dashboard/     | (Props: wallet)                                         | Display Component                      | wallets (via parent)                 | balance                                                  | wallets_user_select                                                      | N/A - Pure Display              | No direct queries; state management only                     |

---

## Authentication & Authorization Summary

### Permission Checks

```typescript
// Frontend Permission Validation Points
useAuth(); // Verifies auth.uid() and loads partner/user
usePermissions(); // Provides hasPermission(resource), userRole, permissions[]
usePartnerAccess(); // Determines canAccessDashboard, canAccessCampaigns, etc.
```

### Backend RLS Policies Applied

| Table            | Policy                   | Condition                                           | Protects                           |
| ---------------- | ------------------------ | --------------------------------------------------- | ---------------------------------- |
| **campaigns**    | campaigns_user_select    | partner_id IN (partners WHERE user_id = auth.uid()) | Read access by partner ownership   |
| **campaigns**    | campaigns_user_update    | partner_id IN (partners WHERE user_id = auth.uid()) | Update access by partner ownership |
| **transactions** | transactions_user_select | partner_id IN (partners WHERE user_id = auth.uid()) | Read access by partner ownership   |
| **wallets**      | wallets_user_select      | partner_id IN (partners WHERE user_id = auth.uid()) | Read access by partner ownership   |
| **withdrawals**  | withdrawals_user_select  | partner_id IN (partners WHERE user_id = auth.uid()) | Read access by partner ownership   |
| **audit_logs**   | audit_logs_user_select   | partner_id IN (partners WHERE user_id = auth.uid()) | Read access by partner ownership   |
| **users**        | users_self_select        | auth.uid() = auth_id                                | Read own profile only              |

---

## Identified Issues & Recommendations

### 1. **Scattered Direct Queries** ⚠️ HIGH PRIORITY

**Status:** 6 components have inline Supabase queries (LineChart, SmallCardsGrid, TabbedMetricsChart, UpcomingCampaigns, RecentActivity, PaymentSection)

**Risk:** Code duplication, inconsistent error handling, testing difficulty

**Recommendation:**

```typescript
// Create centralized hooks in src/application/dashboard/
export const useDashboardStats()      // SmallCardsGrid aggregates
export const useMetricsChart()         // LineChart + TabbedMetricsChart
export const useAuditTrail()           // RecentActivity
export const useUpcomingCampaigns()    // UpcomingCampaigns
```

### 2. **Missing RPC Functions** ⚠️ MEDIUM PRIORITY

**Status:** DashboardSection.tsx calls `get_partner_campaigns` and `get_partner_wallet` RPCs that are not found in DATABASE_FILES

**Current Implementation:** Direct table queries via WalletService

**Recommendation:**

```sql
-- Create in DATABASE_FILES/010_phase4_functions.sql or new migration
CREATE OR REPLACE FUNCTION get_partner_campaigns(p_partner_id UUID)
RETURNS TABLE(...) AS $$
-- Implement to avoid RLS filtering at application layer
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_partner_wallet(p_partner_id UUID)
RETURNS TABLE(...) AS $$
-- Implement to return wallet + related stats in one call
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. **Repeated Partner ID Resolution** ⚠️ MEDIUM PRIORITY

**Status:** Pattern `(partner as any)?.id ?? (partner as any)?._id` repeated in 7 components

**Recommendation:**

```typescript
// Create helper in useAuth() or new usePartnerId() hook
export function usePartnerId(): string | undefined {
  const { partner } = useAuth();
  return (partner as any)?.id ?? (partner as any)?._id;
}
// Usage: const partnerId = usePartnerId();
```

### 4. **N+1 Query Problem** ⚠️ MEDIUM PRIORITY

**Component:** RecentActivity.tsx

- Query 1: Fetch audit_logs (10 records)
- Queries 2-11: Individual user lookups for each log

**Current Code:**

```typescript
const logs = await supabase.from('audit_logs').select(...).limit(10);
const userIds = logs.map(l => l.user_id);
// Then separate query: supabase.from('users').select(...).in('id', userIds);
```

**Recommendation:** Create RPC function with JOIN to avoid client-side batch query

```sql
CREATE OR REPLACE FUNCTION get_recent_activity(p_partner_id UUID, p_limit INT = 10)
RETURNS TABLE(id UUID, user TEXT, action TEXT, created_at TIMESTAMP) AS $$
SELECT al.id, u.full_name, al.action, al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.partner_id = p_partner_id
ORDER BY al.created_at DESC
LIMIT p_limit;
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 5. **Inconsistent Data Model** ⚠️ LOW PRIORITY

**Status:** Some components reference `partner.convex_id` (legacy) alongside `partner.id`

**Files:** SmallCardsGrid.tsx, WalletBalanceCard.tsx, LineChart.tsx use `partner?.id ?? partner?._id`

**Recommendation:** Standardize to single identifier in auth context after deprecating Convex migration

---

## Service Layer Status

### ✓ Well-Modularized

- **CampaignService** (src/infrastructure/campaign/campaign.service.ts)
  - Method: `fetchByPartner(partnerId)` → campaigns table
  - Used by: CampaignSection, DashboardSection (indirectly)
- **WalletService** (src/infrastructure/wallet/wallet.service.ts)
  - Methods: `fetchCampaigns()`, `fetchTransactions()`, `fetchWithdrawals()`
  - Used by: WalletSection
  - Status: Follows clean architecture pattern

### ✗ Scattered / Not Modularized

- **Dashboard Stats** (SmallCardsGrid)
- **Metrics Charts** (LineChart, TabbedMetricsChart)
- **Audit Trail** (RecentActivity)
- **Campaign List** (UpcomingCampaigns)
- **Payments** (PaymentSection)

---

## Recommended Modular RPC Consolidation

### Option A: Single Dashboard Summary RPC (Recommended)

```sql
-- Consolidate all SmallCardsGrid queries into one RPC
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_partner_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_campaigns', (SELECT COUNT(*) FROM campaigns WHERE partner_id = p_partner_id),
    'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE partner_id = p_partner_id AND status = 'active'),
    'total_transactions', (SELECT COUNT(*) FROM transactions WHERE partner_id = p_partner_id),
    'wallet_balance', (SELECT balance FROM wallets WHERE partner_id = p_partner_id LIMIT 1),
    'total_earned', (SELECT total_earned FROM wallets WHERE partner_id = p_partner_id LIMIT 1)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option B: Separate RPCs for Concerns

```sql
-- Metrics RPC (for LineChart + TabbedMetricsChart)
CREATE OR REPLACE FUNCTION get_partner_metrics_30d(
  p_partner_id UUID,
  p_metric_type TEXT ('earnings' | 'withdrawals' | 'engagements')
)
RETURNS TABLE(date TEXT, value NUMERIC) AS $$
-- Implementation
$$ LANGUAGE SQL SECURITY DEFINER;

-- Recent Activity RPC (for RecentActivity)
CREATE OR REPLACE FUNCTION get_recent_activity(p_partner_id UUID, p_limit INT = 10)
RETURNS TABLE(id UUID, user TEXT, action TEXT, time TEXT) AS $$
-- Implementation with JOIN to avoid N+1
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upcoming Campaigns RPC (for UpcomingCampaigns)
CREATE OR REPLACE FUNCTION get_upcoming_campaigns(p_partner_id UUID, p_limit INT = 5)
RETURNS TABLE(id UUID, name TEXT, start_date DATE) AS $$
-- Implementation
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Implementation Roadmap

### Phase 1: Hook Consolidation (Week 1)

- [ ] Create `src/application/dashboard/useDashboardStats.ts`
- [ ] Create `src/application/dashboard/useMetricsChart.ts`
- [ ] Create `src/application/dashboard/useAuditTrail.ts`
- [ ] Migrate SmallCardsGrid, LineChart, TabbedMetricsChart, RecentActivity

### Phase 2: Service Expansion (Week 2)

- [ ] Extend CampaignService with PaymentSection methods
- [ ] Extend WalletService with chart data methods
- [ ] Create DashboardStatsService

### Phase 3: RPC Implementation (Week 3)

- [ ] Implement `get_partner_campaigns()` RPC
- [ ] Implement `get_partner_wallet()` RPC
- [ ] Implement `get_dashboard_summary()` RPC
- [ ] Update DashboardSection to use new RPCs

### Phase 4: Optimization (Week 4)

- [ ] Create `get_partner_metrics_30d()` RPC for chart data
- [ ] Create `get_recent_activity()` RPC with JOIN optimization
- [ ] Remove inline Supabase queries from components
- [ ] Add error boundary & loading states to all components

---

## Query Performance Analysis

| Component          | Current Query Count     | Recommended           | Query Type        | Latency Impact |
| ------------------ | ----------------------- | --------------------- | ----------------- | -------------- |
| SmallCardsGrid     | 5 queries               | 1 RPC call            | Aggregate         | -80%           |
| RecentActivity     | 11 queries (1 + 10 N+1) | 1 RPC call            | With JOIN         | -91%           |
| LineChart          | 1 query                 | 1 RPC (parameterized) | Grouped aggregate | Same           |
| TabbedMetricsChart | 1 query                 | Merge with LineChart  | Grouped aggregate | -50%           |
| UpcomingCampaigns  | 1 query                 | 1 Hook (cached)       | Filtered select   | Same           |

---

## Security Considerations

✓ **Implemented Correctly:**

- All queries filtered by `partner_id` via RLS policies
- Authentication via `auth.uid()` on users table
- Service-role RPC functions use SECURITY DEFINER for privilege escalation

⚠️ **Review Points:**

- Ensure RPC functions validate `p_partner_id` ownership before returning data
- Audit logs should not expose sensitive data via RecentActivity
- User data (names, emails) in RecentActivity should be scoped to activity visibility

---

## File Cross-Reference Map

### Components & Their Data Dependencies

```
DashboardSection
  ├─ useAuth() → users, partners
  ├─ usePermissions() → permissions
  ├─ usePartnerAccess() → partner_types
  ├─ useCampaigns() → campaigns
  ├─ DashboardCampaign[] data
  └─ [NEEDS RPC] get_partner_campaigns, get_partner_wallet

CampaignSection
  ├─ useAuth() → users, partners
  ├─ useCampaigns() → campaigns
  ├─ usePermissions() → permissions
  └─ [INLINE] supabase.from('campaigns').update() [SHOULD MIGRATE]

WalletSection
  ├─ useAuth() → users, partners
  ├─ usePermissions() → permissions
  ├─ useWalletData() → campaigns, transactions, withdrawals
  └─ useWalletFiltering() [client-side filter]

SmallCardsGrid
  ├─ useAuth() → users, partners
  ├─ [INLINE] campaigns count, status filter
  ├─ [INLINE] transactions count, type filter
  └─ [INLINE] wallets balance query [SHOULD USE RPC]

LineChart
  ├─ useAuth() → users, partners
  └─ [INLINE] transactions 30-day aggregate [SHOULD USE HOOK]

RecentActivity
  ├─ [INLINE] audit_logs select (N+1 with users) [NEEDS RPC]
  └─ [INLINE] users batch lookup

TabbedMetricsChart
  ├─ useAuth() → users, partners
  └─ [INLINE] transactions 30-day aggregate [DUPLICATE OF LineChart]

UpcomingCampaigns
  ├─ [INLINE] campaigns start_date filter [SHOULD USE HOOK]
  └─ No auth check (public read?)

PaymentSection
  ├─ useAuth() → users, partners
  └─ [INLINE] campaigns select [SHOULD USE useCampaigns HOOK]
```

---

## Conclusion

**Current State:**

- ✓ 2 major services created (CampaignService, WalletService)
- ✗ 6 components with scattered direct queries
- ✗ 2 RPC functions referenced but not implemented
- ✗ Multiple instances of duplicate data fetching logic

**Recommendation Priority:**

1. **Immediate:** Implement missing RPC functions (get_partner_campaigns, get_partner_wallet)
2. **High:** Create dashboard-specific hooks (useDashboardStats, useMetricsChart, useAuditTrail)
3. **Medium:** Consolidate chart queries (LineChart + TabbedMetricsChart) into single hook
4. **Medium:** Fix N+1 query issue in RecentActivity component

**Estimated Effort:**

- Hooks & Services: 5-8 hours
- RPC Functions: 3-4 hours
- Component Migration: 4-6 hours
- Testing & Optimization: 4-6 hours

**Total: ~20 hours**

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Author:** Dashboard Auth & Data Flow Analyst  
**Status:** For Implementation Review
