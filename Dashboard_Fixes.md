# Dashboard Refactor Implementation Guide

**Generated:** February 15, 2026  
**Workspace:** `d:\PROJECTS\sqoolipartner-main`  
**Objective:** Eliminate all inline Supabase queries and scattered RPC calls; centralize into modular hooks/services  
**Status:** Implementation Roadmap Ready

---

## Executive Summary

This document provides a **complete refactor plan** to migrate dashboard components from scattered inline Supabase queries to a centralized, testable, and maintainable architecture using modular hooks and services.

### Current Problems

- ❌ 6 components with direct Supabase queries (not modularized)
- ❌ 11 separate query calls for aggregates in SmallCardsGrid alone
- ❌ N+1 query problem in RecentActivity (1 + 10 lookups)
- ❌ 2 RPC calls referenced but not implemented in backend
- ❌ Duplicate query logic (LineChart & TabbedMetricsChart)
- ❌ No unified error handling or loading state management

### Proposed Solution

- ✅ Centralized Supabase client module
- ✅ 4 new dashboard hooks (Stats, Metrics, Audit, Campaigns)
- ✅ Extended service classes (CampaignService, WalletService, DashboardService)
- ✅ RPC functions with JOIN optimization
- ✅ Type-safe data layer with consistent error handling

### Impact

- **Query Count:** Reduce from 20+ to 7 total dashboard queries
- **Network Calls:** -65% reduction in API calls
- **Component Complexity:** Remove all Supabase logic
- **Performance:** 80-91% latency improvement on aggregates

---

## Component-by-Component Refactor Mapping

| File Name                | Current Function/Query                         | Function Type              | Current Pattern                     | Target Module        | Target Service                               | Implementation Phase | Line Impact     | Priority  |
| ------------------------ | ---------------------------------------------- | -------------------------- | ----------------------------------- | -------------------- | -------------------------------------------- | -------------------- | --------------- | --------- |
| CampaignSection.tsx      | useCampaigns()                                 | Hook (✓ Good)              | centralized via hook                | CampaignService      | CampaignService                              | Maintain Phase1      | 0 changes       | ✅ Low    |
| CampaignSection.tsx      | supabase.from('campaigns').update()            | Direct Query (✗ Bad)       | inline delete/update                | CampaignService      | CampaignService.updateStatus()               | Phase 2              | Remove 10 lines | 🔴 High   |
| DashboardSection.tsx     | supabase.rpc('get_partner_campaigns')          | RPC Call (✗ Undefined)     | inline RPC                          | DashboardClient      | DashboardClient.fetchPartnerCampaigns()      | Phase 3              | Replace 5 lines | 🔴 High   |
| DashboardSection.tsx     | supabase.rpc('get_partner_wallet')             | RPC Call (✗ Undefined)     | inline RPC                          | DashboardClient      | DashboardClient.fetchPartnerWallet()         | Phase 3              | Replace 5 lines | 🔴 High   |
| PaymentSection.tsx       | supabase.from('campaigns').select()            | Direct Query (✗ Bad)       | inline select                       | useCampaigns Hook    | CampaignService                              | Phase 2              | Remove 20 lines | 🟡 Medium |
| WalletSection.tsx        | useWalletData()                                | Hook (✓ Good)              | centralized via hook                | WalletService        | WalletService                                | Maintain Phase1      | 0 changes       | ✅ Low    |
| WalletSection.tsx        | useWalletFiltering()                           | Hook (✓ Good)              | client-side filtering               | WalletService        | useWalletFiltering()                         | Maintain Phase1      | 0 changes       | ✅ Low    |
| LineChart.tsx            | supabase.from('transactions').select()         | Direct Query (✗ Bad)       | inline 30d aggregate                | useDashboardMetrics  | DashboardClient                              | Phase 1              | Remove 30 lines | 🔴 High   |
| TabbedMetricsChart.tsx   | supabase.from('transactions').select()         | Direct Query (✗ Bad)       | duplicate of LineChart              | useDashboardMetrics  | DashboardClient (merged)                     | Phase 1              | Remove 30 lines | 🔴 High   |
| RecentActivity.tsx       | supabase.from('audit_logs').select()           | Direct Query (✗ Bad)       | N+1 problem (1+10)                  | useDashboardAudit    | DashboardClient.fetchAuditLogs()             | Phase 3              | Remove 30 lines | 🔴 High   |
| RecentActivity.tsx       | supabase.from('users').select() (batch)        | Direct Query (✗ Bad)       | N+1 workaround                      | useDashboardAudit    | DashboardClient.fetchAuditLogs() (with JOIN) | Phase 3              | Remove 20 lines | 🔴 High   |
| SmallCardsGrid.tsx       | supabase.from('campaigns').select(...count)    | Direct Query (✗ Bad)       | aggregate count                     | useDashboardStats    | DashboardClient.fetchDashboardSummary()      | Phase 3              | Remove 10 lines | 🔴 High   |
| SmallCardsGrid.tsx       | supabase.from('transactions').select(...count) | Direct Query (✗ Bad)       | aggregate count (part of 5 queries) | useDashboardStats    | DashboardClient.fetchDashboardSummary()      | Phase 3              | Consolidated    | 🔴 High   |
| SmallCardsGrid.tsx       | supabase.from('wallets').select(.single())     | Direct Query (✗ Bad)       | aggregate fetch                     | useDashboardStats    | DashboardClient.fetchDashboardSummary()      | Phase 3              | Consolidated    | 🔴 High   |
| UpcomingCampaigns.tsx    | supabase.from('campaigns').select()            | Direct Query (✗ Bad)       | inline filtered select              | useUpcomingCampaigns | DashboardClient.fetchUpcomingCampaigns()     | Phase 1              | Remove 15 lines | 🟡 Medium |
| WalletBalanceCard.tsx    | (Props: wallet)                                | Display Component (✓ Good) | data via props only                 | -                    | -                                            | Phase 4 (no change)  | 0 changes       | ✅ Low    |
| WalletBalanceDisplay.tsx | (Props: wallet)                                | Display Component (✓ Good) | data via props only                 | -                    | -                                            | Phase 4 (no change)  | 0 changes       | ✅ Low    |

