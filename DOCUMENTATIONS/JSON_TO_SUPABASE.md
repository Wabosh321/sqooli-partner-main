# JSON TO SUPABASE MIGRATION PLAN

## 1. EXECUTIVE SUMMARY

| Aspect                | Current (JSON)                             | Target (Supabase)                   |
| --------------------- | ------------------------------------------ | ----------------------------------- |
| **Auth**              | JSON + sessionStorage/localStorage         | Supabase Auth (auth.users)          |
| **Business Data**     | Multiple JSON files under `src/auth/data/` | Postgres tables with RLS policies   |
| **Permissions**       | Role + Partner Type hardcoded checks       | RLS policies + role-based filtering |
| **Data Persistence**  | Session-only (in-memory JSON)              | Postgres transactional durability   |
| **Real-time Updates** | None (polling only)                        | Supabase Realtime subscriptions     |
| **Audit Trail**       | Manual audit_logs.json                     | Supabase audit_logs + functions     |
| **Backend APIs**      | None (reads JSON directly)                 | Supabase Functions (Edge/RPC)       |

---

## 2. DATASET → TABLE MAPPING

| JSON File          | Supabase Table           | Primary Key   | Foreign Keys                                                                      | Notes                                                                    |
| ------------------ | ------------------------ | ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| users.json         | auth.users + profiles    | auth.users.id | —                                                                                 | Maps email→auth.users, stores partner_id, role, partner_type in profiles |
| created_users.json | team_members             | id (uuid)     | parent_user_id→profiles.id, partner_id→partners.id                                | Child users created by partner admins                                    |
| campaigns.json     | campaigns                | id (uuid)     | partner_id→partners.id, program_id→programs.id, created_by_user_id→profiles.id    | Campaign definitions, budgets, targets, revenue splits                   |
| programs.json      | programs                 | id (uuid)     | partner_id→partners.id, created_by_user_id→profiles.id                            | Educational/training programs linked to campaigns                        |
| wallets.json       | wallets                  | id (uuid)     | partner_id→partners.id                                                            | Partner wallet balances, account details, earned amounts                 |
| transactions.json  | transactions             | id (uuid)     | partner_id→partners.id, user_id→profiles.id, campaign_id→campaigns.id             | Earnings, withdrawals, splits, status                                    |
| tasks.json         | tasks                    | id (uuid)     | campaign_id→campaigns.id, created_by_user_id→profiles.id, approver_id→profiles.id | Approval workflows, campaign tasks                                       |
| audit_logs.json    | audit_logs               | id (uuid)     | user_id→profiles.id, resource_id (poly), action_type                              | Activity tracking, compliance, user actions                              |
| enrollments.json   | program_enrollments      | id (uuid)     | campaign_id→campaigns.id, program_id→programs.id, user_id→auth_end_users.id       | Student/end-user enrollments, redemptions                                |
| revenue.json       | revenue_splits           | id (uuid)     | campaign_id→campaigns.id, partner_id→partners.id                                  | Revenue distribution tracking per campaign                               |
| user_activity.json | user_activity_log        | id (uuid)     | user_id→profiles.id, parent_user_id→profiles.id                                   | Team member activity tracking                                            |
| user_metrics.json  | user_performance_metrics | id (uuid)     | user_id→profiles.id, parent_user_id→profiles.id                                   | KPIs, earnings, task completions, performance scores                     |

---

## 3. PROPOSED SUPABASE SCHEMA

### 3.1 AUTHENTICATION & PROFILES

```
TABLE: auth.users (Supabase managed)
├─ id (uuid, PK)
├─ email (text, unique)
├─ encrypted_password (text)
├─ created_at (timestamp)
├─ last_sign_in_at (timestamp)

TABLE: profiles (auth.users extension)
├─ id (uuid, PK, FK→auth.users.id)
├─ email (text)
├─ full_name (text)
├─ partner_id (uuid, FK→partners.id)
├─ role (enum: super_admin, admin_partner, partner_member, team_member, etc.)
├─ partner_type (enum: affiliate, media, corporate, institutional)
├─ access_level (int, 0-100)
├─ permissions (jsonb, array of permission objects)
├─ parent_user_id (uuid, FK→profiles.id, nullable) [for child/team members]
├─ is_first_login (boolean)
├─ is_active (boolean)
├─ created_at (timestamp)
├─ updated_at (timestamp)
```

### 3.2 PARTNERS & ORGANIZATION

```
TABLE: partners
├─ id (uuid, PK)
├─ org_name (text)
├─ partner_type (enum: affiliate, media, corporate, institutional)
├─ access_level (int, 0-100)
├─ commission_rate (numeric)
├─ onboarding_completed (boolean)
├─ created_at (timestamp)
├─ updated_at (timestamp)

TABLE: team_members
├─ id (uuid, PK)
├─ parent_user_id (uuid, FK→profiles.id)
├─ partner_id (uuid, FK→partners.id)
├─ email (text, unique)
├─ full_name (text)
├─ role (enum: team_member, campaign_manager, accountant, etc.)
├─ partner_type (enum)
├─ access_level (int, 0-100)
├─ permissions (jsonb)
├─ is_active (boolean)
├─ created_by (uuid, FK→profiles.id)
├─ created_at (timestamp)
├─ updated_at (timestamp)
```

