# Dashboard & Frontend Supabase Request Analysis

**Generated:** February 8, 2026  
**Scope:** Complete mapping of database requests, columns, and redundancies across dashboard UI, sections, pages, and hooks

---

## 1. Database Request Mapping Table

| File                                        | Db_Requests                                                                        | DbTableandColumn                                                                                             | FileRedundant                                                    | ColumnRedundant                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/ui/dashboard/LineChart.tsx`            | SELECT (transactions)                                                              | transactions: id, amount, transaction_type, created_at                                                       | **YES** – Identical to TabbedMetricsChart.tsx                    | No – columns are essential for aggregation                                            |
| `src/ui/dashboard/TabbedMetricsChart.tsx`   | SELECT (transactions)                                                              | transactions: id, amount, transaction_type, created_at                                                       | **YES** – Identical to LineChart.tsx                             | No – columns are essential for aggregation                                            |
| `src/ui/dashboard/RecentActivity.tsx`       | SELECT (audit_logs); SELECT (users)                                                | audit_logs: id, user_id, action, created_at; users: id, full_name, email                                     | No                                                               | **YES** – Full user lookup for only names; only 3 columns needed                      |
| `src/ui/dashboard/SmallCardsGrid.tsx`       | SELECT COUNT (campaigns); SELECT COUNT (transactions); SELECT (wallets)            | campaigns: id (count); transactions: id (count); wallets: balance, total_earned                              | No                                                               | **YES** – Multiple aggregations could be single RPC call                              |
| `src/ui/dashboard/UpcomingCampaigns.tsx`    | SELECT (campaigns)                                                                 | campaigns: id, name, start_date                                                                              | No                                                               | No – columns necessary for display                                                    |
| `src/ui/dashboard/WalletBalanceCard.tsx`    | None (prop-based)                                                                  | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/ui/dashboard/WalletBalanceDisplay.tsx` | None (prop-based)                                                                  | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/sections/BeneficiarySection.tsx`       | Indirect (useBeneficiaryLists, useBeneficiaryStudents hooks)                       | Depends on hook implementation                                                                               | No                                                               | Depends on hooks                                                                      |
| `src/sections/CampaignSection.tsx`          | UPDATE (campaigns); uses useCampaigns hook                                         | campaigns: status (update only)                                                                              | No                                                               | No – minimal update for status change                                                 |
| `src/sections/DashboardSection.tsx`         | SELECT (campaigns); SELECT (wallets)                                               | campaigns: _ (all); wallets: _ (all)                                                                         | **PARTIAL** – SelectAll queries are over-broad                   | **YES** – SELECT \* unnecessary; request only needed fields                           |
| `src/sections/LockedSection.tsx`            | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/sections/PaymentSection.tsx`           | SELECT (campaigns)                                                                 | campaigns: \* (all)                                                                                          | **PARTIAL** – Duplicates DashboardSection campaign query         | **YES** – SELECT \* unnecessary; request only name, partner_id, status                |
| `src/sections/ProgramSection.tsx`           | SELECT (campaigns); SELECT COUNT (purchases); SELECT (programs); DELETE (programs) | campaigns: id; purchases: id (count); programs: \* (all)                                                     | No                                                               | **YES** – purchases count aggregation could use RPC; programs SELECT \* over-broad    |
| `src/sections/ReportsSection.tsx`           | SELECT (campaigns via supabaseCRUD.getCampaignsByPartner)                          | campaigns: \*                                                                                                | See supabaseCRUD implementation                                  | Depends on helper                                                                     |
| `src/sections/SettingsSection.tsx`          | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/sections/TasksSection.tsx`             | SELECT (tasks with campaigns relation); SUBSCRIBE (realtime); UPDATE (tasks)       | tasks: _ with campaigns(_); tasks: status, approver_id, completed_at (update)                                | No                                                               | No – tasks query appropriate                                                          |
| `src/sections/UserSection.tsx`              | SELECT (users); SELECT (audit_logs); UPDATE (users)                                | users: _ (all); audit_logs: _ (all); users: is_account_activated, role, parent_user_id, is_sub_user (update) | **PARTIAL** – Overlaps RecentActivity audit_log fetch            | **YES** – SELECT \* unnecessary for users and audit_logs; only specific fields needed |
| `src/sections/WalletSection.tsx`            | Indirect (useWalletData, useWalletFiltering hooks)                                 | Depends on hook implementation                                                                               | No                                                               | Depends on hooks                                                                      |
| `src/pages/AuthCallback.tsx`                | RPC (create_user_profile)                                                          | Auth RPC function                                                                                            | No                                                               | No                                                                                    |
| `src/pages/Onboarding.tsx`                  | SELECT (partners – 2 variants); SELECT (users)                                     | partners: id; partners: id, partner_type; users: id, role, partner_role, email                               | **YES** – Identical to SelectAccount.tsx                         | **YES** – partners queries should be consolidated; users columns limited              |
| `src/pages/SelectAccount.tsx`               | SELECT (partners – 2 variants); SELECT (users)                                     | partners: id; partners: id, partner_type; users: id, role, partner_role, email                               | **YES** – Identical to Onboarding.tsx                            | **YES** – Same as Onboarding.tsx                                                      |
| `src/pages/SignIn.tsx`                      | Edge Function call (handleSignIn)                                                  | N/A – delegates to Edge Function                                                                             | No                                                               | No                                                                                    |
| `src/pages/auth/AuthCallback.tsx`           | RPC (create_user_profile)                                                          | Auth RPC function                                                                                            | **PARTIAL** – Same RPC possibly called in pages/AuthCallback.tsx | No                                                                                    |
| `src/pages/auth/VerifyEmail.tsx`            | Auth signup call (supabase.auth.signUp)                                            | Auth operation                                                                                               | No                                                               | No                                                                                    |
| `src/pages/Dashboard.tsx`                   | None (delegates to sections)                                                       | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/hooks/useAuth.ts`                      | Indirect (initializeAuthContext, fetchPartnerData, verifyAuthenticatedUser)        | Utility functions – details in utils/                                                                        | No                                                               | Depends on utility implementation                                                     |
| `src/hooks/usePartnerAccess.ts`             | None (derived from useAuth)                                                        | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/hooks/usePartnerPermissions.ts`        | None (derived from useAuth)                                                        | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/hooks/usePermission.ts`                | None (context consumer)                                                            | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/types/auth.types.ts`                   | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/types/database.types.ts`               | None (type definitions only)                                                       | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/types/global.types.ts`                 | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/types/partner.types.ts`                | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |
| `src/types/supabase.types.ts`               | None                                                                               | N/A                                                                                                          | No                                                               | No                                                                                    |