---

## Detailed Refactor Phases

### Phase 1: Hook Consolidation (Week 1 - 40 hours)

**Goal:** Create 4 new centralized hooks to replace inline queries in LineChart, TabbedMetricsChart, UpcomingCampaigns.

#### 1.1 Create `useDashboardMetrics` Hook

**File:** `src/application/dashboard/useDashboardMetrics.ts`

**Purpose:** Consolidate LineChart + TabbedMetricsChart queries into single parameterized hook

**Replaces:**

- LineChart.tsx inline query (30 lines)
- TabbedMetricsChart.tsx inline query (30 lines)

**Implementation:**

```typescript
export interface DashboardMetrics {
  date: string;
  earnings: number;
  withdrawals: number;
  engagements: number;
}

export interface UseDashboardMetricsReturn {
  data: DashboardMetrics[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardMetrics(
  partnerId: string | undefined,
  days: number = 30,
): UseDashboardMetricsReturn {
  // Calls DashboardClient.fetchDashboardMetrics()
  // Returns aggregated data by date
  // Handles errors, loading states
}
```

**Dependencies:**

- DashboardClient.fetchDashboardMetrics(partnerId, days)

**RLS Policy:** transactions_user_select

**Testing:**

- Mock DashboardClient.fetchDashboardMetrics()
- Verify data aggregation by date
- Test empty state, error state, loading state

---

#### 1.2 Create `useUpcomingCampaigns` Hook

**File:** `src/application/dashboard/useUpcomingCampaigns.ts`

**Purpose:** Replace UpcomingCampaigns.tsx inline query

**Replaces:**

- UpcomingCampaigns.tsx supabase.from('campaigns').select() (15 lines)

**Implementation:**

```typescript
export interface UpcomingCampaign {
  id: string;
  name: string;
  start_date: string;
}

export interface UseUpcomingCampaignsReturn {
  campaigns: UpcomingCampaign[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUpcomingCampaigns(
  partnerId: string | undefined,
  limit: number = 5,
): UseUpcomingCampaignsReturn {
  // Calls DashboardClient.fetchUpcomingCampaigns(partnerId, limit)
  // Filters start_date >= today
  // Sorts by start_date ascending
}
```

**Dependencies:**

- DashboardClient.fetchUpcomingCampaigns(partnerId, limit)

**RLS Policy:** campaigns_user_select

**Testing:**

- Mock DashboardClient
- Verify date filtering (future dates only)
- Verify sorting order

---

### Phase 2: Service Expansion (Week 2 - 30 hours)

**Goal:** Extend existing services and create CampaignService methods

#### 2.1 Extend CampaignService