### 3.3 CAMPAIGNS & PROGRAMS

```
TABLE: campaigns
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id)
├─ program_id (uuid, FK→programs.id, nullable)
├─ created_by_user_id (uuid, FK→profiles.id)
├─ created_by_user_role (text)
├─ name (text)
├─ promo_code (text, unique)
├─ status (enum: active, inactive, expired, draft)
├─ duration_start (timestamp)
├─ duration_end (timestamp)
├─ budget (numeric)
├─ spent (numeric)
├─ revenue_projection (numeric)
├─ target_signups (int)
├─ daily_target (int)
├─ whatsapp_number (text, nullable)
├─ bundled_offers (jsonb: {min_lessons, total_price})
├─ discount_rule (jsonb: {price_per_lesson})
├─ revenue_share (jsonb: {partner_percentage, sqooli_percentage})
├─ created_at (timestamp)
├─ updated_at (timestamp)

TABLE: programs
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id)
├─ created_by_user_id (uuid, FK→profiles.id)
├─ name (text)
├─ description (text)
├─ status (enum: active, inactive, archived)
├─ created_at (timestamp)
├─ end_date (timestamp, nullable)
├─ updated_at (timestamp)
```

### 3.4 WALLETS & TRANSACTIONS

```
TABLE: wallets
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id, unique)
├─ balance (numeric, default 0)
├─ total_earned (numeric, default 0)
├─ paybill_number (text)
├─ account_number (text)
├─ currency (enum: KES, USD, etc.)
├─ created_at (timestamp)
├─ updated_at (timestamp)

TABLE: transactions
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id)
├─ user_id (uuid, FK→profiles.id, nullable)
├─ campaign_id (uuid, FK→campaigns.id, nullable)
├─ transaction_type (enum: earning, withdrawal, refund, adjustment)
├─ amount (numeric)
├─ status (enum: verified, completed, pending, processing, failed, rejected, cancelled)
├─ mpesa_code (text, nullable)
├─ created_at (timestamp)
├─ verified_at (timestamp, nullable)
├─ updated_at (timestamp)

TABLE: withdrawals (normalized from transactions)
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id)
├─ reference_number (text, unique)
├─ withdrawal_method (enum: mpesa, bank, paybill)
├─ amount (numeric)
├─ destination_details (jsonb: {account_number, bank_name})
├─ mpesa_receipt (text, nullable)
├─ status (enum: verified, completed, pending, processing, failed, rejected)
├─ processed_at (timestamp, nullable)
├─ requested_at (timestamp)
├─ created_at (timestamp)
```

### 3.5 PROGRAMS & ENROLLMENTS

```
TABLE: program_enrollments
├─ id (uuid, PK)
├─ campaign_id (uuid, FK→campaigns.id)
├─ program_id (uuid, FK→programs.id)
├─ user_id (uuid, FK→auth_end_users.id) [external end-users, not partners]
├─ status (enum: redeemed, pending, enrolled, completed)
├─ enrollment_date (timestamp)
├─ redemption_date (timestamp, nullable)
├─ created_at (timestamp)
├─ updated_at (timestamp)

TABLE: auth_end_users (separate from partner profiles)
├─ id (uuid, PK) [or external ID if not Supabase Auth users]
├─ phone_number (text, nullable)
├─ name (text, nullable)
├─ enrollment_date (timestamp)
├─ created_at (timestamp)
```

### 3.6 REVENUE & ACCOUNTING

```
TABLE: revenue_splits
├─ id (uuid, PK)
├─ campaign_id (uuid, FK→campaigns.id)
├─ partner_id (uuid, FK→partners.id)
├─ amount (numeric)
├─ transaction_type (enum: enrollment, referral, bonus, adjustment)
├─ split_timestamp (timestamp)
├─ created_at (timestamp)

TABLE: financial_reports (summary tables for analytics)
├─ id (uuid, PK)
├─ partner_id (uuid, FK→partners.id)
├─ period_month (int)
├─ period_year (int)
├─ total_revenue (numeric)
├─ total_expenses (numeric)
├─ net_profit (numeric)
├─ created_at (timestamp)
```

### 3.7 TASKS & WORKFLOWS

```
TABLE: tasks
├─ id (uuid, PK)
├─ campaign_id (uuid, FK→campaigns.id)
├─ created_by_user_id (uuid, FK→profiles.id)
├─ approver_id (uuid, FK→profiles.id, nullable)
├─ task_name (text)
├─ status (enum: pending, approved, rejected, completed)
├─ reference_no (text, unique)
├─ description (text)
├─ channel (text, nullable)
├─ sub_channel (text, nullable)
├─ date_created (timestamp)
├─ completed_at (timestamp, nullable)
├─ created_at (timestamp)
├─ updated_at (timestamp)
```

### 3.8 AUDIT & ACTIVITY LOGS