---

## 2. Critical Redundancy Summary

### 2.1 CRITICAL FILE REDUNDANCY (Identical Logic)

#### LineChart.tsx ↔ TabbedMetricsChart.tsx

- **Issue:** Both fetch identical `transactions` query with same filters and aggregation logic
- **Impact:** Duplicate network requests, duplicate client-side processing
- **Columns Fetched:** `id, amount, transaction_type, created_at`
- **Fix Priority:** HIGH – Consolidate into single `useTransactionsMetrics()` hook

#### Onboarding.tsx ↔ SelectAccount.tsx

- **Issue:** Both perform identical partner and user verification queries
- **Impact:** Code duplication, maintenance burden
- **Queries:**
  - `partners.select(id)` filtered by org_email or email
  - `partners.select(id, partner_type)` filtered by org_email or email
  - `users.select(id, role, partner_role, email)` by email
- **Fix Priority:** HIGH – Extract to shared `useAccountVerification()` hook

#### DashboardSection.tsx ↔ PaymentSection.tsx

- **Issue:** Both perform `campaigns.select(*)` with same partner_id filter
- **Impact:** Duplicate queries, over-fetch all columns
- **Columns:** `*` (all columns)
- **Fix Priority:** MEDIUM – Campaign list should be fetched once and cached