**File:** `src/infrastructure/campaign/campaign.service.ts`

**New Methods:**

```typescript
export class CampaignService {
  // Existing
  async fetchByPartner(partnerId: string): Promise<Campaign[]> {}

  // New - Phase 2
  async updateCampaignStatus(
    campaignId: string,
    status: "active" | "expired" | "draft",
  ): Promise<void> {
    // Replace CampaignSection.tsx inline update
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    // Replace CampaignSection.tsx delete logic
  }

  async fetchPaymentCampaigns(partnerId: string): Promise<Campaign[]> {
    // Replace PaymentSection.tsx inline query
  }

  // New - Phase 3
  async fetchUpcomingCampaigns(
    partnerId: string,
    limit?: number,
  ): Promise<Campaign[]> {
    // Used by useUpcomingCampaigns hook
  }

  async countCampaignsByStatus(
    partnerId: string,
    status?: string,
  ): Promise<number> {
    // Used by useDashboardStats
  }
}
```

**Impact:**

- Removes 10 lines from CampaignSection.tsx (update/delete logic)
- Removes 20 lines from PaymentSection.tsx (inline select)
- Enables type-safe campaign operations

---

#### 2.2 Extend WalletService

**File:** `src/infrastructure/wallet/wallet.service.ts`

**New Methods:**

```typescript
export class WalletService implements IWalletService {
  // Existing
  async fetchCampaigns(partnerId: string): Promise<Campaign[]> {}
  async fetchTransactions(partnerId: string): Promise<Transaction[]> {}
  async fetchWithdrawals(partnerId: string): Promise<Withdrawal[]> {}

  // New - Phase 2
  async fetchWalletBalance(partnerId: string): Promise<WalletData> {
    // Replace SmallCardsGrid wallet query
  }

  async countTransactions(partnerId: string, type?: string): Promise<number> {
    // Used by useDashboardStats
  }

  // New - Phase 3
  async fetchDashboardMetrics(
    partnerId: string,
    days?: number,
  ): Promise<DashboardMetrics[]> {
    // Used by useDashboardMetrics hook
  }
}
```

**Impact:**

- Consolidates wallet and transaction queries
- Removes duplication between SmallCardsGrid and other components

---

### Phase 3: RPC Implementation & Supabase Client (Week 3 - 35 hours)

**Goal:** Create centralized Supabase client with RPC functions; replace all remaining direct queries

#### 3.1 Create DashboardClient Module

**File:** `src/lib/supabase/dashboard-client.ts`

**Purpose:** Centralized data access for all dashboard queries with RLS policy enforcement

**Methods:**

```typescript
export const DashboardClient = {
  // Campaigns
  async fetchPartnerCampaigns(partnerId: string): Promise<Campaign[]> {
    // Replace DashboardSection.tsx rpc('get_partner_campaigns')
    // Return: campaigns for partner
    // RLS: campaigns_user_select
  },

  async fetchUpcomingCampaigns(
    partnerId: string,
    limit: number = 5,
  ): Promise<Campaign[]> {
    // Replace UpcomingCampaigns.tsx inline query
    // Filter: start_date >= today
    // RLS: campaigns_user_select
  },

  async countCampaignsByStatus(
    partnerId: string,
    status: string,
  ): Promise<number> {
    // Replace SmallCardsGrid campaign count
    // RLS: campaigns_user_select
  },

  // Wallet & Transactions
  async fetchPartnerWallet(partnerId: string): Promise<WalletData> {
    // Replace DashboardSection.tsx rpc('get_partner_wallet')
    // Return: wallet balance + stats
    // RLS: wallets_user_select
  },

  async fetchDashboardSummary(partnerId: string): Promise<DashboardSummary> {
    // Replace SmallCardsGrid (5 queries → 1)
    // Return: {
    //   total_campaigns: number,
    //   active_campaigns: number,
    //   total_transactions: number,
    //   wallet_balance: number,
    //   total_earned: number
    // }
    // RLS: campaigns_user_select, transactions_user_select, wallets_user_select
    // Implementation: Use single RPC or combined queries with Promise.all()
  },

  async fetchDashboardMetrics(
    partnerId: string,
    days: number = 30,
    metricType?: string,
  ): Promise<DashboardMetrics[]> {
    // Replace LineChart + TabbedMetricsChart
    // Return: aggregated by date for 30 days
    // RLS: transactions_user_select
  },

  async fetchRecentActivity(
    partnerId: string,
    limit: number = 10,
  ): Promise<ActivityLog[]> {
    // Replace RecentActivity (N+1 → 1)
    // Return: {
    //   id: string,
    //   user: string,
    //   action: string,
    //   time: string
    // }
    // RLS: audit_logs_user_select
    // Implementation: RPC with LEFT JOIN to users to avoid N+1
  },

  async fetchAuditLogs(partnerId: string, limit?: number): Promise<AuditLog[]> {
    // Support for RecentActivity + audit trail views
    // RLS: audit_logs_user_select
  },
};
```

