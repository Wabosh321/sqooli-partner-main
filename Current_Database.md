# Current Database Architecture & Data Flow

**Date:** January 27, 2026  
**Project:** Sqooli Partner Dashboard  
**Status:** Hybrid (JSON + Supabase)

---

## Overview

The application currently operates in a **hybrid data model** where:

- **Authentication & Session:** JSON files + localStorage/sessionStorage
- **Business Data:** JSON files (campaigns, users, wallets, programs, transactions)
- **Supabase:** Prepared for future migration, currently initialized but minimally used
- **State Management:** React hooks + Context API reading from JSON

---

## Component Data Source Mapping

### 1. **src/components/layout/Header.tsx**

| Aspect             | Source                             | Details                                         |
| ------------------ | ---------------------------------- | ----------------------------------------------- |
| **User Auth Data** | JSON (localStorage/sessionStorage) | Via `useAuth()` hook → `getJsonAuthUser()`      |
| **Display Name**   | JSON User object                   | `getDisplayName()` util from auth.types.ts      |
| **Email**          | JSON User object                   | `getUserEmail()` util                           |
| **User Initials**  | JSON User object                   | `getUserInitials()` util                        |
| **Logout**         | Supabase Auth                      | `supabase.auth.signOut()` (prepared for future) |
| **Theme**          | Context (ThemeContext)             | Not currently implemented                       |

**Data Flow:**

```
sessionStorage (auth_user)
  → getJsonAuthUser()
  → useAuth() hook
  → Header component
```

---

### 2. **src/components/layout/Sidebar.tsx**

| Aspect                | Source                     | Details                                                      |
| --------------------- | -------------------------- | ------------------------------------------------------------ |
| **User Permissions**  | JSON + Context             | Via `usePermissions()` hook from PermissionContext           |
| **Menu Items**        | TypeScript const           | `SIDEBAR_MENU` from sidebar.config.ts                        |
| **Access Control**    | Partner Type + Permissions | Checks `PERMISSIONS_BY_PARTNER_TYPE`                         |
| **Partner Data**      | JSON (sessionStorage)      | Via `useAuth()` hook                                         |
| **Role Info**         | JSON User object           | `user.role` field                                            |
| **Onboarding Status** | JSON Partner object        | `partner.wallet_setup_completed`, `partner.campaign_created` |

**Data Flow:**

```
JSON User + Partner
  → useAuth()
  → usePermissions()
  → Sidebar filtering
```

---

### 3. **src/pages/SignIn.tsx**

| Aspect                          | Source                      | Details                                      |
| ------------------------------- | --------------------------- | -------------------------------------------- |
| **User Credentials Validation** | JSON (users.json)           | `handleJsonSignIn()` from handleJsonAuth.ts  |
| **Fallback Users**              | JSON (created_users.json)   | If not in users.json                         |
| **Session Storage**             | localStorage/sessionStorage | Stores `auth_user` as JSON string            |
| **Password Verification**       | Plain text comparison       | `bcryptjs` prepared but not fully integrated |

**Data Flow:**

```
Form Input
  → validateLoginData()
  → handleJsonSignIn(email, password)
  → Search users.json
  → Match credentials
  → Store in sessionStorage
  → Navigate to dashboard
```

**JSON Files Used:**

- `src/auth/data/users.json` - Primary users database
- `src/auth/data/created_users.json` - User-created accounts

---

### 4. **src/pages/SignUp.tsx**

| Aspect                      | Source                | Details                                   |
| --------------------------- | --------------------- | ----------------------------------------- |
| **Registration Validation** | TypeScript utils      | `validateRegistrationData()`              |
| **Password Strength Check** | TypeScript utils      | `getPasswordStrength()`                   |
| **User Creation**           | Prepared for Supabase | `handleRegister()` util (framework ready) |
| **Storage**                 | Future: Supabase Auth | Currently not persisting new users        |

**Data Flow:**

```
Form Input
  → validateRegistrationData()
  → handleRegister()
  → [Framework ready for Supabase]
  → Success/Error toast
```

---

### 5. **src/pages/Dashboard.tsx**