```
TABLE: audit_logs
├─ id (uuid, PK)
├─ user_id (uuid, FK→profiles.id, nullable)
├─ action (text) [human-readable description]
├─ action_type (enum: create, update, delete, view, export, etc.)
├─ resource_type (text) [campaigns, wallets, users, etc.]
├─ resource_id (text, nullable) [polymorphic ref]
├─ changes (jsonb, nullable) [old vs new values]
├─ ip_address (inet, nullable)
├─ user_agent (text, nullable)
├─ created_at (timestamp)

TABLE: user_activity_log
├─ id (uuid, PK)
├─ user_id (uuid, FK→profiles.id)
├─ parent_user_id (uuid, FK→profiles.id, nullable)
├─ action (text)
├─ action_type (enum: campaign_creation, campaign_update, report_generation, withdrawal_request, etc.)
├─ details (text, nullable)
├─ timestamp (timestamp)
├─ created_at (timestamp)

TABLE: user_performance_metrics
├─ id (uuid, PK)
├─ user_id (uuid, FK→profiles.id)
├─ parent_user_id (uuid, FK→profiles.id, nullable)
├─ total_campaigns (int, default 0)
├─ active_campaigns (int, default 0)
├─ total_earnings (numeric, default 0)
├─ pending_withdrawals (numeric, default 0)
├─ completed_withdrawals (numeric, default 0)
├─ engagements (int, default 0)
├─ tasks_completed (int, default 0)
├─ performance_score (int, 0-100)
├─ last_activity (timestamp, nullable)
├─ created_at (timestamp)
├─ updated_at (timestamp)
```

---

## 4. AUTH & IDENTITY MODEL

### 4.1 Current JSON Structure (to Supabase)

**users.json → auth.users + profiles:**

- Each user in `users.json` has email, password, role, partner_type, access_level
- Password verification occurs via JSON comparison (insecure)
- sessionStorage stores auth_user + auth_token

**Migration Strategy:**

1. Create auth.users entries via Supabase Auth API (secure password hashing)
2. Create profiles records with partner_id, role, partner_type, permissions
3. Drop JSON-based password comparison entirely
4. Move sessionStorage to Supabase session management

**created_users.json → team_members + profiles:**

- Child users created by partner admins
- parent_user_id links to creating admin
- Maps to team_members table + entry in profiles with parent reference

### 4.2 Linkage Strategy

```
auth.users (Supabase managed)
    ↓
profiles (user + partner metadata)
    ├─ partner_id → partners.id
    └─ parent_user_id → profiles.id (for hierarchy)

team_members (optional denormalization for child users)
    ├─ parent_user_id → profiles.id
    └─ partner_id → partners.id
```

### 4.3 Role & Permission Storage

**Approach 1 (Recommended):** Store in profiles.permissions (jsonb)

```json
{
  "permissions": [
    { "category": "campaigns", "level": "full" },
    { "category": "wallet", "level": "full" },
    { "category": "reports", "level": "view" }
  ]
}
```

**Approach 2:** Separate permission_grants table

```
TABLE: permission_grants
├─ id (uuid, PK)
├─ profile_id (uuid, FK→profiles.id)
├─ category (text)
├─ level (enum: read, write, admin, full)
├─ created_at (timestamp)
```

**Recommendation:** Use Approach 1 (JSONB) for initial phase to reduce joins; migrate to Approach 2 if permission matrix becomes complex.

---

## 5. ROW LEVEL SECURITY (RLS)

### 5.1 RLS Policy Matrix

| Table                        | SELECT                           | INSERT                         | UPDATE                          | DELETE      |
| ---------------------------- | -------------------------------- | ------------------------------ | ------------------------------- | ----------- |
| **profiles**                 | Self only, or admin              | Super admin only               | Self (limited fields), or admin | Admin only  |
| **team_members**             | Admin + hierarchy, self          | Admin of partner               | Admin + hierarchy               | Admin only  |
| **partners**                 | Admin of partner, self           | Super admin                    | Admin of partner                | Super admin |
| **campaigns**                | Admin + partner members          | Admin of partner               | Admin + partner members         | Admin only  |
| **programs**                 | Admin + partner members          | Admin of partner               | Admin + partner members         | Admin only  |
| **wallets**                  | Admin of partner                 | System function only           | System function only            | Never       |
| **transactions**             | Admin of partner + self          | System function only           | Admin only                      | Never       |
| **withdrawals**              | Admin of partner                 | System function only           | Admin only                      | Never       |
| **tasks**                    | Creator, approver, partner admin | Partner admin + campaign owner | Creator, approver, admin        | Admin only  |
| **program_enrollments**      | End-user + partner admin         | Partner workflow               | Admin only                      | Never       |
| **audit_logs**               | Admin only, compliance staff     | System function only           | Never                           | Never       |
| **user_activity_log**        | Self, parent, admin              | System function only           | Never                           | Audit only  |
| **user_performance_metrics** | Self, parent, admin              | System function only           | Admin only                      | Never       |

### 5.2 Key RLS Policies (SQL Sketches)

**profiles (SELECT - own record or admin):**

```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can view partner members"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE partner_id = profiles.partner_id AND role ILIKE '%admin%'
    )
  );
```

**campaigns (SELECT - own partner campaigns):**

```sql
CREATE POLICY "Partner members can view own campaigns"
  ON campaigns FOR SELECT
  USING (
    partner_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin(auth.uid())
  );
```

**wallets (SELECT - partner admin only):**

```sql
CREATE POLICY "Partner admin can view own wallet"
  ON wallets FOR SELECT
  USING (
    partner_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) ILIKE '%admin%'
  );
```