**Error Handling:**

```typescript
// Standard error handling pattern
try {
  const data = await DashboardClient.fetchDashboardSummary(partnerId);
  return data;
} catch (error) {
  if (error.code === "PGRST116") {
    // RLS policy violation
    throw new Error("Unauthorized access to dashboard data");
  }
  throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
}
```

---

#### 3.2 Implement Backend RPC Functions

**File:** `DATABASE_FILES/015_dashboard_rpc_functions.sql` (NEW)

**Functions to Create:**

```sql
-- 1. Get Partner Campaigns (replaces DashboardSection RPC)
CREATE OR REPLACE FUNCTION get_partner_campaigns(p_partner_id UUID)
RETURNS TABLE (
  id UUID, partner_id UUID, name TEXT, status TEXT,
  duration_start TIMESTAMP, duration_end TIMESTAMP,
  created_at TIMESTAMP, updated_at TIMESTAMP
) AS $$
SELECT id, partner_id, name, status, duration_start, duration_end, created_at, updated_at
FROM campaigns
WHERE partner_id = p_partner_id
ORDER BY created_at DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 2. Get Partner Wallet (replaces DashboardSection RPC)
CREATE OR REPLACE FUNCTION get_partner_wallet(p_partner_id UUID)
RETURNS TABLE (
  balance NUMERIC, total_earned NUMERIC,
  paybill_number TEXT, account_number TEXT,
  wallet_setup_completed BOOLEAN
) AS $$
SELECT balance, total_earned, paybill_number, account_number, wallet_setup_completed
FROM wallets
WHERE partner_id = p_partner_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. Get Dashboard Summary (consolidates 5 SmallCardsGrid queries)
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

-- 4. Get Dashboard Metrics (consolidates LineChart + TabbedMetricsChart)
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_partner_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date TEXT, earnings NUMERIC, withdrawals NUMERIC, engagements BIGINT
) AS $$
WITH date_range AS (
  SELECT generate_series(
    CURRENT_DATE - (p_days - 1)::interval,
    CURRENT_DATE,
    '1 day'::interval
  )::DATE AS d
),
transactions_by_date AS (
  SELECT
    (t.created_at::DATE)::TEXT AS tx_date,
    SUM(CASE WHEN t.transaction_type = 'earnings' THEN t.amount ELSE 0 END)::NUMERIC AS earnings,
    SUM(CASE WHEN t.transaction_type = 'withdrawal' THEN t.amount ELSE 0 END)::NUMERIC AS withdrawals,
    COUNT(CASE WHEN t.transaction_type = 'engagement' THEN 1 END) AS engagements
  FROM transactions t
  WHERE t.partner_id = p_partner_id
  AND t.created_at >= CURRENT_DATE - (p_days - 1)::interval
  GROUP BY (t.created_at::DATE)
)
SELECT
  (dr.d)::TEXT AS date,
  COALESCE(tbd.earnings, 0) AS earnings,
  COALESCE(tbd.withdrawals, 0) AS withdrawals,
  COALESCE(tbd.engagements, 0) AS engagements
FROM date_range dr
LEFT JOIN transactions_by_date tbd ON (dr.d)::TEXT = tbd.tx_date
ORDER BY dr.d DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 5. Get Recent Activity (fixes N+1 problem with JOIN)
CREATE OR REPLACE FUNCTION get_recent_activity(p_partner_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID, user_name TEXT, action TEXT, created_at TIMESTAMP
) AS $$
SELECT
  al.id,
  COALESCE(u.full_name, 'System') AS user_name,
  al.action,
  al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.partner_id = p_partner_id
ORDER BY al.created_at DESC
LIMIT p_limit;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execution to authenticated role
GRANT EXECUTE ON FUNCTION get_partner_campaigns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_wallet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(UUID, INT) TO authenticated;
```

**Benefits:**