| Aspect                     | Source              | Details                                          |
| -------------------------- | ------------------- | ------------------------------------------------ |
| **Section Access Control** | Partner Type        | `usePartnerAccess()` determines visible sections |
| **User Permissions**       | JSON + Context      | `usePermissions()` for granular access           |
| **Active Section Routing** | URL Parameters      | `searchParams.get("tab")` from React Router      |
| **Onboarding Check**       | JSON Partner object | `partner.onboarding_completed` flag              |
| **Auth Loading State**     | JSON sessionStorage | `useAuth()` loading state                        |

**Data Flow:**

```
URL (tab parameter)
  → [Partner Type Check]
  → [Permission Check]
  → Render appropriate Section component
  → Each section loads its own data
```

---

### 6. **src/sections/DashboardSection.tsx**

| Aspect                   | Source                | Details                                  |
| ------------------------ | --------------------- | ---------------------------------------- |
| **Campaigns**            | JSON (campaigns.json) | Via `useUserCampaigns()` hook            |
| **Revenue Data**         | JSON (revenue.json)   | Via `useUserRevenue()` hook              |
| **Wallet Balance**       | JSON (wallets.json)   | Via `useWalletData()` application hook   |
| **Permissions**          | JSON + Context        | Via `usePermissions()`                   |
| **Partner Access Level** | JSON Partner object   | `usePartnerAccess()` determines features |
| **User Role**            | JSON User object      | `user.role` field                        |

**Data Flow:**

```
User Partner Type
  → Check canAccessDashboard()
  → Load user campaigns (JSON)
  → Load revenue data (JSON)
  → Load wallet (JSON)
  → Render dashboard widgets
```

**JSON Files Used:**

- `campaigns.json` - Campaign listings
- `revenue.json` - Revenue metrics
- `wallets.json` - Wallet balances

---

### 7. **src/sections/CampaignSection.tsx**

| Aspect                 | Source                | Details                                       |
| ---------------------- | --------------------- | --------------------------------------------- |
| **Campaign List**      | JSON (campaigns.json) | Direct import + filtering                     |
| **Campaign Details**   | JSON (campaigns.json) | Same file, filtered by campaign ID            |
| **User Campaigns**     | JSON (campaigns.json) | Via `useUserCampaigns()` hook                 |
| **Campaign Creation**  | Not persisted         | `setShowCreateWizard()` state only            |
| **Campaign Editing**   | Not persisted         | Demo mode disabled                            |
| **Campaign Deletion**  | Not persisted         | Demo mode disabled                            |
| **Campaign Filtering** | In-memory             | By status (active, expired, draft) and search |

**Data Flow:**

```
useAuth() → Get partner_id
  → useUserCampaigns()
  → Filter campaigns.json by partner_id
  → Filter by status + search query
  → Display in CampaignTable
```

**JSON Files Used:**

- `campaigns.json` - All campaign data

---

### 8. **src/sections/WalletSection.tsx**

| Aspect                 | Source                   | Details                                |
| ---------------------- | ------------------------ | -------------------------------------- |
| **Wallet Balance**     | JSON (wallets.json)      | Via `useWalletData(partnerId)`         |
| **Transactions**       | JSON (transactions.json) | Via `useUserTransactions()` hook       |
| **Withdrawals**        | JSON (wallets.json)      | Via withdrawal history in wallets.json |
| **Payment Methods**    | TypeScript const         | Hardcoded in component                 |
| **Filtering & Search** | In-memory                | Via `useWalletFiltering()` hook        |
| **Wallet Sync**        | Prepared for Supabase    | Currently JSON-based                   |

**Data Flow:**

```
useAuth() → Get partnerId
  → useWalletData(partnerId)
  → useUserTransactions()
  → useWalletFiltering()
  → Filter by search/tab
  → Display PaymentsList & WithdrawalsList
```

**JSON Files Used:**

- `wallets.json` - Balance and withdrawal history
- `transactions.json` - Transaction records

---

### 9. **src/sections/UserSection.tsx**