**transactions (SELECT - partner + self):**

```sql
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR partner_id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin(auth.uid())
  );
```

**audit_logs (SELECT - admin/compliance only):**

```sql
CREATE POLICY "Admin and compliance can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    is_super_admin(auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'compliance_officer'
  );
```

### 5.3 Helper Functions for RLS

```sql
CREATE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT role = 'super_admin' FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION can_manage_partner(user_id uuid, target_partner_id uuid)
RETURNS boolean AS $$
  SELECT
    is_super_admin(user_id)
    OR (
      partner_id = target_partner_id
      AND role ILIKE '%admin%'
      FROM profiles WHERE id = user_id
    );
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_user_partner_id(user_id uuid)
RETURNS uuid AS $$
  SELECT partner_id FROM profiles WHERE id = user_id LIMIT 1;
$$ LANGUAGE SQL STABLE;
```

---

## 6. SUPABASE FUNCTIONS (EDGE / RPC)

### 6.1 Required Functions

#### A. User Onboarding

**Function:** `rpc_onboard_partner_user()`

- **Purpose:** Create partner + initial admin user + profile + wallet
- **Inputs:**
  - org_name (text)
  - email (text)
  - full_name (text)
  - partner_type (enum)
  - phone (text)
  - password (text)
- **Outputs:** {success, user_id, partner_id, message}
- **Security:** Service Role (from backend only), inserts to auth.users + profiles + partners + wallets
- **Idempotency:** Check email existence first

#### B. Team Member Creation

**Function:** `rpc_create_team_member()`

- **Purpose:** Partner admin creates sub-user with granular permissions
- **Inputs:**
  - email (text)
  - full_name (text)
  - role (enum)
  - permissions (jsonb)
  - access_level (int)
- **Outputs:** {success, user_id, message}
- **Security:** Row-based (requester must be partner admin)
- **Behavior:** Creates profile + team_members + temporary password email

#### C. Campaign Creation & Approval Workflow

**Function:** `rpc_create_campaign()`

- **Purpose:** Create campaign with validation, auto-assign to programs
- **Inputs:**
  - name, promo_code, budget, target_signups, bundled_offers, revenue_share (jsonb), etc.
- **Outputs:** {success, campaign_id, message}
- **Security:** Partner admin only
- **Audit:** Auto-log to audit_logs

**Function:** `rpc_approve_task()`

- **Purpose:** Approver marks task (campaign approval) as approved → campaign status → active
- **Inputs:**
  - task_id (uuid)
  - approver_notes (text)
- **Outputs:** {success, campaign_id, message}
- **Security:** Approver user only
- **Audit:** Log to audit_logs + update tasks.status

#### D. Wallet Operations

**Function:** `rpc_request_withdrawal()`

- **Purpose:** Create withdrawal request, validate balance, emit audit
- **Inputs:**
  - partner_id (uuid)
  - amount (numeric)
  - method (enum: mpesa, bank, paybill)
  - destination_details (jsonb)
- **Outputs:** {success, withdrawal_id, message}
- **Security:** Partner admin only (checks balance)
- **Behavior:** Create withdrawals record, lock amount, log action

**Function:** `rpc_process_withdrawal()`

- **Purpose:** Super admin / Finance team processes payment
- **Inputs:**
  - withdrawal_id (uuid)
  - mpesa_receipt (text, nullable)
  - status (enum)
- **Outputs:** {success, message}
- **Security:** Finance role only
- **Behavior:** Update withdrawal.status, debit wallet.balance, audit log

**Function:** `rpc_record_transaction()`

- **Purpose:** Internal: record campaign earning, enrollment, or adjustment
- **Inputs:**
  - partner_id, user_id, campaign_id, transaction_type, amount, mpesa_code
- **Outputs:** {success, transaction_id, message}
- **Security:** Backend service role only (called from campaign hooks)
- **Behavior:** Insert transaction, update wallet.balance, check for auto-withdrawal eligibility

#### E. Revenue Splits

**Function:** `rpc_distribute_revenue()`

- **Purpose:** Post-enrollment: compute split per campaign rules, log to revenue_splits
- **Inputs:**
  - campaign_id (uuid)
  - total_amount (numeric)
- **Outputs:** {success, partner_share, sqooli_share, message}
- **Security:** Backend service role
- **Behavior:** Calculate per campaign.revenue_share, insert to revenue_splits + transactions (for both sides)

#### F. Audit & Activity Logging

**Function:** `rpc_log_audit_event()`

- **Purpose:** Generic audit logger
- **Inputs:**
  - action_type (enum)
  - resource_type (text)
  - resource_id (text)
  - changes (jsonb, optional)
  - ip_address (inet, optional)
- **Outputs:** {success, log_id, message}
- **Security:** Any authenticated user (auto-inserts current user_id)
- **Behavior:** Append to audit_logs with immutable flag

**Function:** `rpc_log_user_activity()`

- **Purpose:** Team member activity tracker
- **Inputs:**
  - action, action_type, details (text)
- **Outputs:** {success, activity_id}
- **Security:** Any authenticated user
- **Behavior:** Insert to user_activity_log, update user_performance_metrics.last_activity