#### RecentActivity.tsx ↔ UserSection.tsx

- **Issue:** Both fetch audit_logs; UserSection also performs user lookup like RecentActivity
- **Impact:** Duplicate audit log queries, different access patterns
- **Fix Priority:** MEDIUM – Centralize audit log fetching with user lookup

---

### 2.2 COLUMN OVER-FETCH REDUNDANCY

| File                   | Query      | Current Columns       | Actual Need                                            | Redundant Columns          |
| ---------------------- | ---------- | --------------------- | ------------------------------------------------------ | -------------------------- |
| `DashboardSection.tsx` | campaigns  | \* (all ~20 cols)     | name, status, partner_id, duration_start, duration_end | ~15 unnecessary columns    |
| `PaymentSection.tsx`   | campaigns  | \* (all ~20 cols)     | name, partner_id                                       | ~18 unnecessary columns    |
| `ProgramSection.tsx`   | programs   | \* (all ~15 cols)     | name, end_date                                         | ~13 unnecessary columns    |
| `UserSection.tsx`      | users      | \* (all ~15 cols)     | name, email, role, partner_role, is_account_activated  | ~10 unnecessary columns    |
| `UserSection.tsx`      | audit_logs | \* (all ~10 cols)     | user_id, action, created_at                            | ~7 unnecessary columns     |
| `SmallCardsGrid.tsx`   | wallets    | balance, total_earned | balance (only display needed)                          | total_earned for calc only |

---

### 2.3 AGGREGATION REDUNDANCY

| File                 | Operation                                                  | Current Approach                    | Optimal Approach               | Savings                  |
| -------------------- | ---------------------------------------------------------- | ----------------------------------- | ------------------------------ | ------------------------ |
| `SmallCardsGrid.tsx` | Count campaigns, active campaigns, transactions, purchases | 4 separate SELECT COUNT calls       | 1 RPC call aggregating counts  | 3 fewer network requests |
| `ProgramSection.tsx` | Count purchases per program                                | SELECT with count in component loop | Batch RPC or aggregation query | N+1 query problem        |

---

## 3. Table-Level Request Frequency

| Table        | Total References | Files                                                                                | Query Types               | Optimization Target                    |
| ------------ | ---------------- | ------------------------------------------------------------------------------------ | ------------------------- | -------------------------------------- |
| transactions | 2 (IDENTICAL)    | LineChart, TabbedMetricsChart                                                        | SELECT                    | **CRITICAL** – Deduplicate             |
| campaigns    | 5                | DashboardSection, PaymentSection, UpcomingCampaigns, CampaignSection, ProgramSection | SELECT, UPDATE            | Centralize with proper field selection |
| audit_logs   | 2 (OVERLAPPING)  | RecentActivity, UserSection                                                          | SELECT                    | Consolidate with user lookup           |
| users        | 3                | SelectAccount, Onboarding, UserSection                                               | SELECT, UPDATE            | Consolidate account verification       |
| wallets      | 2                | SmallCardsGrid, DashboardSection                                                     | SELECT                    | Centralize wallet fetch                |
| partners     | 2 (IDENTICAL)    | SelectAccount, Onboarding                                                            | SELECT                    | Consolidate verify account             |
| programs     | 1                | ProgramSection                                                                       | SELECT, DELETE            | Standalone – no redundancy             |
| purchases    | 1                | ProgramSection                                                                       | SELECT COUNT              | Standalone – no redundancy             |
| tasks        | 1                | TasksSection                                                                         | SELECT, UPDATE, SUBSCRIBE | Standalone – complex join, appropriate |

---

## 4. Centralization Strategy & Implementation Plan

### 4.1 Recommended Architecture

