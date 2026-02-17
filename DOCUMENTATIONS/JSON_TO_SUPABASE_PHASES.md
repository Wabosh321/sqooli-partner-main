# JSON TO SUPABASE - DETAILED PHASES

---

## PHASE 1: AUTH & FOUNDATION

### Overview

Convert authentication from JSON + sessionStorage to Supabase Auth. Load user profiles dynamically from Postgres. Establish RLS foundation.

---

### Phase 1 Files Impact Table

| File Path                         | Type      | Current Function/Import | Supabase Function(s)                                | Tables Affected                         | RLS Policies                             | Status     |
| --------------------------------- | --------- | ----------------------- | --------------------------------------------------- | --------------------------------------- | ---------------------------------------- | ---------- |
| src/auth/handleJsonAuth.ts        | Core Auth | handleJsonSignIn()      | supabase.auth.signInWithPassword()                  | auth.users, profiles                    | `policies_profiles_select_self_or_admin` | 🔴 REWRITE |
| src/auth/handleJsonAuth.ts        | Core Auth | handleJsonSignUp()      | supabase.auth.signUp() → rpc_onboard_partner_user() | auth.users, profiles, partners, wallets | `policies_partners_insert_super_admin`   | 🔴 REWRITE |
| src/auth/handleJsonAuth.ts        | Core Auth | getJsonAuthUser()       | supabase.auth.getUser()                             | profiles (no insert)                    | `policies_profiles_select_self_or_admin` | 🔴 DELETE  |
| src/auth/handleJsonAuth.ts        | Core Auth | isJsonAuthenticated()   | supabase.auth.getSession()                          | auth.sessions                           | None                                     | 🔴 DELETE  |
| src/hooks/useAuth.ts              | Hook      | JSON user state init    | supabase.auth.onAuthStateChanged() + fetchProfile() | auth.users, profiles                    | `policies_profiles_select_self_or_admin` | 🔴 REWRITE |
| src/pages/SignIn.tsx              | Page      | handleJsonSignIn()      | supabase.auth.signInWithPassword()                  | auth.users                              | `policies_auth_users_select_self`        | 🟡 UPDATE  |
| src/pages/SignUp.tsx              | Page      | handleJsonSignUp()      | supabase.auth.signUp()                              | auth.users, profiles, partners          | `policies_partners_insert_super_admin`   | 🔴 REWRITE |
| src/context/PermissionContext.tsx | Context   | Static permission maps  | Fetch profiles.permissions from DB                  | profiles                                | `policies_profiles_select_self_or_admin` | 🟡 UPDATE  |
| src/components/layout/Header.tsx  | Component | JSON user + local state | supabase.auth.signOut()                             | auth.users                              | None (auth managed)                      | 🟢 VERIFY  |

---

### Phase 1 Supabase Functions to Create

| Function Name | Purpose              | Input Parameters          | Output Type            | RLS Policy Required | Complexity |
| ------------- | -------------------- | ------------------------- | ---------------------- | ------------------- | ---------- |
| (Built-in)    | signInWithPassword() | email, password           | {user, session, error} | auth.users basic    | LOW        |
| (Built-in)    | signUp()             | email, password, metadata | {user, session, error} | auth.users basic    | LOW        |
| (Built-in)    | getUser()            | —                         | {user}                 | auth.users self     | LOW        |
| (Built-in)    | getSession()         | —                         | {session}              | auth.sessions       | LOW        |
| (Built-in)    | signOut()            | —                         | {error}                | auth.users self     | LOW        |

---

### Phase 1 Tables to Create/Enable

| Table Name | Primary Key                 | Foreign Keys  | RLS Enabled | Purpose                             | Status    |
| ---------- | --------------------------- | ------------- | ----------- | ----------------------------------- | --------- |
| auth.users | id (uuid)                   | —             | ✓           | Supabase managed users              | ✓ EXISTS  |
| profiles   | id (uuid, FK→auth.users.id) | auth.users.id | ✓ NEW       | Partner metadata, role, permissions | 🟡 CREATE |
| partners   | id (uuid)                   | —             | ✓ NEW       | Organization records                | 🟡 CREATE |

---

### Phase 1 RLS Policies Required

| Table    | Policy Name                              | Operation | Conditions                                                   | Priority |
| -------- | ---------------------------------------- | --------- | ------------------------------------------------------------ | -------- |
| profiles | `policies_profiles_select_self_or_admin` | SELECT    | `auth.uid() = id OR is_super_admin()`                        | 🔴 P0    |
| profiles | `policies_profiles_update_self_limited`  | UPDATE    | `auth.uid() = id` (email, full_name only)                    | 🟡 P1    |
| profiles | `policies_profiles_insert_admin`         | INSERT    | `is_super_admin()`                                           | 🟡 P1    |
| partners | `policies_partners_select_own`           | SELECT    | `id = (SELECT partner_id FROM profiles WHERE id=auth.uid())` | 🔴 P0    |
| partners | `policies_partners_insert_super_admin`   | INSERT    | `is_super_admin()`                                           | 🟡 P1    |
| partners | `policies_partners_update_admin`         | UPDATE    | Admin of partner OR super_admin                              | 🟡 P1    |

---

### Phase 1 Helper SQL Functions