#### G. Metrics & Analytics (Hourly)

**Function:** `rpc_refresh_user_metrics()`

- **Purpose:** Recalculate user KPIs (run on schedule)
- **Inputs:**
  - user_id (uuid, optional; NULL = all users)
- **Outputs:** {success, updated_count, message}
- **Security:** Backend service role
- **Behavior:**
  - COUNT total_campaigns (partner_id matches)
  - SUM earnings from transactions
  - SUM pending/completed withdrawals
  - COUNT tasks_completed
  - Calculate performance_score (engagement heuristic)
  - Update user_performance_metrics

**Function:** `rpc_compute_financial_summary()`

- **Purpose:** Monthly financial report (partner ROI, trends)
- **Inputs:**
  - partner_id (uuid)
  - month (int)
  - year (int)
- **Outputs:** {total_revenue, total_expenses, net_profit}
- **Security:** Partner admin + finance
- **Behavior:** Query transactions, revenue_splits, expenses; insert to financial_reports

---

## 7. REALTIME & SUBSCRIPTIONS

### 7.1 Tables Requiring Realtime

| Table                        | Subscription                              | Reason                                      |
| ---------------------------- | ----------------------------------------- | ------------------------------------------- |
| **transactions**             | `partner_id = X`                          | Partner admins need live earnings update    |
| **tasks**                    | `campaign_id = X` OR `approver_id = uid`  | Approvers notified of pending approvals     |
| **campaigns**                | `partner_id = X`                          | Campaign status changes (active→paused)     |
| **audit_logs**               | `user_id = uid` (self) + admin channel    | Activity feed, compliance audit trail       |
| **user_activity_log**        | `parent_user_id = uid` OR `user_id = uid` | Parent sees child user actions in real-time |
| **user_performance_metrics** | `user_id = uid` OR `parent_user_id = uid` | Live KPI dashboard                          |
| **withdrawals**              | `partner_id = X`                          | Status updates (pending→processed)          |

### 7.2 Subscription Patterns (Frontend)

```typescript
// Listen to own transactions
const { data, status } = useSubscription({
  table: "transactions",
  filter: `partner_id=eq.${partnerId}`,
  event: "*",
});

// Listen to team member activities
const { data: activities } = useSubscription({
  table: "user_activity_log",
  filter: `parent_user_id=eq.${userId}`,
  event: "INSERT",
});

// Listen to task approvals
const { data: tasks } = useSubscription({
  table: "tasks",
  filter: `approver_id=eq.${userId}`,
  event: "*",
});
```

---

## 8. FRONTEND FILE IMPACT ANALYSIS

| File Path                                           | Current Source                                              | Required Change                                                                                  | Type     | Priority |
| --------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | -------- |
| **src/auth/handleJsonAuth.ts**                      | JSON + sessionStorage                                       | Replace with Supabase.auth.signInWithPassword()                                                  | Rewrite  | 🔴 P0    |
| **src/hooks/useAuth.ts**                            | JSON user state                                             | Use supabase.auth.onAuthStateChanged()                                                           | Rewrite  | 🔴 P0    |
| **src/pages/SignIn.tsx**                            | handleJsonSignIn()                                          | supabase.auth.signInWithPassword()                                                               | Update   | 🔴 P0    |
| **src/pages/SignUp.tsx**                            | handleJsonSignUp()                                          | supabase.auth.signUp() + rpc_onboard_partner_user()                                              | Rewrite  | 🔴 P0    |
| **src/hooks/usePartnerPermissions.ts**              | Hardcoded PERMISSIONS_BY_PARTNER_TYPE                       | Query profiles.permissions (RLS secured)                                                         | Rewrite  | 🔴 P0    |
| **src/hooks/usePartnerAccess.ts**                   | JSON user properties                                        | Query profiles + partners + RLS                                                                  | Rewrite  | 🔴 P0    |
| **src/context/PermissionContext.tsx**               | Static permission maps                                      | Dynamic fetch from profiles.permissions                                                          | Update   | 🔴 P0    |
| **src/ui/dashboard/WalletBalanceCard.tsx**          | walletsData JSON import                                     | useQuery(wallets, {partner_id=X})                                                                | Update   | 🔴 P0    |
| **src/ui/dashboard/UpcomingCampaigns.tsx**          | campaignsData JSON import                                   | useQuery(campaigns, {partner_id=X})                                                              | Update   | 🔴 P0    |
| **src/ui/dashboard/SmallCardsGrid.tsx**             | JSON imports (campaigns, wallets, transactions)             | Multiple useQuery hooks                                                                          | Update   | 🔴 P0    |
| **src/ui/dashboard/RecentActivity.tsx**             | JSON imports (user_activity, created_users)                 | useSubscription(user_activity_log, parent_user_id=X)                                             | Update   | 🔴 P0    |
| **src/ui/dashboard/LineChart.tsx**                  | transactionsData JSON import                                | useQuery(transactions, {partner_id=X})                                                           | Update   | 🔴 P0    |
| **src/ui/dashboard/TabbedMetricsChart.tsx**         | transactionsData JSON import                                | useQuery(transactions)                                                                           | Update   | 🔴 P0    |
| **src/ui/campaign/components/CampaignTable.tsx**    | programsData JSON import                                    | useQuery(programs, {partner_id=X})                                                               | Update   | 🔴 P0    |
| **src/sections/CampaignSection.tsx**                | campaignsData JSON                                          | useQuery(campaigns, {partner_id=X}) + rpc_create_campaign()                                      | Rewrite  | 🔴 P0    |
| **src/sections/UserSection.tsx**                    | created_users JSON + user_activity JSON + user_metrics JSON | useQuery(team_members) + useSubscription(user_activity_log) + useQuery(user_performance_metrics) | Rewrite  | 🔴 P0    |
| **src/sections/WalletSection.tsx**                  | walletsData + transactionsData JSON                         | useQuery(wallets) + useQuery(transactions) + rpc_request_withdrawal()                            | Rewrite  | 🔴 P0    |
| **src/sections/TasksSection.tsx**                   | tasksData JSON + campaignsData JSON                         | useQuery(tasks) + useQuery(campaigns) + rpc_approve_task()                                       | Update   | 🔴 P0    |
| **src/sections/ReportsSection.tsx**                 | campaignsData JSON                                          | useQuery(campaigns) + computed aggregations                                                      | Update   | 🔴 P0    |
| **src/sections/ProgramSection.tsx**                 | programsData JSON                                           | useQuery(programs) + rpc_create_program()                                                        | Update   | 🔴 P0    |
| **src/sections/SettingsSection.tsx**                | Static config                                               | useQuery(profiles) + mutation handlers                                                           | Update   | 🟡 P1    |
| **src/sections/DashboardSection.tsx**               | Multiple JSON sources                                       | Delegate to dashboard UI components                                                              | Review   | 🟢 P2    |
| **src/infrastructure/wallet/wallet.service.ts**     | Skeleton (Supabase ready)                                   | Complete fetchTransactions(), fetchWithdrawals()                                                 | Complete | 🔴 P0    |
| **src/infrastructure/campaign/campaign.service.ts** | Skeleton (Supabase ready)                                   | Complete with create, update, delete, list                                                       | Complete | 🔴 P0    |
| **src/components/layout/Header.tsx**                | JSON + local state                                          | Use supabase.auth.signOut() [already present]                                                    | Verify   | 🟢 P2    |