```
src/
├── services/
│   ├── supabaseDataService.ts          (Main centralized hub)
│   ├── transactionService.ts           (Aggregated transaction logic)
│   ├── campaignService.ts              (Campaign queries & updates)
│   ├── walletService.ts                (Wallet queries)
│   ├── userService.ts                  (User queries & account verification)
│   ├── auditService.ts                 (Audit log queries with user lookup)
│   └── taskService.ts                  (Task queries & realtime)
├── hooks/
│   ├── useTransactionsMetrics.ts       (REPLACES LineChart/TabbedMetricsChart logic)
│   ├── useCampaignsList.ts             (Centralized campaign fetch)
│   ├── useWalletStats.ts               (Wallet balance + earnings)
│   ├── useAccountVerification.ts       (REPLACES Onboarding/SelectAccount logic)
│   ├── useAuditLogs.ts                 (Audit logs with user lookup)
│   └── useUserManagement.ts            (User list, update operations)
```

### 4.2 Phase 1: Critical Redundancy Elimination (HIGH PRIORITY)

#### 1.1 Create `transactionService.ts`

```typescript
// Consolidates LineChart + TabbedMetricsChart logic
export async function fetchTransactionMetrics(
  partnerId: string,
  daysBack: number = 30,
): Promise<AggregatedMetrics> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, created_at")
    .eq("partner_id", partnerId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  // Aggregate in service (not components)
  return aggregateByType(data);
}

// Create hook wrapper for React components
export function useTransactionMetrics(partnerId: string) {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) return;
    fetchTransactionMetrics(partnerId).then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, [partnerId]);

  return { metrics, loading };
}
```

**Impact:** Removes 50+ lines of duplicate aggregation logic; single source of truth for earnings/withdrawals/engagements data.

#### 1.2 Create `useAccountVerification.ts`

```typescript
// Replaces identical logic in SelectAccount.tsx + Onboarding.tsx
export async function verifyAccountType(
  email: string,
  accountType: "partner" | "school" | "teacher",
): Promise<boolean> {
  switch (accountType) {
    case "partner":
      const { data: pdata } = await supabase
        .from("partners")
        .select("id")
        .or(`org_email.eq.${email},email.eq.${email}`)
        .limit(1);
      return !!pdata?.length;

    case "school":
      const { data: sdata } = await supabase
        .from("partners")
        .select("id,partner_type")
        .or(`org_email.eq.${email},email.eq.${email}`)
        .limit(1);
      return (
        !!sdata?.length &&
        ["beneficiary", "school"].includes(sdata[0]?.partner_type)
      );

    case "teacher":
      const { data: tdata } = await supabase
        .from("users")
        .select("id,role,partner_role,email")
        .eq("email", email)
        .limit(1);
      return (
        tdata?.length > 0 &&
        (tdata[0]?.role === "teacher" ||
          tdata[0]?.partner_role?.toLowerCase().includes("teacher"))
      );
  }
  return false;
}

export function useAccountVerification() {
  return { verifyAccountType };
}
```

**Impact:** Single implementation; reduces from ~60 lines × 2 files to ~30 lines in service.

### 4.3 Phase 2: Column Over-Fetch Optimization (MEDIUM PRIORITY)

#### 2.1 Create strict field selection maps

```typescript
// services/campaignService.ts
export const CAMPAIGN_FIELD_SELECTS = {
  dashboard:
    "id,name,status,duration_start,duration_end,partner_id,revenue_projection,target_signups",
  list: "id,name,status,partner_id,duration_start,duration_end,promo_code",
  minimal: "id,name,partner_id,status",
  full: "*",
};

export async function getCampaigns(
  partnerId: string,
  fields: keyof typeof CAMPAIGN_FIELD_SELECTS = "dashboard",
) {
  return supabase
    .from("campaigns")
    .select(CAMPAIGN_FIELD_SELECTS[fields])
    .eq("partner_id", partnerId);
}
```

**Benefit:**

- DashboardSection: Reduce payload by ~15 columns
- PaymentSection: Reduce payload by ~18 columns
- Explicit intent; easier to audit

#### 2.2 Update components to use field-specific queries

```typescript
// Instead of: supabase.from("campaigns").select("*")
// Use: getCampaigns(partnerId, "dashboard")
```

**Impact:** Reduce average response payload by ~30–40% for campaign queries.

### 4.4 Phase 3: Smart Caching & Request Deduplication (ADVANCED)