| Aspect            | Source                    | Details                    |
| ----------------- | ------------------------- | -------------------------- |
| **Created Users** | JSON (created_users.json) | Direct import              |
| **User Activity** | JSON (user_activity.json) | Activity/audit logs        |
| **User Metrics**  | JSON (user_metrics.json)  | Performance metrics        |
| **User Search**   | In-memory                 | Filters created_users.json |
| **Add User**      | Not persisted             | Dialog state only          |
| **Edit User**     | Not persisted             | Dialog state only          |
| **Delete User**   | Not persisted             | Demo mode disabled         |

**Data Flow:**

```
useAuth() → Get user
  → Load created_users.json
  → Load user_activity.json
  → Load user_metrics.json
  → Filter by search query
  → Display in tabs (Users/Activity/Metrics)
```

**JSON Files Used:**

- `created_users.json` - Team members
- `user_activity.json` - Activity logs
- `user_metrics.json` - User performance data

---

### 10. **src/sections/ProgramSection.tsx**

| Aspect              | Source               | Details                   |
| ------------------- | -------------------- | ------------------------- |
| **Programs List**   | JSON (programs.json) | Direct import             |
| **Program Details** | JSON (programs.json) | Same file, filtered by ID |
| **Curricula**       | JSON (programs.json) | Embedded in program data  |
| **Subjects**        | JSON (programs.json) | Embedded in program data  |
| **Create Program**  | Not persisted        | Dialog state only         |
| **Edit Program**    | Not persisted        | Demo mode disabled        |
| **Delete Program**  | Not persisted        | Demo mode disabled        |

**Data Flow:**

```
useAuth() → Get partner_id
  → Load programs.json
  → Filter by partner_id
  → Display ProgramRow components
  → Show curricula/subjects tabs
```

**JSON Files Used:**

- `programs.json` - Program and curriculum data

---

### 11. **src/sections/PaymentSection.tsx**

| Data Aspect             | Source                   | Details                  |
| ----------------------- | ------------------------ | ------------------------ |
| **Payment Methods**     | TypeScript const         | Hardcoded configurations |
| **Transaction History** | JSON (transactions.json) | Via hooks                |
| **Payment Status**      | In-memory                | State-based only         |

_(Note: File not heavily analyzed, likely mirrors WalletSection)_

---

### 12. **src/sections/ReportsSection.tsx**

| Data Aspect              | Source                                 | Details                          |
| ------------------------ | -------------------------------------- | -------------------------------- |
| **Report Data**          | JSON (revenue.json, transactions.json) | Aggregated from multiple sources |
| **Charts Data**          | JSON + in-memory calculation           | Via Recharts visualization       |
| **Export Functionality** | Prepared framework                     | Not yet implemented              |

_(Note: Full analysis needed - framework ready)_

---

### 13. **src/sections/SettingsSection.tsx**

| Data Aspect          | Source              | Details               |
| -------------------- | ------------------- | --------------------- |
| **Partner Settings** | JSON Partner object | Via `useAuth()`       |
| **User Settings**    | JSON User object    | Via `useAuth()`       |
| **Theme Settings**   | Context             | Via `useTheme()` hook |
| **Updates**          | Not persisted       | Demo mode             |

_(Note: Primarily state and context-based)_

---

### 14. **src/sections/TasksSection.tsx**

| Data Aspect     | Source            | Details               |
| --------------- | ----------------- | --------------------- |
| **Tasks List**  | JSON (tasks.json) | Direct import         |
| **Task Status** | JSON (tasks.json) | Embedded status field |

_(Note: Minimal implementation, likely placeholder)_

---

### 15. **src/sections/LockedSection.tsx**

| Data Aspect      | Source | Details                             |
| ---------------- | ------ | ----------------------------------- |
| **No Data**      | N/A    | Pure UI component for access denial |
| **Section Name** | Props  | Passed from parent (Dashboard.tsx)  |

---

### 16. **src/pages/SelectAccount.tsx**

_(Not analyzed - authentication routing)_

---

## JSON Files Inventory