---

## 9. MIGRATION SEQUENCE (SAFE ORDER)

### PHASE 1: AUTH & FOUNDATION (Week 1)

**Goals:** Supabase Auth is single source of truth; profiles + roles loaded dynamically

**Tasks:**

1. **Enable Supabase Auth in project** (if not enabled)
2. **Create profiles table** with (id, email, full_name, partner_id, role, partner_type, access_level, permissions, parent_user_id, is_active)
3. **Create partners table** with (id, org_name, partner_type, access_level, commission_rate)
4. **Create team_members table** (denormalization of child profiles)
5. **Enable RLS** on profiles, partners, team_members
6. **Rewrite src/auth/handleJsonAuth.ts** → `supabaseSignInWithPassword()` + store auth session
7. **Rewrite src/hooks/useAuth.ts** → use `supabase.auth.onAuthStateChanged()`
8. **Update src/pages/SignIn.tsx** → call `supabaseSignInWithPassword()`
9. **Test auth flow** (sign-in, session persistence, sign-out)
10. **Disable JSON login** (console error if fallback triggered)

**Validation:**

- ✅ Login works with Supabase Auth credentials
- ✅ Session persists across page refresh
- ✅ RLS prevents unauthorized profile access

---

### PHASE 2: CORE TABLES & PERMISSIONS (Week 2)

**Goals:** All business data in Postgres; permissions enforced via RLS

**Tasks:**

1. **Create campaigns, programs, wallets, transactions tables**
2. **Create audit_logs, user_activity_log, user_performance_metrics tables**
3. **Enable RLS on all data tables** (campaigns, programs, wallets, transactions, etc.)
4. **Rewrite src/hooks/usePartnerPermissions.ts** → fetch from profiles.permissions (RLS guarded)
5. **Rewrite src/hooks/usePartnerAccess.ts** → query partners + profiles
6. **Update src/context/PermissionContext.tsx** → dynamic permission fetch
7. **Create Supabase Functions:**
   - rpc_create_campaign()
   - rpc_onboard_partner_user()
   - rpc_log_audit_event()
8. **Migrate JSON data** (users, campaigns, programs) into Postgres using seed scripts
9. **Test RLS** (confirm admins see own partner data only)

**Validation:**

- ✅ Dashboard queries return data via Supabase (no JSON)
- ✅ Team member cannot see other partner campaigns
- ✅ Audit trail logs all user actions

---

### PHASE 3: WALLETS & TRANSACTIONS (Week 3)

**Goals:** Wallet operations fully Supabase-backed; withdrawal workflow functional

**Tasks:**

1. **Create wallets, transactions, withdrawals tables** (if not in Phase 2)
2. **Complete src/infrastructure/wallet/wallet.service.ts:**
   - fetchCampaigns() ✓ (already has Supabase call)
   - fetchTransactions() ✓ (complete)
   - fetchWithdrawals() (handle missing table gracefully)