| Function Name                     | Language | Return Type | Used By          | Priority |
| --------------------------------- | -------- | ----------- | ---------------- | -------- |
| is_super_admin(user_id uuid)      | SQL      | boolean     | All RLS policies | 🔴 P0    |
| get_user_partner_id(user_id uuid) | SQL      | uuid        | RLS policies     | 🔴 P0    |

---

### Phase 1 Data Migration Scripts

| Script                      | Source                          | Target                                | Count | Validation                      |
| --------------------------- | ------------------------------- | ------------------------------------- | ----- | ------------------------------- |
| seed_partners_from_users.ts | users.json (unique partner_ids) | partners table                        | ~3    | No duplicate org_names          |
| seed_profiles_from_users.ts | users.json                      | profiles table + auth.users (via API) | ~10   | All emails unique in auth.users |

---

### Phase 1 Testing Checklist

| Test Scenario                                | File(s) Involved                              | Expected Result                 | RLS Policy Verified                        |
| -------------------------------------------- | --------------------------------------------- | ------------------------------- | ------------------------------------------ |
| User logs in with valid credentials          | SignIn.tsx → supabase.auth                    | Session created, profile loaded | `policies_profiles_select_self_or_admin` ✓ |
| User logs in with invalid credentials        | SignIn.tsx → supabase.auth                    | Auth error returned             | N/A                                        |
| User refreshes page, session persists        | useAuth.ts → supabase.auth.onAuthStateChanged | User state restored             | `policies_profiles_select_self_or_admin` ✓ |
| User signs out                               | Header.tsx → supabase.auth.signOut()          | Session cleared                 | N/A                                        |
| Non-admin user tries to view another profile | profiles query                                | Query blocked by RLS            | `policies_profiles_select_self_or_admin` ✓ |
| Admin views partner profile                  | profiles query                                | Record returned                 | `policies_profiles_select_self_or_admin` ✓ |

---

---

## PHASE 2: CORE TABLES & PERMISSIONS

### Overview

Create all business data tables. Implement granular RLS policies. Migrate JSON data. Enable dynamic permission loading from profiles.

---

### Phase 2 Files Impact Table

| File Path                                    | Type      | Current Function/Import                                   | Supabase Function(s)                                           | Tables Affected                  | RLS Policies                                                                                                               | Status     |
| -------------------------------------------- | --------- | --------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| src/hooks/usePartnerPermissions.ts           | Hook      | PERMISSIONS_BY_PARTNER_TYPE (static)                      | Query profiles.permissions (jsonb)                             | profiles                         | `policies_profiles_select_self_or_admin`                                                                                   | 🔴 REWRITE |
| src/hooks/usePartnerAccess.ts                | Hook      | getJsonAuthUser() + hardcoded SECTION_ACCESS              | Query partners + profiles + RLS filtering                      | partners, profiles               | `policies_partners_select_own`, `policies_profiles_select_self_or_admin`                                                   | 🔴 REWRITE |
| src/context/PermissionContext.tsx            | Context   | Static PERMISSIONS_BY_PARTNER_TYPE                        | useQuery(profiles) → fetch permissions                         | profiles                         | `policies_profiles_select_self_or_admin`                                                                                   | 🟡 UPDATE  |
| src/ui/dashboard/SmallCardsGrid.tsx          | Component | campaignsData, walletsData, transactionsData JSON imports | useQuery(campaigns), useQuery(wallets), useQuery(transactions) | campaigns, wallets, transactions | `policies_campaigns_select_own_partner`, `policies_wallets_select_own_partner`, `policies_transactions_select_own_partner` | 🔴 REWRITE |
| src/ui/dashboard/UpcomingCampaigns.tsx       | Component | campaignsData JSON import                                 | useQuery(campaigns, {partner_id, status})                      | campaigns                        | `policies_campaigns_select_own_partner`                                                                                    | 🟡 UPDATE  |
| src/ui/campaign/components/CampaignTable.tsx | Component | programsData JSON import                                  | useQuery(programs, {partner_id})                               | programs                         | `policies_programs_select_own_partner`                                                                                     | 🟡 UPDATE  |
| src/sections/ReportsSection.tsx              | Section   | campaignsData JSON import                                 | useQuery(campaigns, {partner_id})                              | campaigns                        | `policies_campaigns_select_own_partner`                                                                                    | 🟡 UPDATE  |
| src/sections/DashboardSection.tsx            | Section   | Multiple JSON imports (delegated)                         | useQuery(campaigns), useQuery(wallets), useQuery(transactions) | campaigns, wallets, transactions | All dashboard policies                                                                                                     | 🟡 UPDATE  |
| Seed Script                                  | Migration | campaigns.json, programs.json                             | INSERT via Supabase API                                        | campaigns, programs, enrollments | N/A                                                                                                                        | 🔴 CREATE  |

---

### Phase 2 Supabase Functions to Create

| Function Name              | Purpose                                        | Input Parameters                                             | Output Type                    | RLS Policy Required                        | Complexity |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------ | ------------------------------------------ | ---------- |
| rpc_onboard_partner_user() | Create partner + admin user + profile + wallet | org_name, email, full_name, partner_type, phone, password    | {user_id, partner_id, message} | —                                          | HIGH       |
| rpc_log_audit_event()      | Generic audit logger for all actions           | action_type, resource_type, resource_id, changes, ip_address | {log_id, message}              | `policies_audit_logs_insert_authenticated` | MEDIUM     |

---

### Phase 2 Tables to Create/Enable