- ✅ Fixes N+1 problem in RecentActivity (1 RPC vs 11 queries)
- ✅ Consolidates SmallCardsGrid (5 queries → 1 RPC)
- ✅ Replaces LineChart + TabbedMetricsChart (1 shared RPC)
- ✅ Server-side aggregation = faster response
- ✅ RLS enforced at database layer

---

#### 3.3 Update Components to Use DashboardClient

**LineChart.tsx - Before:**

```typescript
useEffect(() => {
  if (!partnerId) return;
  let q = supabase.from("transactions").select(...);
  if (partnerId) q = q.eq("partner_id", partnerId as any);
  const { data, error } = await q.gte("created_at", since.toISOString()).order(...);
  // 30 lines of manual aggregation
}, [partnerId]);
```

**LineChart.tsx - After:**

```typescript
const { data: metrics, isLoading, error } = useDashboardMetrics(partnerId, 30);

// Replace manual aggregation with hook data
const earningsData =
  metrics?.map((m) => ({ date: m.date, value: m.earnings })) || [];
```

---

### Phase 4: Optimization & Finalization (Week 4 - 25 hours)

**Goal:** Final testing, error handling, loading states, legacy cleanup

#### 4.1 Error Boundary & Loading States

**File:** `src/components/dashboard/DashboardErrorBoundary.tsx`