| File                   | Location         | Used By                           | Records       | Purpose                         |
| ---------------------- | ---------------- | --------------------------------- | ------------- | ------------------------------- |
| **users.json**         | `src/auth/data/` | SignIn                            | ~10 users     | Primary user database for login |
| **created_users.json** | `src/auth/data/` | SignIn, UserSection               | ~20 users     | Team members/sub-users          |
| **campaigns.json**     | `src/auth/data/` | CampaignSection, DashboardSection | ~50 campaigns | Campaign listings & details     |
| **wallets.json**       | `src/auth/data/` | WalletSection, DashboardSection   | ~20 wallets   | Wallet balances & withdrawals   |
| **transactions.json**  | `src/auth/data/` | WalletSection, DashboardSection   | ~100 txns     | Transaction history             |
| **programs.json**      | `src/auth/data/` | ProgramSection                    | ~15 programs  | Programs & curricula            |
| **revenue.json**       | `src/auth/data/` | DashboardSection, ReportsSection  | ~100 records  | Revenue/earnings data           |
| **user_activity.json** | `src/auth/data/` | UserSection                       | ~50 logs      | Activity/audit logs             |
| **user_metrics.json**  | `src/auth/data/` | UserSection                       | ~20 records   | User performance metrics        |
| **enrollments.json**   | `src/auth/data/` | (Prepared)                        | ~30 records   | Student enrollments             |
| **tasks.json**         | `src/auth/data/` | TasksSection                      | ~10 tasks     | Task management                 |
| **audit_logs.json**    | `src/auth/data/` | (Prepared)                        | ~100 logs     | System audit logs               |

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Sign In Flow                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User enters email + password in SignIn.tsx             │
│  2. handleJsonSignIn(email, password) called               │
│  3. Search src/auth/data/users.json for match             │
│  4. If found, store in sessionStorage as 'auth_user'       │
│  5. useAuth() hook reads sessionStorage on mount            │
│  6. Maps JSON user to ConvexUser interface                │
│  7. Creates partner object from user data                  │
│  8. Sets in React state                                    │
│  9. Components consume via useAuth() hook                  │
│  10. Navigate to /dashboard                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Current Implementation:**

- ✅ JSON file authentication (no Supabase Auth yet)
- ✅ sessionStorage persistence
- ✅ Role-based access control
- ✅ Partner type determination
- ⏳ Supabase Auth prepared but not active

---

## Permissions Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Permission Resolution Flow                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. useAuth() provides user + partner                       │
│  2. PermissionProvider context initialized                 │
│  3. Maps partner_type to PERMISSIONS_BY_PARTNER_TYPE       │
│  4. Evaluates granular permissions                         │
│  5. usePermissions() hook provides hasPermission()         │
│  6. usePartnerAccess() provides canAccessSection()         │
│  7. Components check access before rendering               │
│  8. Locked sections shown if access denied                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Permission Hierarchy:**

1. **Partner Type** (Affiliate, Media, Corporate, Institutional)
2. **User Role** (Partner Admin, Manager, Member, ReadOnly)
3. **Specific Permissions** (read_campaigns, write_wallet, etc.)

---

## Session Storage Details

### localStorage (Persistent)

| Key             | Value            | Used By           | Duration        |
| --------------- | ---------------- | ----------------- | --------------- |
| `auth_user`     | JSON User object | useAuth() hook    | Until logout    |
| `theme`         | light/dark       | useTheme()        | Browser session |
| `sidebar_state` | open/closed      | Sidebar component | Browser session |

### sessionStorage (Session-Only)

| Key                | Value            | Used By           | Duration    |
| ------------------ | ---------------- | ----------------- | ----------- |
| `auth_user`        | JSON User object | useAuth() hook    | Tab session |
| `permission_cache` | Permissions[]    | PermissionContext | Session     |

---

## Data Source Priority

When components need data:

```
1st Priority: useAuth() → sessionStorage/localStorage
2nd Priority: JSON imports → src/auth/data/*.json
3rd Priority: React hooks (useUserCampaigns, etc.)
4th Priority: Application hooks (useWalletData, etc.)
5th Priority: Supabase (prepared but not active)
```

---

## Components NOT Using External Data

- **LockedSection** - Pure UI, no data
- **Header** - Only reads user from context
- **Sidebar** - Only reads permissions from context
- **SelectAccount** - Routing component

---

## Missing/Prepared Integrations