| Table Name               | Primary Key | Foreign Keys                                                                      | RLS Enabled | Purpose                     | Status    |
| ------------------------ | ----------- | --------------------------------------------------------------------------------- | ----------- | --------------------------- | --------- |
| campaigns                | id (uuid)   | partner_id→partners.id, program_id→programs.id, created_by_user_id→profiles.id    | ✓ NEW       | Campaign definitions        | 🟡 CREATE |
| programs                 | id (uuid)   | partner_id→partners.id, created_by_user_id→profiles.id                            | ✓ NEW       | Training/education programs | 🟡 CREATE |
| tasks                    | id (uuid)   | campaign_id→campaigns.id, created_by_user_id→profiles.id, approver_id→profiles.id | ✓ NEW       | Approval workflows          | 🟡 CREATE |
| audit_logs               | id (uuid)   | user_id→profiles.id (nullable)                                                    | ✓ NEW       | Immutable activity trail    | 🟡 CREATE |
| user_activity_log        | id (uuid)   | user_id→profiles.id, parent_user_id→profiles.id                                   | ✓ NEW       | Team member activity        | 🟡 CREATE |
| user_performance_metrics | id (uuid)   | user_id→profiles.id, parent_user_id→profiles.id                                   | ✓ NEW       | KPIs, earnings, scores      | 🟡 CREATE |

---

### Phase 2 RLS Policies Required

| Table                    | Policy Name                                       | Operation | Conditions                                                                               | Priority |
| ------------------------ | ------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- | -------- |
| campaigns                | `policies_campaigns_select_own_partner`           | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid()) OR is_super_admin()` | 🔴 P0    |
| campaigns                | `policies_campaigns_insert_admin`                 | INSERT    | `is_partner_admin(partner_id)`                                                           | 🔴 P0    |
| campaigns                | `policies_campaigns_update_admin`                 | UPDATE    | `is_partner_admin(partner_id)`                                                           | 🔴 P0    |
| programs                 | `policies_programs_select_own_partner`            | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid()) OR is_super_admin()` | 🔴 P0    |
| programs                 | `policies_programs_insert_admin`                  | INSERT    | `is_partner_admin(partner_id)`                                                           | 🔴 P0    |
| tasks                    | `policies_tasks_select_stakeholders`              | SELECT    | Creator OR approver OR partner_admin                                                     | 🔴 P0    |
| tasks                    | `policies_tasks_insert_admin`                     | INSERT    | `is_partner_admin()`                                                                     | 🟡 P1    |
| tasks                    | `policies_tasks_update_creator_or_approver`       | UPDATE    | Task creator OR approver                                                                 | 🟡 P1    |
| audit_logs               | `policies_audit_logs_select_admin_only`           | SELECT    | Admin OR compliance officer                                                              | 🟡 P1    |
| audit_logs               | `policies_audit_logs_insert_authenticated`        | INSERT    | Any authenticated user (auth.uid() auto-set)                                             | 🔴 P0    |
| user_activity_log        | `policies_user_activity_select_self_parent_admin` | SELECT    | `user_id = auth.uid() OR parent_user_id = auth.uid() OR is_super_admin()`                | 🟡 P1    |
| user_activity_log        | `policies_user_activity_insert_system`            | INSERT    | Backend service role only                                                                | 🟡 P1    |
| user_performance_metrics | `policies_user_metrics_select_self_parent_admin`  | SELECT    | `user_id = auth.uid() OR parent_user_id = auth.uid() OR is_super_admin()`                | 🟡 P1    |
| user_performance_metrics | `policies_user_metrics_update_admin`              | UPDATE    | Backend service role OR super_admin                                                      | 🟡 P1    |

---

### Phase 2 Helper SQL Functions

| Function Name                     | Language | Return Type | Used By                             | Priority |
| --------------------------------- | -------- | ----------- | ----------------------------------- | -------- |
| is_partner_admin(partner_id uuid) | SQL      | boolean     | campaigns, programs, tasks policies | 🔴 P0    |
| is_authenticated()                | SQL      | boolean     | All data policies                   | 🟢 LOW   |

---

### Phase 2 Data Migration Scripts

| Script                       | Source          | Target           | Count | Validation                          |
| ---------------------------- | --------------- | ---------------- | ----- | ----------------------------------- |
| seed_campaigns_from_json.ts  | campaigns.json  | campaigns table  | ~30   | All partner_ids exist in partners   |
| seed_programs_from_json.ts   | programs.json   | programs table   | ~10   | All partner_ids exist in partners   |
| seed_tasks_from_json.ts      | tasks.json      | tasks table      | ~20   | All campaign_ids exist in campaigns |
| seed_audit_logs_from_json.ts | audit_logs.json | audit_logs table | ~50   | All user_ids exist in profiles      |

---

### Phase 2 Testing Checklist

| Test Scenario                          | File(s) Involved               | Expected Result                               | RLS Policy Verified                                 |
| -------------------------------------- | ------------------------------ | --------------------------------------------- | --------------------------------------------------- |
| Partner admin views own campaigns      | Dashboard, useQuery(campaigns) | List filtered to own partner_id               | `policies_campaigns_select_own_partner` ✓           |
| User views another partner's campaigns | useQuery(campaigns)            | Query blocked by RLS                          | `policies_campaigns_select_own_partner` ✓           |
| Super admin views all campaigns        | useQuery(campaigns)            | All campaigns returned                        | `policies_campaigns_select_own_partner` ✓           |
| Dynamic permissions loaded for user    | PermissionContext              | permissions fetched from profiles.permissions | `policies_profiles_select_self_or_admin` ✓          |
| Audit log created for action           | rpc_log_audit_event()          | Record inserted to audit_logs                 | `policies_audit_logs_insert_authenticated` ✓        |
| Non-admin user views team activity     | user_activity_log query        | Blocked if parent_user_id ≠ uid               | `policies_user_activity_select_self_parent_admin` ✓ |