3. **Update src/ui/dashboard/WalletBalanceCard.tsx** → useQuery(wallets)
4. **Update src/ui/dashboard/SmallCardsGrid.tsx** → useQuery for campaigns, transactions
5. **Rewrite src/sections/WalletSection.tsx:**
   - useQuery(wallets) + useQuery(transactions)
   - rpc_request_withdrawal() button handler
6. **Create Supabase Functions:**
   - rpc_record_transaction(partner_id, amount, type)
   - rpc_request_withdrawal(partner_id, amount, method, details)
   - rpc_process_withdrawal() [admin only]
7. **Test withdrawal flow** (request → pending → processed)

**Validation:**

- ✅ Wallet balance updates after enrollment
- ✅ Withdrawal request creates record with pending status
- ✅ Admin can process withdrawal → balance decrements

---

### PHASE 4: FEATURES & REALTIME (Week 4)

**Goals:** CRUD UIs enabled for campaigns, programs, team; real-time updates active

**Tasks:**

1. **Enable Realtime** on: transactions, tasks, campaigns, user_activity_log
2. **Update src/sections/CampaignSection.tsx:**
   - useQuery(campaigns, {partner_id})
   - useSubscription(campaigns) for status updates
   - Enable "Create Campaign" button → rpc_create_campaign()
3. **Update src/sections/ProgramSection.tsx:**
   - useQuery(programs, {partner_id})
   - Enable "Create Program" button → rpc_create_program()
4. **Update src/sections/UserSection.tsx:**
   - useQuery(team_members, {partner_id})
   - useSubscription(user_activity_log, {parent_user_id})
   - Enable "Create Team Member" button → rpc_create_team_member()
5. **Update src/sections/TasksSection.tsx:**
   - useQuery(tasks, {campaign_id | approver_id})
   - rpc_approve_task() button handler
   - useSubscription(tasks) for status updates
6. **Update src/sections/ReportsSection.tsx:**
   - useQuery(campaigns) → compute aggregations
   - useQuery(revenue_splits) for revenue breakdown
7. **Create Supabase Functions:**
   - rpc_create_program()
   - rpc_create_team_member()
   - rpc_approve_task()
8. **Test real-time updates** (open 2 browsers → action in 1 → appears in 2)

**Validation:**

- ✅ Campaign creation works and broadcasts to all connected users
- ✅ Task approval updates campaign status in real-time
- ✅ Team member activity visible to parent in real-time dashboard

---

### PHASE 5: CLEANUP & DEPRECATION (Week 5)

**Goals:** JSON files deleted, legacy utilities removed, monitoring in place

**Tasks:**

1. **Remove JSON imports** from all .tsx files (verified no remaining imports via grep)
2. **Delete JSON data files:**
   - src/auth/data/\*.json (all 12 files)
   - data/\*.json (root-level backups)
3. **Delete or stub out:**
   - src/auth/handleJsonAuth.ts (or convert to legacy fallback)
   - Legacy utility files that only read JSON
4. **Update Constants.ts** to reference Supabase tables instead of JSON arrays
5. **Set up monitoring:**
   - Alert if JSON files re-imported
   - Log all failed RLS checks
   - Monitor audit_logs table for compliance
6. **Disable demo mode** in components (remove toast.error messages about "demo data")
7. **Run full regression test** (all user flows)
8. **Deploy to production** with rollback plan

**Validation:**

- ✅ No JSON files in src/
- ✅ TypeScript compilation clean (no unused imports)
- ✅ All CRUD operations functional with Supabase backend

---

## 10. ENVIRONMENT & CONFIG UPDATES

### 10.1 .env.local (Frontend)

**Current:**

```dotenv
VITE_SUPABASE_URL=https://heqsfgmrosuupxahdtda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
DEBUG=true
```

**No changes required** (keys already present). Ensure:

- VITE_SUPABASE_URL is reachable
- VITE_SUPABASE_ANON_KEY has auth scope
- Feature flag for JSON fallback removed (safe to delete)

### 10.2 .env (Backend / Service Role)

**Add if not present:**

```dotenv
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # For backend functions
SUPABASE_URL=https://heqsfgmrosuupxahdtda.supabase.co
```

**⚠️ NEVER commit SERVICE_ROLE_KEY to git**

### 10.3 Supabase Project Settings

**Verify in Supabase Dashboard:**

- ✅ RLS enabled on all tables
- ✅ Auth providers: Email/Password enabled
- ✅ Realtime enabled on relevant tables
- ✅ Backup enabled (daily)
- ✅ SSL enforced for all connections
- ✅ JWT secret configured (auto-set by Supabase)

### 10.4 Feature Flags (if using)

**Recommended flags for gradual rollout:**

```typescript
const FEATURE_FLAGS = {
  useSupabaseAuth: true, // ✓ Phase 1 complete
  useSupabaseData: true, // ✓ Phase 2 complete
  enableWalletRPC: true, // ✓ Phase 3 complete
  enableRealtime: true, // ✓ Phase 4 complete
  disableJsonFallback: true, // ✓ Phase 5 complete
};
```

---

## 11. DEPRECATION LIST

### 11.1 Files to Delete