#### 3.1 Implement request-level deduplication

```typescript
// services/cacheService.ts
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL,
): Promise<T> {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await queryFn();
  queryCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**Usage:**

```typescript
// In SmallCardsGrid or anywhere campaign data is needed
const campaigns = await cachedQuery(
  `campaigns:${partnerId}`,
  () => getCampaigns(partnerId, "list"),
  10 * 60 * 1000, // 10 min cache
);
```

**Impact:** Eliminates duplicate requests within time window; reduces server load.

#### 3.2 Consider React Query (optional but recommended)

```typescript
// hooks/useCampaignsList.ts
export function useCampaignsList(partnerId: string) {
  return useQuery(
    ["campaigns", partnerId],
    () => getCampaigns(partnerId, "list"),
    {
      staleTime: 5 * 60 * 1000, // 5 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
    },
  );
}
```

**Benefits:**

- Automatic deduplication
- Built-in cache management
- Realtime synchronization support
- Background refetching

---

## 5. Detailed Service Suggestions

### 5.1 `supabaseDataService.ts` – Master Index

```typescript
// Re-export all service modules for easy access
export * from "./transactionService";
export * from "./campaignService";
export * from "./walletService";
export * from "./userService";
export * from "./auditService";
export * from "./taskService";

// Types for all responses
export interface TransactionMetrics {
  /* ... */
}
export interface CampaignListItem {
  /* ... */
}
export interface WalletStats {
  /* ... */
}
```

### 5.2 Type Safety Enhancements

```typescript
// services/campaignService.ts
import type { Database } from "../types/database.types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignSelect = Pick<Campaign, "id" | "name" | "partner_id" | "status">;

export async function getCampaigns(
  partnerId: string,
): Promise<CampaignSelect[]> {
  // TypeScript enforces return type
  return supabase
    .from("campaigns")
    .select("id,name,partner_id,status")
    .eq("partner_id", partnerId)
    .then((res) => res.data);
}
```

**Benefit:** Type-safe column selections; compile-time errors for schema changes.

---

## 6. Implementation Priority Roadmap

| Phase                    | Component                                                        | Effort  | Impact                                           | Timeline |
| ------------------------ | ---------------------------------------------------------------- | ------- | ------------------------------------------------ | -------- |
| **PHASE 1 (Immediate)**  |
| 1.1                      | Deduplicate LineChart/TabbedMetricsChart → useTransactionMetrics | 2 hrs   | High (eliminate 2 identical requests)            | Week 1   |
| 1.2                      | Deduplicate Onboarding/SelectAccount → useAccountVerification    | 1.5 hrs | Medium (eliminate duplicate verification)        | Week 1   |
| **PHASE 2 (Short-term)** |
| 2.1                      | Implement field-specific campaign queries                        | 3 hrs   | Medium (reduce payload ~30%)                     | Week 2   |
| 2.2                      | Centralize wallet fetch → useWalletStats                         | 1.5 hrs | Low–Medium (cleanup only)                        | Week 2   |
| 2.3                      | Consolidate audit log fetch → useAuditLogs                       | 2 hrs   | Medium (reduce requests + columns)               | Week 2   |
| **PHASE 3 (Scaling)**    |
| 3.1                      | Implement caching layer                                          | 4 hrs   | High (reduce duplicate requests)                 | Week 3–4 |
| 3.2                      | Migrate to React Query (optional)                                | 8 hrs   | High (modern data management)                    | Week 4–5 |
| 3.3                      | Refactor remaining SELECT \* queries                             | 6 hrs   | Medium (reduce payload, improve maintainability) | Week 5–6 |

---

## 7. Expected Outcomes

### 7.1 Quantified Improvements

| Metric                                 | Before                                                  | After                                          | Gain                      |
| -------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | ------------------------- |
| **Duplicate Queries**                  | 4 critical + 2 partial redundancies                     | 0                                              | 100% elimination          |
| **Average Payload Size (campaigns)**   | ~20 columns × 3 requests = 60 cols/request              | ~8 columns × 1 cached request = 8 cols/request | **~87% reduction**        |
| **Component Code Duplication**         | SelectAccount.tsx ↔ Onboarding.tsx (60 lines identical) | Shared hook (30 lines)                         | **50% reduction**         |
| **Request Count (per dashboard load)** | ~12 requests (4 duplicate)                              | ~8 requests                                    | **33% reduction**         |
| **Maintenance Points**                 | Separate implementations in 2+ files                    | Single service source                          | **Reduced to 1 location** |

### 7.2 Code Quality Improvements

- **Maintainability:** Centralized, single-source-of-truth for all data operations
- **Type Safety:** Strict TypeScript column selection; compile-time validation
- **Performance:** Reduced payload, caching, deduplication
- **Testability:** Services can be unit tested independently
- **Reusability:** Custom hooks can be shared across components

---

## 8. Implementation Example: Transaction Metrics Consolidation

### Before (Current State)

**LineChart.tsx**

```typescript
const [earningsData, setEarningsData] = useState<any[]>([]);
const [withdrawalsData, setWithdrawalsData] = useState<any[]>([]);
const [engagementsData, setEngagementsData] = useState<any[]>([]);