---

---

## PHASE 3: WALLETS & TRANSACTIONS

### Overview

Implement wallet system, transaction recording, and withdrawal workflow with RLS and RPC functions. Enable real-time subscriptions for wallet updates.

---

### Phase 3 Files Impact Table

| File Path                                   | Type      | Current Function/Import                                                           | Supabase Function(s)                                                                          | Tables Affected                      | RLS Policies                                                                          | Status      |
| ------------------------------------------- | --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- | ----------- |
| src/infrastructure/wallet/wallet.service.ts | Service   | fetchCampaigns (partial), fetchTransactions (partial), fetchWithdrawals (partial) | Complete with RLS filtering + error handling                                                  | campaigns, transactions, withdrawals | `policies_transactions_select_own_partner`, `policies_withdrawals_select_own_partner` | 🔴 COMPLETE |
| src/ui/dashboard/WalletBalanceCard.tsx      | Component | walletsData JSON import                                                           | useQuery(wallets, {partner_id}) + useSubscription(wallets)                                    | wallets                              | `policies_wallets_select_own_partner`                                                 | 🟡 UPDATE   |
| src/ui/dashboard/LineChart.tsx              | Component | transactionsData JSON import                                                      | useQuery(transactions, {partner_id}) + useSubscription(transactions)                          | transactions                         | `policies_transactions_select_own_partner`                                            | 🟡 UPDATE   |
| src/ui/dashboard/TabbedMetricsChart.tsx     | Component | transactionsData JSON import                                                      | useQuery(transactions, {partner_id})                                                          | transactions                         | `policies_transactions_select_own_partner`                                            | 🟡 UPDATE   |
| src/ui/dashboard/RecentActivity.tsx         | Component | userActivityData JSON import                                                      | useSubscription(user_activity_log, {parent_user_id})                                          | user_activity_log                    | `policies_user_activity_select_self_parent_admin`                                     | 🟡 UPDATE   |
| src/sections/WalletSection.tsx              | Section   | walletsData + transactionsData JSON + disabled withdrawal buttons                 | useQuery(wallets), useQuery(transactions), rpc_request_withdrawal(), rpc_process_withdrawal() | wallets, transactions, withdrawals   | All wallet/transaction policies                                                       | 🔴 REWRITE  |
| Seed Script                                 | Migration | wallets.json, transactions.json                                                   | INSERT via Supabase API                                                                       | wallets, transactions                | N/A                                                                                   | 🔴 CREATE   |

---

### Phase 3 Supabase Functions to Create

| Function Name            | Purpose                              | Input Parameters                                                               | Output Type                               | RLS Policy Required                         | Complexity |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------- | ---------- |
| rpc_record_transaction() | Record earning/withdrawal/adjustment | partner_id, user_id, campaign_id, transaction_type, amount, mpesa_code, status | {transaction_id, wallet_balance, message} | `policies_transactions_insert_system`       | HIGH       |
| rpc_request_withdrawal() | Partner admin requests withdrawal    | partner_id, amount, method, destination_details                                | {withdrawal_id, status, message}          | `policies_withdrawals_insert_partner_admin` | HIGH       |
| rpc_process_withdrawal() | Finance/admin processes withdrawal   | withdrawal_id, mpesa_receipt, status                                           | {success, wallet_balance, message}        | `policies_withdrawals_update_finance`       | HIGH       |

---

### Phase 3 Tables to Create/Enable

| Table Name   | Primary Key | Foreign Keys                                                                                | RLS Enabled | Purpose                            | Status    |
| ------------ | ----------- | ------------------------------------------------------------------------------------------- | ----------- | ---------------------------------- | --------- |
| wallets      | id (uuid)   | partner_id→partners.id (unique)                                                             | ✓ NEW       | Partner wallet balances            | 🟡 CREATE |
| transactions | id (uuid)   | partner_id→partners.id, user_id→profiles.id (nullable), campaign_id→campaigns.id (nullable) | ✓ NEW       | Earnings, withdrawals, adjustments | 🟡 CREATE |
| withdrawals  | id (uuid)   | partner_id→partners.id                                                                      | ✓ NEW       | Withdrawal requests & processing   | 🟡 CREATE |

---

### Phase 3 RLS Policies Required

| Table        | Policy Name                                 | Operation | Conditions                                                                                                       | Priority |
| ------------ | ------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| wallets      | `policies_wallets_select_own_partner`       | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid()) AND is_partner_admin()`                      | 🔴 P0    |
| wallets      | `policies_wallets_update_system_only`       | UPDATE    | Service role only (for rpc functions)                                                                            | 🟡 P1    |
| transactions | `policies_transactions_select_own_partner`  | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid()) OR user_id = auth.uid() OR is_super_admin()` | 🔴 P0    |
| transactions | `policies_transactions_insert_system_only`  | INSERT    | Service role only (via rpc_record_transaction)                                                                   | 🟡 P1    |
| withdrawals  | `policies_withdrawals_select_own_partner`   | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid())`                                             | 🔴 P0    |
| withdrawals  | `policies_withdrawals_insert_partner_admin` | INSERT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid()) AND is_partner_admin()`                      | 🔴 P0    |
| withdrawals  | `policies_withdrawals_update_finance`       | UPDATE    | Finance role (role='finance_manager' OR is_super_admin())                                                        | 🟡 P1    |