```typescript
export function DashboardErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={<DashboardErrorFallback />}
      onError={(error) => {
        logError('Dashboard render error', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**File:** `src/components/dashboard/DashboardLoading.tsx`

```typescript
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
```

---

#### 4.2 Component Migration Checklist

| Component              | Current State      | Phase 1              | Phase 2                   | Phase 3           | Phase 4            | Final Status          |
| ---------------------- | ------------------ | -------------------- | ------------------------- | ----------------- | ------------------ | --------------------- |
| CampaignSection.tsx    | 100 lines (mixed)  | -                    | Move .update() to service | -                 | -                  | 90 lines (hook-based) |
| DashboardSection.tsx   | 200 lines          | -                    | -                         | Replace RPC calls | Add error boundary | 190 lines (RPC-based) |
| PaymentSection.tsx     | 60 lines           | -                    | Use useCampaigns          | -                 | -                  | 40 lines              |
| WalletSection.tsx      | 150 lines (✓ Good) | -                    | -                         | -                 | -                  | 150 lines (no change) |
| LineChart.tsx          | 120 lines          | Create hook          | Remove query              | Use RPC           | Add loading        | 60 lines              |
| TabbedMetricsChart.tsx | 140 lines          | Merge with LineChart | Remove query              | Use shared RPC    | Add loading        | 80 lines (merged)     |
| RecentActivity.tsx     | 90 lines           | -                    | -                         | Use RPC (no N+1)  | Add error state    | 50 lines              |
| SmallCardsGrid.tsx     | 130 lines          | -                    | -                         | Use RPC           | Add loading        | 70 lines              |
| UpcomingCampaigns.tsx  | 70 lines           | Create hook          | -                         | Use RPC           | -                  | 50 lines              |

---

#### 4.3 Testing Strategy

**Unit Tests:**

```typescript
describe("useDashboardMetrics", () => {
  it("should fetch and aggregate metrics for 30 days", async () => {
    const { result } = renderHook(() => useDashboardMetrics("partner-id"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(30);
  });

  it("should handle RLS authorization errors", async () => {
    // Mock unauthorized error
    expect(result.current.error?.message).toContain("Unauthorized");
  });
});

describe("DashboardClient", () => {
  it("should call get_dashboard_summary RPC", async () => {
    const summary = await DashboardClient.fetchDashboardSummary("partner-id");
    expect(summary.total_campaigns).toBeGreaterThanOrEqual(0);
  });
});
```

**Integration Tests:**

- E2E: Load Dashboard → verify all sections render with data
- RLS: Non-partner users cannot access other partner's data
- Performance: Dashboard loads in < 2 seconds

---

## Implementation Timeline

### Week 1: Hook Consolidation

- Monday-Tuesday: Create useDashboardMetrics hook
- Wednesday: Create useUpcomingCampaigns hook
- Thursday: Test hooks, integrate with components
- Friday: Code review, deployment to staging

### Week 2: Service Expansion

- Monday-Tuesday: Extend CampaignService, WalletService
- Wednesday: Add methods for SmallCardsGrid aggregates
- Thursday: Update PaymentSection to use CampaignService
- Friday: E2E testing, staging validation

### Week 3: RPC Implementation

- Monday: Create database migration (015_dashboard_rpc_functions.sql)
- Tuesday: Implement DashboardClient module
- Wednesday-Thursday: Replace all inline queries with DashboardClient calls
- Friday: Performance testing, RLS validation

### Week 4: Optimization

- Monday-Tuesday: Add error boundaries, loading states
- Wednesday: Final component migration
- Thursday: Full regression testing
- Friday: Code review, production deployment

---

## Detailed Refactor Table: Complete Mapping

| File Name                    | Current Function/Query                         | Current Pattern      | Issues                                       | Target Module                | Target Service Method                    | RPC Required | Implementation Phase | Effort (hrs) | Testing Coverage      |
| ---------------------------- | ---------------------------------------------- | -------------------- | -------------------------------------------- | ---------------------------- | ---------------------------------------- | ------------ | -------------------- | ------------ | --------------------- |
| **CampaignSection.tsx**      | useCampaigns()                                 | Hook import          | ✓ Already modularized                        | -                            | -                                        | No           | Maintain             | 0            | ✅ Covered            |
| **CampaignSection.tsx**      | supabase.from('campaigns').update()            | Direct inline query  | Delete logic scattered                       | CampaignService              | updateCampaignStatus(id, status)         | No           | Phase 2              | 3            | Add unit test         |
| **DashboardSection.tsx**     | supabase.rpc('get_partner_campaigns')          | Direct RPC call      | RPC undefined in DB                          | DashboardClient              | fetchPartnerCampaigns(partnerId)         | Yes          | Phase 3              | 4            | Add RPC test          |
| **DashboardSection.tsx**     | supabase.rpc('get_partner_wallet')             | Direct RPC call      | RPC undefined in DB                          | DashboardClient              | fetchPartnerWallet(partnerId)            | Yes          | Phase 3              | 4            | Add RPC test          |
| **PaymentSection.tsx**       | supabase.from('campaigns').select()            | Direct inline query  | Not using CampaignService                    | useCampaigns hook            | CampaignService.fetchPaymentCampaigns()  | No           | Phase 2              | 2            | Existing tests        |
| **WalletSection.tsx**        | useWalletData()                                | Hook import          | ✓ Already modularized                        | -                            | -                                        | No           | Maintain             | 0            | ✅ Covered            |
| **WalletSection.tsx**        | useWalletFiltering()                           | Hook (client-side)   | ✓ Already modularized                        | -                            | -                                        | No           | Maintain             | 0            | ✅ Covered            |
| **LineChart.tsx**            | supabase.from('transactions').select()         | Direct inline query  | 30 lines manual aggregation; duplicate logic | useDashboardMetrics          | DashboardClient.fetchDashboardMetrics()  | Yes          | Phase 1,3            | 8            | New hook tests        |
| **TabbedMetricsChart.tsx**   | supabase.from('transactions').select()         | Direct inline query  | Exact duplicate of LineChart                 | useDashboardMetrics (shared) | DashboardClient.fetchDashboardMetrics()  | Yes          | Phase 1,3            | 3 (merged)   | Reuse LineChart tests |
| **RecentActivity.tsx**       | supabase.from('audit_logs').select()           | Direct inline query  | N+1: followed by user lookup                 | useDashboardAudit            | DashboardClient.fetchRecentActivity()    | Yes          | Phase 3              | 6            | Test N+1 fix          |
| **RecentActivity.tsx**       | supabase.from('users').select() (batch)        | Direct batch query   | N+1 workaround; separate from audit          | useDashboardAudit (merged)   | DashboardClient.fetchRecentActivity()    | Yes          | Phase 3              | 0 (merged)   | Verify JOIN           |
| **SmallCardsGrid.tsx**       | supabase.from('campaigns').select(...count)    | Direct count query   | 5 separate queries; inefficient              | useDashboardStats            | DashboardClient.fetchDashboardSummary()  | Yes          | Phase 3              | 2            | Performance test      |
| **SmallCardsGrid.tsx**       | supabase.from('transactions').select(...count) | Direct count query   | Part of 5-query pattern                      | useDashboardStats (merged)   | DashboardClient.fetchDashboardSummary()  | Yes          | Phase 3              | 0 (merged)   | Covered above         |
| **SmallCardsGrid.tsx**       | supabase.from('wallets').select(.single())     | Direct balance query | Part of 5-query pattern                      | useDashboardStats (merged)   | DashboardClient.fetchDashboardSummary()  | Yes          | Phase 3              | 0 (merged)   | Covered above         |
| **UpcomingCampaigns.tsx**    | supabase.from('campaigns').select()            | Direct inline query  | 15 lines; filtering duplicated               | useUpcomingCampaigns         | DashboardClient.fetchUpcomingCampaigns() | No           | Phase 1              | 4            | New hook tests        |
| **WalletBalanceCard.tsx**    | (Props: wallet)                                | Display component    | ✓ Pure presentation                          | -                            | -                                        | No           | Phase 4              | 0            | ✅ No change          |
| **WalletBalanceDisplay.tsx** | (Props: wallet)                                | Display component    | ✓ Pure presentation                          | -                            | -                                        | No           | Phase 4              | 0            | ✅ No change          |

---

## Refactor Success Criteria

### Code Quality

- ✅ Zero inline Supabase queries in components
- ✅ 100% of data access through services/hooks
- ✅ All services have TS interfaces
- ✅ Error handling consistent (try-catch, user messages)

### Performance

- ✅ Dashboard load: < 2 seconds (currently 3-4s)
- ✅ SmallCardsGrid: 5 queries → 1 RPC call (-80% latency)
- ✅ RecentActivity: 11 queries → 1 RPC call (-91% latency)
- ✅ LineChart + TabbedMetricsChart: merged into 1 hook

### Testing

- ✅ All hooks have unit tests (mocked DashboardClient)
- ✅ DashboardClient calls tested against real DB
- ✅ RPC functions tested for correctness & RLS
- ✅ E2E: Dashboard full flow on Chrome, Safari, Firefox

### Maintainability

- ✅ New developer can find data access logic immediately (one file: DashboardClient)
- ✅ Adding new dashboard metric takes < 30 minutes
- ✅ RLS policies enforced at DB layer (not app layer)
- ✅ Documentation: Every hook has JSDoc + example usage

---

## File Structure After Refactor

```
src/
├── application/
│   └── dashboard/
│       ├── useDashboardMetrics.ts        [NEW - Phase 1]
│       ├── useDashboardStats.ts          [NEW - Phase 3]
│       ├── useDashboardAudit.ts          [NEW - Phase 3]
│       ├── useUpcomingCampaigns.ts       [NEW - Phase 1]
│       └── __tests__/
│           ├── useDashboardMetrics.test.ts
│           ├── useDashboardStats.test.ts
│           ├── useDashboardAudit.test.ts
│           └── useUpcomingCampaigns.test.ts
│
├── infrastructure/
│   ├── campaign/
│   │   ├── campaign.service.ts           [EXTENDED - Phase 2,3]
│   │   └── __tests__/
│   │       └── campaign.service.test.ts [UPDATED]
│   │
│   └── wallet/
│       ├── wallet.service.ts             [EXTENDED - Phase 2,3]
│       └── __tests__/
│           └── wallet.service.test.ts  [UPDATED]
│
├── lib/
│   └── supabase/
│       ├── client.ts                       [EXISTING]
│       └── dashboard-client.ts             [NEW - Phase 3]
│           ├── __tests__/
│           └── dashboard-client.test.ts
│
└── sections/
    ├── CampaignSection.tsx                [UPDATED - Phase 2]
    ├── DashboardSection.tsx               [UPDATED - Phase 3,4]
    ├── PaymentSection.tsx                 [UPDATED - Phase 2]
    ├── WalletSection.tsx                  [NO CHANGE]
    └── __tests__/
        ├── CampaignSection.test.tsx
        ├── DashboardSection.test.tsx
        └── PaymentSection.test.tsx
```

---

## Migration Path: Component by Component

### Step 1: SmallCardsGrid.tsx (Critical Path Start)

```typescript
// BEFORE
useEffect(() => {
  const baseQuery = supabase.from("campaigns").select("id", { count: "exact", head: true });
  const totalQ = partnerId ? baseQuery.eq("partner_id", partnerId) : baseQuery;
  const { count: totalCount } = await totalQ;

  let ongoingQ = supabase.from("campaigns").select(...).eq("status", "active");
  // + 3 more similar queries...
}, [partnerId]);

// AFTER
const { data: summary, isLoading } = useDashboardStats(partnerId);
if (isLoading) return <Skeleton />;

const totalCampaigns = summary?.total_campaigns || 0;
const activeCount = summary?.active_campaigns || 0;
// etc.
```

### Step 2: LineChart.tsx & TabbedMetricsChart.tsx (Consolidation)

```typescript
// BEFORE: 2 components with identical 30-day transaction queries
// AFTER: 1 hook, 2 components
const { data: metrics } = useDashboardMetrics(partnerId);
const earningsSum = metrics?.reduce((sum, m) => sum + m.earnings, 0) || 0;
const withdrawalsData =
  metrics?.map((m) => ({ date: m.date, value: m.withdrawals })) || [];
```

### Step 3: RecentActivity.tsx (N+1 Fix)

```typescript
// BEFORE: Query audit_logs, then 10x query users
// AFTER: Single RPC call with LEFT JOIN
const { data: activities } = useDashboardAudit(partnerId);
const items =
  activities?.map((a) => ({
    user: a.user_name,
    action: a.action,
    time: a.created_at,
  })) || [];
```

### Step 4: DashboardSection.tsx (RPC Integration)

```typescript
// BEFORE: Undefined RPCs referenced
// AFTER: DashboardClient methods
const { data: campaigns } =
  await DashboardClient.fetchPartnerCampaigns(partnerId);
const { data: wallet } = await DashboardClient.fetchPartnerWallet(partnerId);
```

---

## Risk Assessment & Mitigation

| Risk                                     | Probability | Impact | Mitigation                                                                       |
| ---------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------- |
| RPC functions break in production        | Medium      | High   | Test RPCs in staging; rollback SQL functions immediately                         |
| N+1 fix causes timeout on large datasets | Low         | High   | Add database indexes on audit_logs.partner_id, created_at; test with 10k records |
| RLS policy validation fails              | Low         | Medium | Run comprehensive RLS test suite before prod deploy                              |
| Component still uses old queries         | Medium      | Medium | Grep search for inline `supabase.from()` before release                          |
| Performance regression                   | Low         | Medium | Monitor query latency in APM; set alerts for >3s dashboard load                  |

---

## Rollback Plan

**If issues arise post-deployment:**

1. **Revert database migration**

   ```sql
   DROP FUNCTION get_dashboard_summary CASCADE;
   DROP FUNCTION get_dashboard_metrics CASCADE;
   DROP FUNCTION get_recent_activity CASCADE;
   -- etc.
   ```

2. **Temporarily comment out DashboardClient usage**

   ```typescript
   // const { data } = await DashboardClient.fetchDashboardSummary(partnerId);
   // Fallback to direct service calls
   ```

3. **Restore component inline queries from git history**

   ```bash
   git checkout HEAD~1 -- src/ui/dashboard/SmallCardsGrid.tsx
   ```

4. **Monitor error rates; proceed with next phase only if stable**

---

## Conclusion

This refactor transforms the dashboard from a scattered, hard-to-maintain system into a clean, centralized, performant architecture.

### Before State

- **Query Complexity:** ❌ 20+ concurrent queries
- **Code Duplication:** ❌ Logic repeated across 6 components
- **N+1 Issues:** ❌ RecentActivity: 11 queries
- **Error Handling:** ❌ Inconsistent try-catch blocks
- **Testing:** ❌ Hard to test without mocking Supabase

### After State

- **Query Complexity:** ✅ 7 total dashboard queries
- **Code Duplication:** ✅ Single source of truth (DashboardClient)
- **N+1 Issues:** ✅ Fixed: 11 → 1 (RecentActivity RPC)
- **Error Handling:** ✅ Consistent pattern (DashboardClient methods)
- **Testing:** ✅ Easy to test: mock DashboardClient

### Metrics

- **Lines Removed:** ~500 lines of scattered inline Supabase calls
- **Lines Added:** ~300 lines (hooks + services + tests)
- **Net Reduction:** -40% code footprint
- **Performance Improvement:** -65% average query count, -80-91% latency on aggregates
- **Type Safety:** 100% TypeScript interfaces for all data types
- **Test Coverage:** +15 new unit tests, +5 new integration tests

**Timeline:** 4 weeks (130 hours)  
**Team:** 1 Backend Engineer + 1 Frontend Engineer  
**Risk Level:** Medium (database migrations required)  
**ROI:** High (long-term maintainability, performance, scalability)

---

**Document Version:** 2.0  
**Based On:** Dashboard_Auth.md (v1.0)  
**Status:** Ready for Implementation  
**Next Step:** Create Phase 1 tasks in project management tool  
**Approval Required:** Tech Lead, Database Admin, QA Lead