```
src/auth/data/
├─ users.json                    ❌
├─ created_users.json            ❌
├─ campaigns.json                ❌
├─ programs.json                 ❌
├─ wallets.json                  ❌
├─ transactions.json             ❌
├─ tasks.json                    ❌
├─ audit_logs.json               ❌
├─ enrollments.json              ❌
├─ revenue.json                  ❌
├─ user_activity.json            ❌
└─ user_metrics.json             ❌

data/
├─ _import_summary.json          ❌
├─ _export_summary.json          ❌
├─ campaigns.json                ❌
├─ partners.json                 ❌
├─ users.json                    ❌
├─ wallets.json                  ❌
├─ transactions.json             ❌
└─ audit_logs.json               ❌
```

### 11.2 Utilities to Remove or Rewrite

| Utility                                | Action | Reason                              |
| -------------------------------------- | ------ | ----------------------------------- |
| src/auth/handleJsonAuth.ts             | Delete | Replaced by supabase.auth API       |
| JSON-based imports in UI files         | Remove | Replaced by useQuery() hooks        |
| getJsonAuthUser()                      | Delete | Replaced by supabase.auth.getUser() |
| isJsonAuthenticated()                  | Delete | Replaced by session check           |
| Local sessionStorage "auth_user" logic | Remove | Supabase manages session cookies    |

### 11.3 TypeScript Interfaces to Update

**Interfaces that can be simplified (auth now Supabase):**

- `JsonUser` → remove, use `User` from `@supabase/supabase-js`
- `SignInResult` → remove, use Supabase response types
- Any JSON-shaped interfaces → replace with database schema inferred types

**Keep (still in use):**

- `PartnerType`, `PartnerRole` (domain logic)
- `Campaign`, `Transaction` (domain types)
- `UsePartnerPermissionsReturn` (hook interface, now queries Postgres)

---

## 12. IMPLEMENTATION NOTES

### 12.1 Data Seed Strategy

1. **Create Seed Script** (TypeScript + Supabase Admin SDK):

   ```typescript
   // scripts/seed.ts
   import { createClient } from "@supabase/supabase-js";
   import usersData from "../src/auth/data/users.json";
   import campaignsData from "../src/auth/data/campaigns.json";

   const supabase = createClient(URL, SERVICE_ROLE_KEY);

   // Iterate usersData.users → insert into profiles
   // Iterate campaignsData.campaigns → insert into campaigns
   ```

2. **Run once before Phase 2:**

   ```bash
   npx ts-node scripts/seed.ts
   ```

3. **Verify:**
   - All records inserted
   - No duplicates
   - Foreign keys valid

### 12.2 Testing Checklist

- [ ] Auth flow (sign-in, sign-up, sign-out)
- [ ] Dashboard loads campaign data via Supabase
- [ ] Partner admin sees only own campaigns
- [ ] Team member sees limited campaigns (based on permissions)
- [ ] Wallet balance updates in real-time after transaction
- [ ] Withdrawal request creates task for approval
- [ ] Audit logs record all user actions
- [ ] RLS rejects unauthorized queries
- [ ] Real-time subscriptions fire on data changes
- [ ] Mobile responsiveness maintained

### 12.3 Monitoring & Logging

**Set up Supabase Logs:**

- Monitor auth failures (suspicious sign-in attempts)
- Monitor RLS violations (unexpected auth errors)
- Monitor function errors (rpc\_\* failures)

**Frontend error tracking:**

- Log all Supabase errors to error tracking service (Sentry, LogRocket)
- Alert on schema migration failures

### 12.4 Rollback Plan

If Supabase unavailable or data corrupted:

1. Revert to JSON fallback (feature flag)
2. Serve cached data from localStorage
3. Queue write operations for sync once restored
4. Alert users of limited functionality

---

## 13. QUICK REFERENCE: BEFORE → AFTER CODE PATTERNS

### Pattern 1: Auth

**Before:**

```typescript
import { handleJsonSignIn } from "../auth/handleJsonAuth";
const result = await handleJsonSignIn(email, password);
```

**After:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

---

### Pattern 2: Data Queries

**Before:**

```typescript
import campaignsData from "../auth/data/campaigns.json";
const campaigns = campaignsData.campaigns.filter(
  (c) => c.partner_id === partnerId,
);
```

**After:**

```typescript
const { data: campaigns, error } = await supabase
  .from("campaigns")
  .select("*")
  .eq("partner_id", partnerId);
```

---

### Pattern 3: Real-time Subscriptions

**Before:**

```typescript
// No real-time; manual polling
setInterval(() => fetchCampaigns(), 5000);
```

**After:**

```typescript
const subscription = supabase
  .from("campaigns")
  .on("*", (payload) => setCampaigns([...campaigns, payload.new]))
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

### Pattern 4: Business Logic (RPC)

**Before:**

```typescript
const campaigns = campaignsData.campaigns;
campaigns.push({ id, name, partnerId, ... });
sessionStorage.setItem('campaigns', JSON.stringify(campaigns));
```

**After:**

```typescript
const { data, error } = await supabase.rpc('rpc_create_campaign', {
  name,
  promo_code,
  budget,
  target_signups,
  ...
});
if (data) setCampaignId(data.campaign_id);
```

---

## END OF DOCUMENT

**Last Updated:** January 27, 2026
**Status:** Ready for Phase 1 Execution
**Estimated Duration:** 5 weeks