---

### Phase 3 Helper SQL Functions

| Function Name                                               | Language | Return Type | Used By                                        | Priority |
| ----------------------------------------------------------- | -------- | ----------- | ---------------------------------------------- | -------- |
| get_wallet_balance(partner_id uuid)                         | SQL      | numeric     | rpc_record_transaction, rpc_request_withdrawal | 🔴 P0    |
| validate_withdrawal_amount(partner_id uuid, amount numeric) | SQL      | boolean     | rpc_request_withdrawal                         | 🟡 P1    |

---

### Phase 3 Data Migration Scripts

| Script                         | Source            | Target             | Count | Validation                        |
| ------------------------------ | ----------------- | ------------------ | ----- | --------------------------------- |
| seed_wallets_from_json.ts      | wallets.json      | wallets table      | ~10   | All partner_ids exist in partners |
| seed_transactions_from_json.ts | transactions.json | transactions table | ~100  | All foreign keys valid            |

---

### Phase 3 Real-time Subscriptions

| Table        | Subscription Filter          | Event Types    | UI Component(s)                              | Priority |
| ------------ | ---------------------------- | -------------- | -------------------------------------------- | -------- |
| wallets      | `partner_id=eq.${partnerId}` | UPDATE         | WalletBalanceCard, WalletSection             | 🔴 P0    |
| transactions | `partner_id=eq.${partnerId}` | INSERT, UPDATE | LineChart, TabbedMetricsChart, WalletSection | 🔴 P0    |
| withdrawals  | `partner_id=eq.${partnerId}` | INSERT, UPDATE | WalletSection                                | 🔴 P0    |

---

### Phase 3 Testing Checklist

| Test Scenario                      | File(s) Involved                         | Expected Result                                         | RLS Policy Verified                           |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Partner admin views wallet balance | WalletSection → useQuery(wallets)        | Balance loaded                                          | `policies_wallets_select_own_partner` ✓       |
| Transaction recorded (backend)     | rpc_record_transaction()                 | Record inserted, wallet updated                         | `policies_transactions_insert_system_only` ✓  |
| Partner requests withdrawal        | WalletSection → rpc_request_withdrawal() | Withdrawal record created with pending status           | `policies_withdrawals_insert_partner_admin` ✓ |
| Finance admin processes withdrawal | rpc_process_withdrawal()                 | Withdrawal status→processed, wallet balance decremented | `policies_withdrawals_update_finance` ✓       |
| Real-time wallet update            | WalletBalanceCard + subscription         | Balance updates live when transaction inserted          | useSubscription fires callback ✓              |
| Non-partner user views wallets     | useQuery(wallets)                        | Query blocked by RLS                                    | `policies_wallets_select_own_partner` ✓       |

---

---

## PHASE 4: FEATURES & REALTIME

### Overview

Enable campaign CRUD, program CRUD, team member management, task approval workflows. Full real-time subscriptions across all features. Enable demo-disabled features.

---

### Phase 4 Files Impact Table

| File Path                           | Type      | Current Function/Import                                                        | Supabase Function(s)                                                                                           | Tables Affected                                           | RLS Policies             | Status     |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------ | ---------- |
| src/sections/CampaignSection.tsx    | Section   | campaignsData JSON + disabled buttons                                          | useQuery(campaigns), rpc_create_campaign(), rpc_update_campaign(), rpc_delete_campaign()                       | campaigns, tasks, audit_logs                              | All campaign policies    | 🔴 REWRITE |
| src/sections/UserSection.tsx        | Section   | created_users JSON + user_activity JSON + user_metrics JSON + disabled buttons | useQuery(team_members), useSubscription(user_activity_log), rpc_create_team_member(), rpc_update_team_member() | team_members, user_activity_log, user_performance_metrics | All team member policies | 🔴 REWRITE |
| src/sections/ProgramSection.tsx     | Section   | programsData JSON + disabled buttons                                           | useQuery(programs), rpc_create_program(), rpc_update_program(), rpc_delete_program()                           | programs, audit_logs                                      | All program policies     | 🟡 UPDATE  |
| src/sections/TasksSection.tsx       | Section   | tasksData JSON + campaignsData JSON                                            | useQuery(tasks), useSubscription(tasks), rpc_approve_task(), rpc_reject_task()                                 | tasks, campaigns, audit_logs                              | All task policies        | 🟡 UPDATE  |
| src/ui/dashboard/RecentActivity.tsx | Component | userActivityData JSON import                                                   | useSubscription(user_activity_log, {parent_user_id})                                                           | user_activity_log, profiles                               | All activity policies    | 🟡 UPDATE  |
| Seed Script                         | Migration | created_users.json, user_activity.json, user_metrics.json                      | INSERT via Supabase API                                                                                        | team_members, user_activity_log, user_performance_metrics | N/A                      | 🔴 CREATE  |

---