useEffect(() => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  let q = supabase
    .from("transactions")
    .select("id, amount, transaction_type, created_at");
  if (partnerId) q = q.eq("partner_id", partnerId as any);
  const { data } = await q
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  // ... 50 lines of aggregation logic ...
}, [partnerId]);
```

**TabbedMetricsChart.tsx** – Identical 50+ lines

### After (Consolidated)

**hooks/useTransactionMetrics.ts**

```typescript
export function useTransactionMetrics(partnerId: string) {
  const [data, loading, error] = useAsync(
    () => transactionService.fetchMetrics(partnerId),
    [partnerId],
  );
  return {
    earnings: data?.earnings,
    withdrawals: data?.withdrawals,
    engagements: data?.engagements,
    loading,
    error,
  };
}
```

**LineChart.tsx & TabbedMetricsChart.tsx**

```typescript
const { earnings, withdrawals, engagements, loading } =
  useTransactionMetrics(partnerId);

// Render using data from hook
```

**Impact:** 100+ lines eliminated; single source of truth; easier testing.

---

## 9. Files Requiring Changes (Summary)

| File                                           | Change Type                                        | Priority | Notes                                      |
| ---------------------------------------------- | -------------------------------------------------- | -------- | ------------------------------------------ |
| `src/ui/dashboard/LineChart.tsx`               | Refactor to use useTransactionMetrics              | HIGH     | Remove aggregation logic                   |
| `src/ui/dashboard/TabbedMetricsChart.tsx`      | Refactor to use useTransactionMetrics              | HIGH     | Remove aggregation logic (exact duplicate) |
| `src/sections/DashboardSection.tsx`            | Update campaign query to use field select          | MEDIUM   | Replace `select("*")`                      |
| `src/sections/PaymentSection.tsx`              | Update campaign query to use field select          | MEDIUM   | Replace `select("*")`                      |
| `src/sections/UserSection.tsx`                 | Update user/audit_logs queries to use field select | MEDIUM   | Replace `select("*")`                      |
| `src/pages/Onboarding.tsx`                     | Refactor to use useAccountVerification             | HIGH     | Eliminate duplicate logic                  |
| `src/pages/SelectAccount.tsx`                  | Refactor to use useAccountVerification             | HIGH     | Eliminate duplicate logic                  |
| `src/ui/dashboard/RecentActivity.tsx`          | Update to use centralized useAuditLogs             | MEDIUM   | Remove user lookup duplication             |
| `src/ui/dashboard/SmallCardsGrid.tsx`          | Consolidate multiple COUNT calls                   | MEDIUM   | Use aggregation RPC                        |
| `src/sections/TasksSection.tsx`                | No changes (already optimal)                       | NO       | Current implementation is appropriate      |
| **NEW:** `src/services/supabaseDataService.ts` | Create master service hub                          | HIGH     | Central registry                           |
| **NEW:** `src/services/transactionService.ts`  | Create transaction service                         | HIGH     | Consolidate transaction logic              |
| **NEW:** `src/services/campaignService.ts`     | Create campaign service                            | MEDIUM   | Centralize campaign queries                |
| **NEW:** `src/services/userService.ts`         | Create user service                                | MEDIUM   | Centralize user queries                    |
| **NEW:** `src/services/auditService.ts`        | Create audit service                               | MEDIUM   | Centralize audit log queries               |
| **NEW:** `src/hooks/useTransactionMetrics.ts`  | Create metrics hook                                | HIGH     | Replace LineChart/TabbedMetricsChart logic |
| **NEW:** `src/hooks/useAccountVerification.ts` | Create verification hook                           | HIGH     | Replace Onboarding/SelectAccount logic     |
| **NEW:** `src/hooks/useCampaignsList.ts`       | Create campaigns hook                              | MEDIUM   | Centralize campaign fetch                  |
| **NEW:** `src/hooks/useAuditLogs.ts`           | Create audit hook                                  | MEDIUM   | Centralize audit log fetch                 |

---

## 10. Key Recommendations

### 10.1 Use These Utilities/Patterns

1. **Always use field-specific selects** – Never use `select("*")`
2. **Consolidate identical queries** – Immediate wins for LineChart/TabbedMetricsChart, Onboarding/SelectAccount
3. **Cache dashboard data** – Campaigns, wallets, audit logs with TTL
4. **Implement typed service layer** – Use database.types.ts for strict column selection
5. **Consider React Query** – For complex state management (Phase 3)

### 10.2 Avoid These Patterns

1. ❌ Duplicate query logic across files
2. ❌ Using `select("*")` – Over-fetches data
3. ❌ Multiple COUNT calls when aggregation RPC exists
4. ❌ Component-level aggregation – Move to service layer
5. ❌ Hardcoded column lists – Use constants/enums

### 10.3 Future Considerations

- **Real-time sync:** For tasks and audit logs, consider Supabase realtime PostgREST
- **GraphQL vs REST:** If queries become complex, consider GraphQL layer
- **Edge Functions:** For expensive aggregations (dashboard stats), use Edge Functions
- **Monitoring:** Add query performance tracking to identify bottlenecks

---

## 11. Appendix: Quick Reference by Table

### Transactions Table

- **Used by:** LineChart.tsx (DUPLICATE), TabbedMetricsChart.tsx (DUPLICATE), SmallCardsGrid.tsx
- **Consolidation Target:** `useTransactionMetrics()` hook
- **Columns:** id, amount, transaction_type, created_at
- **Redundancy:** CRITICAL – Identical in 2 files

### Campaigns Table

- **Used by:** DashboardSection, PaymentSection, UpcomingCampaigns, CampaignSection, ProgramSection
- **Consolidation Target:** `useCampaignsList()` + field-specific `campaignService`
- **Current Issue:** SELECT \* in 2 places
- **Recommendation:** Field-select map with minimal payload

### Audit Logs Table

- **Used by:** RecentActivity.tsx, UserSection.tsx
- **Consolidation Target:** `useAuditLogs()` hook
- **Current Issue:** Overlapping logic; UserSection fetches redundantly
- **Recommendation:** Single service with user lookup

### Users Table

- **Used by:** SelectAccount, Onboarding, UserSection, RecentActivity (indirectly)
- **Consolidation Target:** `useUserManagement()` + `useAccountVerification()`
- **Current Issue:** Account verification duplicated; SELECT \*
- **Recommendation:** Strict field selection; unified verification

### Wallets Table

- **Used by:** SmallCardsGrid, DashboardSection
- **Consolidation Target:** `useWalletStats()` hook
- **Current Issue:** Could be aggregated into single call
- **Recommendation:** Cache or RPC aggregation

---

**Documentation Version:** 1.0  
**Last Updated:** February 8, 2026  
**Next Review:** After Phase 1 implementation