| Feature                   | Status             | Notes                                    |
| ------------------------- | ------------------ | ---------------------------------------- |
| **Supabase Auth**         | ⏳ Prepared        | Client initialized, not actively used    |
| **Real-time Sync**        | ⏳ Framework ready | No active listeners                      |
| **User Registration**     | ⏳ Framework ready | Form validation complete, no persistence |
| **Campaign CRUD (Write)** | ⏳ Demo disabled   | Create/Edit/Delete UI ready              |
| **Wallet Withdrawal**     | ⏳ Demo disabled   | Form ready, no backend calls             |
| **Program Management**    | ⏳ Demo disabled   | Dialogs ready, no persistence            |
| **Error Tracking**        | ❌ Not implemented | No Sentry/monitoring                     |
| **Analytics**             | ❌ Not implemented | No tracking events                       |

---

## Data Flow Diagram

```
┌─────────────────┐
│   Browser UI    │  (React Components)
└────────┬────────┘
         │
         ├─→ useAuth() ────→ sessionStorage ──→ JSON User (users.json)
         │
         ├─→ usePermissions() ──→ Context ──→ Partner Type Config
         │
         ├─→ useUserCampaigns() ──→ campaigns.json (filtered)
         │
         ├─→ useWalletData() ──→ wallets.json (filtered)
         │
         ├─→ useUserTransactions() ──→ transactions.json (filtered)
         │
         └─→ Supabase (prepared, not active)

┌──────────────────────────────────────┐
│   JSON Files (src/auth/data/)         │
├──────────────────────────────────────┤
│ users.json                           │
│ campaigns.json                       │
│ wallets.json                         │
│ transactions.json                    │
│ programs.json                        │
│ created_users.json                   │
│ revenue.json                         │
│ (+ 5 more files)                     │
└──────────────────────────────────────┘
```

---

## Summary Table

### Component → Data Source Mapping

| Component            | Primary Auth | Business Data                              | State               |
| -------------------- | ------------ | ------------------------------------------ | ------------------- |
| **Header**           | JSON         | N/A                                        | Context + Props     |
| **Sidebar**          | JSON         | Permissions                                | Context             |
| **SignIn**           | JSON         | users.json                                 | Local State         |
| **SignUp**           | Framework    | N/A                                        | Local State         |
| **Dashboard**        | JSON         | N/A                                        | URL + Context       |
| **DashboardSection** | JSON         | campaigns.json, revenue.json, wallets.json | Hooks + State       |
| **CampaignSection**  | JSON         | campaigns.json                             | Hooks + Local State |
| **WalletSection**    | JSON         | wallets.json, transactions.json            | Hooks + Local State |
| **UserSection**      | JSON         | created_users.json, user_activity.json     | Hooks + Local State |
| **ProgramSection**   | JSON         | programs.json                              | Hooks + Local State |
| **PaymentSection**   | JSON         | transactions.json                          | Hooks + Local State |
| **ReportsSection**   | JSON         | revenue.json, transactions.json            | Hooks + Local State |
| **SettingsSection**  | JSON         | N/A                                        | Context + State     |
| **TasksSection**     | JSON         | tasks.json                                 | Hooks + Local State |
| **LockedSection**    | N/A          | N/A                                        | Props only          |

---

## Key Observations

### ✅ Strengths

1. Clean separation of authentication (JSON) from business logic
2. Type-safe data structures with TypeScript
3. Hooks-based architecture for reusable data logic
4. Context API for permission distribution
5. Well-organized JSON data files

### ⚠️ Current Limitations

1. **No persistence** - Data changes are not saved
2. **Demo mode** - Create/Edit/Delete operations disabled
3. **No backend** - Supabase prepared but not integrated
4. **No real-time** - No live data synchronization
5. **No concurrent users** - Single-user JSON-based system
6. **No email/SMS** - No notification infrastructure
7. **No API endpoints** - Missing backend services

### 🚀 Migration Path to Production

1. Activate Supabase Auth (replace JSON auth)
2. Move data from JSON to Supabase tables
3. Implement real-time listeners
4. Enable CRUD operations in UI
5. Add error tracking (Sentry)
6. Implement role-based API endpoints
7. Add request validation middleware
8. Enable automated backups

---

**End of Document**