### Phase 4 Supabase Functions to Create

| Function Name            | Purpose                                        | Input Parameters                                                                    | Output Type            | RLS Policy Required                  | Complexity |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- | ------------------------------------ | ---------- |
| rpc_create_campaign()    | Create campaign with auto-logging              | name, promo_code, budget, target_signups, partner_id, bundled_offers, revenue_share | {campaign_id, message} | `policies_campaigns_insert_admin`    | HIGH       |
| rpc_update_campaign()    | Update campaign details + audit trail          | campaign_id, name, status, budget, (other fields)                                   | {success, message}     | `policies_campaigns_update_admin`    | MEDIUM     |
| rpc_delete_campaign()    | Soft-delete or archive campaign                | campaign_id                                                                         | {success, message}     | `policies_campaigns_update_admin`    | MEDIUM     |
| rpc_create_program()     | Create educational program                     | name, description, partner_id, status                                               | {program_id, message}  | `policies_programs_insert_admin`     | MEDIUM     |
| rpc_update_program()     | Update program details                         | program_id, name, description, status                                               | {success, message}     | `policies_programs_update_admin`     | LOW        |
| rpc_delete_program()     | Archive program                                | program_id                                                                          | {success, message}     | `policies_programs_update_admin`     | LOW        |
| rpc_create_team_member() | Partner admin creates sub-user                 | email, full_name, role, partner_id, permissions, access_level                       | {user_id, message}     | `policies_team_members_insert_admin` | HIGH       |
| rpc_update_team_member() | Update team member details & permissions       | user_id, email, full_name, role, permissions, access_level, is_active               | {success, message}     | `policies_team_members_update_admin` | MEDIUM     |
| rpc_approve_task()       | Approver marks task approved → campaign active | task_id, approver_notes                                                             | {campaign_id, message} | `policies_tasks_update_approver`     | MEDIUM     |
| rpc_reject_task()        | Approver rejects task with reason              | task_id, rejection_reason                                                           | {success, message}     | `policies_tasks_update_approver`     | MEDIUM     |

---

### Phase 4 Tables to Create/Enable

| Table Name   | Primary Key | Foreign Keys                                       | RLS Enabled | Purpose                               | Status    |
| ------------ | ----------- | -------------------------------------------------- | ----------- | ------------------------------------- | --------- |
| team_members | id (uuid)   | parent_user_id→profiles.id, partner_id→partners.id | ✓ NEW       | Child users created by partner admins | 🟡 CREATE |

---

### Phase 4 RLS Policies Required

| Table             | Policy Name                                | Operation | Conditions                                                           | Priority |
| ----------------- | ------------------------------------------ | --------- | -------------------------------------------------------------------- | -------- |
| campaigns         | `policies_campaigns_select_own_partner`    | SELECT    | (From Phase 2, extend for cascade)                                   | ✓ EXTEND |
| campaigns         | `policies_campaigns_insert_admin`          | INSERT    | `is_partner_admin()`                                                 | 🔴 P0    |
| campaigns         | `policies_campaigns_update_admin`          | UPDATE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| campaigns         | `policies_campaigns_delete_admin`          | DELETE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| programs          | `policies_programs_insert_admin`           | INSERT    | `is_partner_admin()`                                                 | 🔴 P0    |
| programs          | `policies_programs_update_admin`           | UPDATE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| programs          | `policies_programs_delete_admin`           | DELETE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| team_members      | `policies_team_members_select_own_partner` | SELECT    | `partner_id = (SELECT partner_id FROM profiles WHERE id=auth.uid())` | 🔴 P0    |
| team_members      | `policies_team_members_insert_admin`       | INSERT    | `is_partner_admin()`                                                 | 🔴 P0    |
| team_members      | `policies_team_members_update_admin`       | UPDATE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| team_members      | `policies_team_members_delete_admin`       | DELETE    | `is_partner_admin(partner_id)`                                       | 🔴 P0    |
| tasks             | `policies_tasks_update_approver`           | UPDATE    | `approver_id = auth.uid() AND status IN ('pending', 'rejected')`     | 🔴 P0    |
| user_activity_log | `policies_user_activity_insert_system`     | INSERT    | Backend service role (auto-log on team member actions)               | 🟡 P1    |

---

### Phase 4 Helper SQL Functions

| Function Name                       | Language | Return Type | Used By                                  | Priority |
| ----------------------------------- | -------- | ----------- | ---------------------------------------- | -------- |
| is_campaign_owner(campaign_id uuid) | SQL      | boolean     | rpc_update_campaign, rpc_delete_campaign | 🟡 P1    |
| is_program_owner(program_id uuid)   | SQL      | boolean     | rpc_update_program, rpc_delete_program   | 🟡 P1    |

---

### Phase 4 Data Migration Scripts

| Script                          | Source             | Target                                | Count | Validation                            |
| ------------------------------- | ------------------ | ------------------------------------- | ----- | ------------------------------------- |
| seed_team_members_from_json.ts  | created_users.json | team_members table + profiles (child) | ~20   | All parent_user_ids exist in profiles |
| seed_user_activity_from_json.ts | user_activity.json | user_activity_log table               | ~50   | All user_ids exist in profiles        |
| seed_user_metrics_from_json.ts  | user_metrics.json  | user_performance_metrics table        | ~20   | All user_ids exist in profiles        |

---

### Phase 4 Real-time Subscriptions

| Table             | Subscription Filter                                        | Event Types            | UI Component(s)             | Priority |
| ----------------- | ---------------------------------------------------------- | ---------------------- | --------------------------- | -------- |
| campaigns         | `partner_id=eq.${partnerId}`                               | INSERT, UPDATE, DELETE | CampaignSection, Dashboard  | 🔴 P0    |
| programs          | `partner_id=eq.${partnerId}`                               | INSERT, UPDATE, DELETE | ProgramSection              | 🔴 P0    |
| tasks             | `campaign_id=eq.${campaignId} OR approver_id=eq.${userId}` | INSERT, UPDATE         | TasksSection                | 🔴 P0    |
| team_members      | `partner_id=eq.${partnerId}`                               | INSERT, UPDATE, DELETE | UserSection                 | 🔴 P0    |
| user_activity_log | `parent_user_id=eq.${userId}`                              | INSERT                 | RecentActivity, UserSection | 🔴 P0    |

---

### Phase 4 Testing Checklist

| Test Scenario                     | File(s) Involved                        | Expected Result                              | RLS Policy Verified                    |
| --------------------------------- | --------------------------------------- | -------------------------------------------- | -------------------------------------- |
| Partner admin creates campaign    | CampaignSection → rpc_create_campaign() | Campaign record inserted, audit logged       | `policies_campaigns_insert_admin` ✓    |
| Team member creates program       | ProgramSection → rpc_create_program()   | Program record inserted if authorized        | `policies_programs_insert_admin` ✓     |
| Partner admin creates team member | UserSection → rpc_create_team_member()  | profiles + team_members records created      | `policies_team_members_insert_admin` ✓ |
| Approver approves task            | TasksSection → rpc_approve_task()       | Task status→approved, campaign status→active | `policies_tasks_update_approver` ✓     |
| Real-time campaign list update    | CampaignSection + subscription          | New campaign appears immediately on creation | useSubscription(campaigns) ✓           |
| Team member activity broadcast    | UserSection + subscription              | Parent sees child activity live              | useSubscription(user_activity_log) ✓   |
| Non-admin user creates campaign   | rpc_create_campaign()                   | Request rejected by RLS                      | `policies_campaigns_insert_admin` ✓    |

---

---

## PHASE 5: CLEANUP & DEPRECATION

### Overview

Delete all JSON files and legacy utilities. Remove feature flags. Finalize monitoring. Deploy to production with rollback plan.

---

### Phase 5 Files Impact Table

| File Path                     | Type      | Current Function/Import | Supabase Function(s)        | Tables Affected | RLS Policies | Status    |
| ----------------------------- | --------- | ----------------------- | --------------------------- | --------------- | ------------ | --------- |
| src/auth/data/\*.json         | Data      | 12 JSON files           | None (deprecated)           | N/A             | N/A          | ❌ DELETE |
| data/\*.json                  | Data      | 8 backup JSON files     | None (deprecated)           | N/A             | N/A          | ❌ DELETE |
| src/auth/handleJsonAuth.ts    | Core Auth | All functions           | None (deprecated)           | N/A             | N/A          | ❌ DELETE |
| Legacy utility files (if any) | Utilities | JSON read functions     | None (deprecated)           | N/A             | N/A          | ❌ DELETE |
| Constants.ts                  | Config    | JSON array references   | None (use Supabase queries) | N/A             | N/A          | 🟡 UPDATE |

---

### Phase 5 Cleanup Checklist

| Item                       | File(s)                          | Action                                                        | Validation                              | Status    |
| -------------------------- | -------------------------------- | ------------------------------------------------------------- | --------------------------------------- | --------- |
| Delete users.json          | src/auth/data/users.json         | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete created_users.json  | src/auth/data/created_users.json | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete campaigns.json      | src/auth/data/campaigns.json     | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete programs.json       | src/auth/data/programs.json      | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete wallets.json        | src/auth/data/wallets.json       | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete transactions.json   | src/auth/data/transactions.json  | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete tasks.json          | src/auth/data/tasks.json         | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete audit_logs.json     | src/auth/data/audit_logs.json    | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete enrollments.json    | src/auth/data/enrollments.json   | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete revenue.json        | src/auth/data/revenue.json       | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete user_activity.json  | src/auth/data/user_activity.json | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete user_metrics.json   | src/auth/data/user_metrics.json  | rm                                                            | No imports remaining                    | ❌ DELETE |
| Delete handleJsonAuth.ts   | src/auth/handleJsonAuth.ts       | rm                                                            | No imports remaining, use supabase.auth | ❌ DELETE |
| Remove JSON fallback logic | All .tsx files                   | grep + remove                                                 | No "JSON fallback" comments             | 🟡 REVIEW |
| Remove demo mode blocks    | src/sections/\*.tsx              | Remove toast.error("demo mode")                               | All CRUD enabled                        | 🟡 REMOVE |
| Remove feature flags       | src/lib/flags.ts                 | Remove JSON-related flags                                     | Only Supabase flags remain              | 🟡 UPDATE |
| Update Constants.ts        | src/Constants.ts                 | Replace JSON imports with Supabase queries or computed values | No JSON imports                         | 🟡 UPDATE |

---

### Phase 5 Final Testing Checklist

| Test Scenario                                  | File(s) Involved                      | Expected Result                              | Status    |
| ---------------------------------------------- | ------------------------------------- | -------------------------------------------- | --------- |
| Full auth → dashboard → campaign → wallet flow | All pages/sections                    | User can complete entire flow without errors | 🟡 TEST   |
| No JSON imports in codebase                    | `grep -r "from.*\.json"`              | 0 matches                                    | 🟡 VERIFY |
| TypeScript compilation clean                   | `tsc --noEmit`                        | 0 errors, 0 warnings                         | 🟡 VERIFY |
| All demo-mode toasts removed                   | `grep -r "demo mode"`                 | 0 matches                                    | 🟡 VERIFY |
| RLS policies all enabled                       | Supabase Dashboard                    | All tables have RLS enabled                  | 🟡 VERIFY |
| Realtime enabled on subscribed tables          | Supabase Dashboard                    | 7 tables have realtime enabled               | 🟡 VERIFY |
| Audit logs recording correctly                 | Supabase Dashboard (audit_logs table) | Records for all CRUD actions                 | 🟡 VERIFY |
| Monitoring & alerts active                     | Error tracking service                | Alerts configured for Supabase errors        | 🟡 VERIFY |

---

### Phase 5 Production Deployment Checklist

| Item                            | Owner    | Status     | Verification                              |
| ------------------------------- | -------- | ---------- | ----------------------------------------- |
| Database backup created         | DevOps   | ⏳ PENDING | Supabase automatic backup verified        |
| RLS policies tested             | QA       | ⏳ PENDING | All 30+ policies tested manually          |
| Load testing (concurrent users) | QA       | ⏳ PENDING | 100+ concurrent requests succeed          |
| Rollback plan documented        | Eng Lead | ⏳ PENDING | Feature flag + cached data fallback ready |
| All team trained on Supabase    | Ops      | ⏳ PENDING | Dashboard, RLS, Functions documented      |
| Monitoring alerts active        | DevOps   | ⏳ PENDING | Slack/PagerDuty integration confirmed     |
| Production .env.local set       | DevOps   | ⏳ PENDING | Keys correct, no JSON paths in config     |
| Smoke tests passed              | QA       | ⏳ PENDING | Critical user flows green                 |

---

### Phase 5 Rollback Plan

| Scenario                 | Trigger                              | Action                                      | Recovery Time |
| ------------------------ | ------------------------------------ | ------------------------------------------- | ------------- |
| Supabase unavailable     | API errors > 50% for 5min            | Enable feature flag `useJsonFallback=true`  | 2 min         |
| Data corruption detected | Audit trail shows unexpected deletes | Restore from automated Supabase backup      | 10 min        |
| RLS blocking valid users | Auth errors for valid user_id        | Disable RLS temporarily, investigate policy | 15 min        |
| Performance degraded     | Query latency > 5s                   | Scale Supabase compute, check indexes       | 10 min        |
| Complete failure         | Multiple systems down                | Switch to read-only JSON cache mode         | 1 min         |

---

### Phase 5 Post-Deployment Monitoring

| Metric                 | Threshold         | Alert Action                                 | Owner         |
| ---------------------- | ----------------- | -------------------------------------------- | ------------- |
| API error rate         | > 2%              | Page on-call engineer                        | DevOps        |
| RLS policy failures    | > 10/hour         | Investigate policy logic                     | Eng Lead      |
| Supabase auth failures | > 5/hour          | Check auth config, external providers        | Eng Lead      |
| Realtime latency       | > 2s              | Check subscription channels, broadcast rate  | Backend Eng   |
| Audit log completeness | < 100% of actions | Verify triggers, function failures           | Eng Lead      |
| User complaints        | > 3/day           | Gather logs, investigate with affected users | Support + Eng |

---

## SUMMARY TABLE: ALL PHASES

| Phase                            | Duration    | File Count    | Tables Created | Policies Required | Functions Required | Key Deliverable                                       |
| -------------------------------- | ----------- | ------------- | -------------- | ----------------- | ------------------ | ----------------------------------------------------- |
| **1: Auth & Foundation**         | Week 1      | 9 files       | 3 tables       | 6 policies        | 5 (built-in)       | ✅ Supabase Auth working, RLS foundation              |
| **2: Core Tables & Permissions** | Week 2      | 10 files      | 6 tables       | 14 policies       | 2 RPCs             | ✅ All business data in Postgres, dynamic permissions |
| **3: Wallets & Transactions**    | Week 3      | 7 files       | 3 tables       | 7 policies        | 3 RPCs             | ✅ Withdrawal workflow, real-time wallet updates      |
| **4: Features & Realtime**       | Week 4      | 6 files       | 1 table        | 14 policies       | 10 RPCs            | ✅ Full CRUD enabled, all subscriptions active        |
| **5: Cleanup & Deprecation**     | Week 5      | 20+ deletions | 0              | 0                 | 0                  | ✅ JSON fully deprecated, production ready            |
| **TOTAL**                        | **5 weeks** | **32 files**  | **13 tables**  | **41 policies**   | **20 functions**   | **Production Supabase migration complete**            |

---

## END OF PHASES DOCUMENT

**Last Updated:** January 27, 2026  
**Total Phases:** 5  
**Total Duration:** 5 weeks  
**Total Files to Update:** 32  
**Total Tables to Create:** 13  
**Total RLS Policies:** 41  
**Total Supabase Functions:** 20  
**Status:** Ready for Phase 1 Execution
