# WalletSection.tsx — Production-Grade Modularization Plan

**Date**: December 29, 2025  
**Status**: Analysis Phase (No Code Changes Yet)  
**Component**: `src/sections/WalletSection.tsx` (~757 lines)

---

## 1. EXECUTIVE SUMMARY

### Current State
`WalletSection.tsx` is a **monolithic component** mixing six distinct concerns in a single 757-line file:
- **Data Access**: Direct Supabase queries (campaigns, transactions, withdrawals)
- **Permission Enforcement**: Access control and role-based branching
- **State Management**: 5 state variables and 3 effects managing async data and UI state
- **Business Logic**: Filtering, searching, and formatting operations
- **Presentation Layer**: Desktop/mobile conditional rendering with nested JSX trees
- **Utility Functions**: Date formatting, currency formatting, status badge mapping

### Target State
Eight focused, single-responsibility modules with explicit boundaries:
1. **domain/types** — Shared domain models and interfaces
2. **domain/wallet.domain** — Business rules and invariants
3. **infrastructure/wallet.service** — Supabase data access layer
4. **application/wallet.hooks** — State orchestration and side effects
5. **ui/formatters** — Pure presentation logic (formatting, mapping)
6. **ui/components/PaymentsList** — Payments view (mobile + desktop)
7. **ui/components/WithdrawalsList** — Withdrawals view (mobile + desktop)
8. **ui/WalletSection** — Orchestrator component (permissions, routing, layout)

---

## 2. CURRENT ARCHITECTURE ANALYSIS

### 2.1 Current Responsibility Map

```
WalletSection.tsx
├── PERMISSION LOGIC
│   ├── usePermissions() → userRole
│   ├── usePartnerAccess() → canAccessWallet
│   ├── isSuperAdmin check
│   └── AccessRestricted UI
│
├── AUTH STATE
│   ├── useAuth() → partner, user
│   └── partnerId derivation
│
├── DATA FETCHING (Supabase)
│   ├── campaigns.select() → setCampaigns
│   ├── transactions.select().order() → setTransactions
│   └── withdrawals.select().order() → setWithdrawals
│   └── useEffect hook with mounted flag
│
├── STATE MANAGEMENT
│   ├── searchQuery (useState)
│   ├── activeTab: "payments" | "withdrawals" (useState)
│   ├── isWalletOpen (mobile drawer) (useState)
│   ├── campaigns, transactions, withdrawals (async state)
│   └── useMemo → filteredTransactions, filteredWithdrawals
│
├── BUSINESS LOGIC (Filtering)
│   ├── filteredTransactions filtering logic (5-field search)
│   ├── filteredWithdrawals filtering logic (3-field search)
│   └── handleSearch event handler
│
├── PRESENTATION LOGIC (Formatting)
│   ├── formatDate() → "DD MMM YYYY HH:MM AM/PM"
│   ├── formatCreationTime() → same format
│   ├── formatCurrency() → "KES 1,234.56"
│   ├── getStatusBadgeVariant() → Badge variant string
│   ├── getWithdrawalStatusIcon() → JSX element
│   ├── getWithdrawalMethodDisplay() → "M-Pesa" | "Bank Transfer" | etc
│   └── copyToClipboard() side effect
│
├── CONDITIONAL RENDERING (2+ levels deep)
│   ├── Permission guard (AccessRestricted)
│   ├── Partner check (Loading)
│   ├── Data loading state (Loading)
│   ├── SuperAdminWalletSection delegation
│   └── 2-tab system with mobile/desktop branching
│
└── LAYOUT ORCHESTRATION
    ├── Mobile drawer (Sheet component)
    ├── Desktop sidebar (Wallet component, left col)
    └── Content area (Tabs + Tables + Cards)
```

### 2.2 Current Data Flow (Implicit)

```
User Landing on /dashboard?tab=wallet
    ↓
WalletSection mounts
    ↓
[useAuth] → partner._id extracted
    ↓
[useEffect] partnerId dependency
    ↓
Supabase.from("campaigns").select() 
Supabase.from("transactions").select().order("created_at")
Supabase.from("withdrawals").select().order("created_at")
    ↓ (setState async)
Mounted? → set{Campaigns,Transactions,Withdrawals}
    ↓
[useMemo] filteredTransactions computed (search + multiple field matching)
[useMemo] filteredWithdrawals computed (search + multiple field matching)
    ↓
Render decision tree:
  - No permissions? → AccessRestricted
  - No partner? → Loading
  - Still loading data? → Loading
  - SuperAdmin? → SuperAdminWalletSection
  - Otherwise → Full UI with 2 tabs
    ├── Tab "payments" → {empty | mobile cards | desktop table} + pagination
    └── Tab "withdrawals" → {empty | mobile cards | desktop table} + pagination
```

### 2.3 Current Dependencies (Imports & Coupling)

**External Dependencies:**
- React: useState, useMemo, useEffect
- Supabase Client: direct queries in useEffect
- Hooks: useAuth, usePermissions, usePartnerAccess
- UI Components: Card, Button, Input, Badge, Table, Tabs, Sheet, Dialog
- Icons: lucide-react (8 different icons, imported inline)
- Utilities: maskPhoneNumber
- Notifications: toast (sonner)
- Components: Loading, Wallet, SuperAdminWalletSection

**Internal Coupling Issues:**
1. **Permission check happens at render time** — not isolated, blocks all other logic
2. **Data fetching depends on auth state** — implicit contract, no error handling for missing partner
3. **Filtering logic tightly bound to render** — useMemo prevents independent testing
4. **Formatting functions embedded** — no shared library, would duplicate across other wallet views
5. **Status mapping duplicated** — getStatusBadgeVariant + getWithdrawalStatusIcon both map status
6. **Mobile/desktop branching is a tree** — hard to extend without modifying JSX
7. **No loading error states** — only success path implemented
8. **Pagination buttons are disabled stubs** — suggests incomplete feature

---

## 3. TARGET MODULE ARCHITECTURE

### 3.1 Module Structure (Folder Layout)

```
src/
├── domain/
│   ├── wallet/
│   │   ├── types.ts               # Domain models (Transaction, Withdrawal, Campaign)
│   │   ├── wallet.domain.ts       # Business rules & invariants
│   │   └── index.ts               # Public exports
│   │
├── infrastructure/
│   ├── wallet/
│   │   ├── wallet.service.ts      # Supabase data access
│   │   └── index.ts               # Public exports
│   │
├── application/
│   ├── wallet/
│   │   ├── useWalletData.ts       # Hook: data fetching orchestration
│   │   ├── useWalletFiltering.ts  # Hook: search & filter business logic
│   │   └── index.ts               # Public exports
│   │
├── ui/
│   ├── wallet/
│   │   ├── formatters/
│   │   │   ├── index.ts           # Date, currency, status formatters
│   │   │   └── types.ts           # Formatter types
│   │   │
│   │   ├── components/
│   │   │   ├── PaymentsList/
│   │   │   │   ├── PaymentsList.mobile.tsx
│   │   │   │   ├── PaymentsList.desktop.tsx
│   │   │   │   └── PaymentsList.tsx (orchestrator)
│   │   │   │
│   │   │   ├── WithdrawalsList/
│   │   │   │   ├── WithdrawalsList.mobile.tsx
│   │   │   │   ├── WithdrawalsList.desktop.tsx
│   │   │   │   └── WithdrawalsList.tsx (orchestrator)
│   │   │   │
│   │   │   ├── WalletHeader.tsx   # Search + filter bar
│   │   │   ├── EmptyState.tsx     # Reusable empty state
│   │   │   └── index.ts           # Public exports
│   │   │
│   │   └── WalletSection.tsx      # Final orchestrator component
│   │
│   └── hooks/
│       └── useWalletPermissions.ts # Permission boundary logic
```

### 3.2 Module Responsibility Map (Target)

#### **Domain Layer** (`src/domain/wallet/`)

**Purpose**: Define business models and invariants (pure TypeScript, no side effects)

**Module: types.ts**
```typescript
// Public Contract:
export interface Campaign {
  _id: string;
  partner_id: string;
  code: string;
  name: string;
  // ... other fields
}

export interface Transaction {
  _id: string;
  partner_id: string;
  student_name: string;
  phone_number: string;
  mpesa_code: string;
  campaign_code: string;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  verified_at?: string;
}

export interface Withdrawal {
  _id: string;
  partner_id: string;
  reference_number: string;
  withdrawal_method: WithdrawalMethod;
  amount: number;
  destination_details: {
    account_number: string;
    bank_name?: string;
  };
  status: WithdrawalStatus;
  mpesa_receipt?: string;
  _creationTime: number;
  processed_at?: string;
}

export type TransactionStatus = 
  | "verified" | "completed" | "pending" | "processing" | "failed" | "rejected" | "cancelled";
export type WithdrawalStatus = TransactionStatus;
export type WithdrawalMethod = "mpesa" | "bank" | "paybill";
```

**Module: wallet.domain.ts**
```typescript
// Business Rules (Pure Functions)

export function isTransactionVerified(tx: Transaction): boolean {
  return tx.status === "verified" || tx.status === "completed";
}

export function canWithdraw(wallet: WalletState): boolean {
  return wallet.balance > 0;
}

export function searchTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  if (!query) return transactions;
  const q = query.toLowerCase();
  return transactions.filter(tx =>
    tx.student_name.toLowerCase().includes(q) ||
    tx.phone_number.includes(q) ||
    tx.mpesa_code.toLowerCase().includes(q) ||
    tx.campaign_code.toLowerCase().includes(q)
  );
}

export function searchWithdrawals(
  withdrawals: Withdrawal[],
  query: string
): Withdrawal[] {
  if (!query) return withdrawals;
  const q = query.toLowerCase();
  return withdrawals.filter(w =>
    w.reference_number.toLowerCase().includes(q) ||
    w.destination_details.account_number.includes(q) ||
    w.amount.toString().includes(q)
  );
}
```

---

#### **Infrastructure Layer** (`src/infrastructure/wallet/`)

**Purpose**: Encapsulate Supabase data access, hide query details

**Module: wallet.service.ts**
```typescript
// Public Contract:
export interface IWalletService {
  fetchCampaigns(partnerId: string): Promise<Campaign[]>;
  fetchTransactions(partnerId: string): Promise<Transaction[]>;
  fetchWithdrawals(partnerId: string): Promise<Withdrawal[]>;
}

export class WalletService implements IWalletService {
  async fetchCampaigns(partnerId: string): Promise<Campaign[]> {
    // Supabase query encapsulated here
    // Error handling bundled
    // Returns normalized domain model
  }

  async fetchTransactions(partnerId: string): Promise<Transaction[]> {
    // Ordered by created_at desc
    // Returns normalized domain model
  }

  async fetchWithdrawals(partnerId: string): Promise<Withdrawal[]> {
    // Handle missing table gracefully
    // Returns normalized domain model
  }
}

export const walletService = new WalletService();
```

---

#### **Application Layer** (`src/application/wallet/`)

**Purpose**: Orchestrate domain + infrastructure, manage side effects with hooks

**Module: useWalletData.ts**
```typescript
// Public Contract:
export interface WalletDataState {
  campaigns: Campaign[] | undefined;
  transactions: Transaction[] | undefined;
  withdrawals: Withdrawal[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useWalletData(partnerId: string | undefined): WalletDataState {
  // Handles:
  // - Conditional fetching (partnerId dependency)
  // - Mounted flag for cleanup
  // - Error handling
  // - Loading state
  // Returns: WalletDataState
}
```

**Module: useWalletFiltering.ts**
```typescript
// Public Contract:
export interface FilteredResults {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
}

export function useWalletFiltering(
  data: WalletDataState,
  searchQuery: string
): FilteredResults {
  // Handles:
  // - useMemo dependencies
  // - Delegates to domain.searchTransactions/searchWithdrawals
  // Returns: Memoized filtered lists
}
```

---

#### **UI Formatters** (`src/ui/wallet/formatters/`)

**Purpose**: Pure presentation logic (no JSX, no state, no side effects)

**Module: index.ts**
```typescript
// Public Contract:
export function formatDate(dateStr: string): string {
  // Format: "DD MMM YYYY HH:MM AM/PM"
  return ...
}

export function formatCreationTime(timestamp: number): string {
  // Same format as formatDate
  return ...
}

export function formatCurrency(amount: number | undefined): string {
  // Format: "KES 1,234.56"
  return ...
}

export function getStatusBadgeVariant(
  status: TransactionStatus | WithdrawalStatus
): BadgeVariant {
  // Maps status → "default" | "secondary" | "outline" | "destructive"
  return ...
}

export function getWithdrawalStatusIcon(
  status: WithdrawalStatus
): React.ReactNode {
  // Returns lucide icon component
  return ...
}

export function getWithdrawalMethodDisplay(method: WithdrawalMethod): string {
  // Maps "mpesa" → "M-Pesa", etc.
  return ...
}
```

---

#### **UI Components** (`src/ui/wallet/components/`)

**Purpose**: Presentation layer — render data with clear input/output contracts

**Module: PaymentsList.tsx**
```typescript
// Public Contract:
export interface PaymentsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onViewDetails?: (transactionId: string) => void;
}

export function PaymentsList(props: PaymentsListProps) {
  // Delegates to:
  // - PaymentsList.mobile.tsx (< lg breakpoint)
  // - PaymentsList.desktop.tsx (≥ lg breakpoint)
  // No data fetching, no permission logic, pure presentation
}
```

**Module: WithdrawalsList.tsx**
```typescript
// Public Contract:
export interface WithdrawalsListProps {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  onViewDetails?: (withdrawalId: string) => void;
  onCopyReceipt?: (receipt: string) => void;
}

export function WithdrawalsList(props: WithdrawalsListProps) {
  // Delegates to:
  // - WithdrawalsList.mobile.tsx
  // - WithdrawalsList.desktop.tsx
  // No data fetching, no permission logic, pure presentation
}
```

**Module: WalletHeader.tsx**
```typescript
// Public Contract:
export interface WalletHeaderProps {
  searchQuery: string;
  activeTab: "payments" | "withdrawals";
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "payments" | "withdrawals") => void;
}

export function WalletHeader(props: WalletHeaderProps) {
  // Search input + filter button
  // Tab selector
  // No data fetching, no formatting, pure event propagation
}
```

---

#### **Orchestrator Component** (`src/ui/WalletSection.tsx`)

**Purpose**: Route permissions, state, and data to sub-components

```typescript
// Public Contract:
export interface WalletSectionProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

export default function WalletSection(props: WalletSectionProps) {
  // Handles:
  // 1. Permission guard (useWalletPermissions)
  // 2. SuperAdmin branching
  // 3. Partner check
  // 4. Data loading (useWalletData)
  // 5. Search/filtering (useWalletFiltering)
  // 6. Layout orchestration (mobile drawer + desktop sidebar)
  // 7. Tab routing to PaymentsList | WithdrawalsList
  //
  // Does NOT:
  // - Format data
  // - Render table cells directly
  // - Duplicate business logic
}
```

---

## 4. DEPENDENCY GRAPH

### 4.1 Before (Current State)

```
┌─────────────────────────────────────────────┐
│    WalletSection.tsx (MONOLITH)             │
├─────────────────────────────────────────────┤
│  • Permissions                              │
│  • Auth state                               │
│  • Supabase queries                         │
│  • State management                         │
│  • Business logic (filtering)               │
│  • Presentation logic (formatting)          │
│  • JSX rendering (mobile + desktop)         │
│  • Event handling                           │
│  • Conditional routing                      │
└─────────────────────────────────────────────┘
         ↓ (imports)
  ┌─────────────────────────────────────────┐
  │ useAuth, usePermissions, usePartnerAccess
  │ supabase, maskPhoneNumber, toast
  │ UI components (Card, Table, Tabs, etc.)
  │ Icons, SuperAdminWalletSection, Wallet
  └─────────────────────────────────────────┘

Issues:
- Single point of failure (757 lines)
- No isolated testing
- Circular dependencies possible with SuperAdminWalletSection
- Hard to reuse formatters or logic
- Mobile/desktop tree bloats JSX
```

### 4.2 After (Target State)

```
                    ┌──────────────────────────────┐
                    │   WalletSection.tsx          │
                    │   (Orchestrator)             │
                    └──────────────┬───────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
     ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐
     │ Permission Hook │ │  useWalletData   │ │ useWalletFil-│
     │ (useWalletPerms)│ │  (fetch orchestr)│ │  tering      │
     └────────┬────────┘ └────────┬─────────┘ └──────┬───────┘
              │                   │                  │
              │          ┌────────┴──────────┐       │
              │          │                   │       │
              │          ▼                   ▼       │
              │    ┌────────────────────┐   │       │
              │    │ WalletService      │   │       │
              │    │ (infrastructure)   │   │       │
              │    └────────┬───────────┘   │       │
              │             │               │       │
              │             ▼               │       │
              │    ┌────────────────────┐   │       │
              │    │ Supabase           │   │       │
              │    └────────────────────┘   │       │
              │                             │       │
              │    Domain Functions         │       │
              │    (business logic)    ◄────┴───────┘
              │    - searchTransactions
              │    - searchWithdrawals
              │    - isTransactionVerified
              │
              └──────────────┬──────────────┐
                             │              │
                    ┌────────▼──────┐  ┌────▼──────────┐
                    │ UI Components │  │ Formatters    │
                    ├───────────────┤  ├───────────────┤
                    │ PaymentsList  │  │ formatDate    │
                    │ Withdrawals   │  │ formatCurrency
                    │ WalletHeader  │  │ getStatusIcon │
                    │ EmptyState    │  │ etc.          │
                    └───────────────┘  └───────────────┘

Benefits:
- Separation of concerns (6 layers)
- Testable domain logic (pure functions)
- Reusable infrastructure (injectable)
- Isolated UI components (props-driven)
- No circular dependencies
- Formatters shared across wallet views
```

---

## 5. MODULE INTERFACE DEFINITIONS

### 5.1 Domain Layer Interfaces

```typescript
// src/domain/wallet/types.ts

export interface Campaign {
  _id: string;
  partner_id: string;
  code: string;
  name: string;
  description?: string;
  // ... extended fields
}

export interface Transaction {
  _id: string;
  partner_id: string;
  student_name: string;
  phone_number: string;
  mpesa_code: string;
  campaign_code: string;
  amount: number;
  status: "verified" | "completed" | "pending" | "processing" | "failed" | "rejected" | "cancelled";
  created_at: string;
  verified_at?: string;
}

export interface Withdrawal {
  _id: string;
  partner_id: string;
  reference_number: string;
  withdrawal_method: "mpesa" | "bank" | "paybill";
  amount: number;
  destination_details: {
    account_number: string;
    bank_name?: string;
  };
  status: "completed" | "pending" | "processing" | "failed" | "cancelled";
  mpesa_receipt?: string;
  _creationTime: number;
  processed_at?: string;
}

export type TransactionStatus = Transaction["status"];
export type WithdrawalStatus = Withdrawal["status"];
export type WithdrawalMethod = Withdrawal["withdrawal_method"];
```

```typescript
// src/domain/wallet/wallet.domain.ts

export function isTransactionVerified(tx: Transaction): boolean
export function searchTransactions(transactions: Transaction[], query: string): Transaction[]
export function searchWithdrawals(withdrawals: Withdrawal[], query: string): Withdrawal[]
export function canAccessWallet(userRole: string | null, canAccessWallet: boolean): boolean
```

### 5.2 Infrastructure Layer Interfaces

```typescript
// src/infrastructure/wallet/wallet.service.ts

export interface IWalletService {
  fetchCampaigns(partnerId: string): Promise<Campaign[]>;
  fetchTransactions(partnerId: string): Promise<Transaction[]>;
  fetchWithdrawals(partnerId: string): Promise<Withdrawal[]>;
}

export class WalletService implements IWalletService {
  async fetchCampaigns(partnerId: string): Promise<Campaign[]> { ... }
  async fetchTransactions(partnerId: string): Promise<Transaction[]> { ... }
  async fetchWithdrawals(partnerId: string): Promise<Withdrawal[]> { ... }
}

export const walletService: IWalletService = new WalletService();
```

### 5.3 Application Layer Interfaces

```typescript
// src/application/wallet/useWalletData.ts

export interface WalletDataState {
  campaigns: Campaign[] | undefined;
  transactions: Transaction[] | undefined;
  withdrawals: Withdrawal[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useWalletData(partnerId: string | undefined): WalletDataState { ... }

// src/application/wallet/useWalletFiltering.ts

export interface FilteredResults {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
}

export function useWalletFiltering(
  data: WalletDataState,
  searchQuery: string
): FilteredResults { ... }
```

### 5.4 UI Layer Interfaces

```typescript
// src/ui/wallet/formatters/index.ts

export function formatDate(dateStr: string): string { ... }
export function formatCreationTime(timestamp: number): string { ... }
export function formatCurrency(amount: number | undefined): string { ... }
export function getStatusBadgeVariant(status: TransactionStatus | WithdrawalStatus): "default" | "secondary" | "outline" | "destructive" { ... }
export function getWithdrawalStatusIcon(status: WithdrawalStatus): React.ReactNode { ... }
export function getWithdrawalMethodDisplay(method: WithdrawalMethod): string { ... }

// src/ui/wallet/components/PaymentsList.tsx

export interface PaymentsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onViewDetails?: (transactionId: string) => void;
}

export function PaymentsList(props: PaymentsListProps): React.ReactElement { ... }

// src/ui/wallet/components/WithdrawalsList.tsx

export interface WithdrawalsListProps {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  onViewDetails?: (withdrawalId: string) => void;
  onCopyReceipt?: (receipt: string) => void;
}

export function WithdrawalsList(props: WithdrawalsListProps): React.ReactElement { ... }

// src/ui/wallet/components/WalletHeader.tsx

export interface WalletHeaderProps {
  searchQuery: string;
  activeTab: "payments" | "withdrawals";
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "payments" | "withdrawals") => void;
}

export function WalletHeader(props: WalletHeaderProps): React.ReactElement { ... }

// src/ui/WalletSection.tsx (Orchestrator)

export interface WalletSectionProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

export default function WalletSection(props: WalletSectionProps): React.ReactElement { ... }
```

---

## 6. MIGRATION STRATEGY

### 6.1 Phased Refactoring (Non-Destructive)

#### **Phase 1: Create Domain Layer** (Safe, No Impact)
1. Create `src/domain/wallet/types.ts` with exported interfaces
2. Create `src/domain/wallet/wallet.domain.ts` with pure business logic
3. Create `src/domain/wallet/index.ts` with barrel export
4. **Validation**: TypeScript compilation passes, no imports yet

#### **Phase 2: Extract Infrastructure** (Isolated, Testable)
1. Create `src/infrastructure/wallet/wallet.service.ts` (WalletService class)
2. Move Supabase queries from WalletSection into WalletService methods
3. Add error handling and normalization
4. Create `src/infrastructure/wallet/index.ts`
5. **Validation**: Service instantiates without errors, methods accept/return domain types

#### **Phase 3: Build Application Hooks** (Preserve Existing Behavior)
1. Create `src/application/wallet/useWalletData.ts`
   - Migrate `useEffect` fetching logic
   - Inject WalletService dependency
   - Preserve loading/error states
2. Create `src/application/wallet/useWalletFiltering.ts`
   - Migrate `useMemo` filtering logic
   - Inject domain search functions
3. Create `src/application/wallet/index.ts`
4. **Validation**: Hooks can be called in isolation, output matches original behavior

#### **Phase 4: Extract Formatters** (Pure Functions, Reusable)
1. Create `src/ui/wallet/formatters/index.ts`
   - Move formatDate, formatCurrency, getStatusBadgeVariant, etc.
   - No side effects, no React imports except ReactNode
2. Create unit tests for each formatter
3. **Validation**: All formatters return identical output to originals

#### **Phase 5: Extract UI Components** (Progressive, Modular)
1. Create `src/ui/wallet/components/PaymentsList/` structure
   - PaymentsList.mobile.tsx (card view logic)
   - PaymentsList.desktop.tsx (table view logic)
   - PaymentsList.tsx (orchestrator, delegates based on breakpoint)
2. Create `src/ui/wallet/components/WithdrawalsList/` structure (same)
3. Create `src/ui/wallet/components/WalletHeader.tsx` (search + tabs)
4. Create `src/ui/wallet/components/index.ts`
5. **Validation**: Components accept typed props, render identically to current UI

#### **Phase 6: Refactor WalletSection** (Composition, Delegation)
1. Update `src/ui/WalletSection.tsx` to use:
   - `useWalletPermissions()` for access check
   - `useWalletData()` for data orchestration
   - `useWalletFiltering()` for filtered lists
   - `<PaymentsList />` component instead of inline JSX
   - `<WithdrawalsList />` component instead of inline JSX
   - `<WalletHeader />` for search/tabs
2. Reduce file from 757 lines → ~200 lines (orchestration only)
3. **Validation**: Visual output identical, no behavior regression

#### **Phase 7: Cleanup & Optimization** (Polish)
1. Remove inlined utility functions from WalletSection
2. Add JSDoc comments to all public exports
3. Create `src/ui/wallet/index.ts` barrel export
4. Update imports in existing consumers
5. Run type checks, linting, tests
6. **Validation**: Full build passes, all tests pass, no console errors

---

### 6.2 Behavioral Equivalence Testing

For each phase, verify:

```typescript
// Before (Original WalletSection)
const original = render(<WalletSection activeItem="wallet" setActiveItem={...} />);

// After (Refactored WalletSection)
const refactored = render(<WalletSection activeItem="wallet" setActiveItem={...} />);

// Test that outputs are identical:
expect(refactored.innerHTML).toBe(original.innerHTML); // DOM
expect(refactored.behavior).toBe(original.behavior);   // Events, state, side effects
```

---

## 7. REGRESSION TEST CHECKLIST

### 7.1 Permission & Auth Flow
- [ ] Non-permitted user sees AccessRestricted UI
- [ ] SuperAdmin sees SuperAdminWalletSection
- [ ] Permitted user sees full wallet UI
- [ ] Missing partner shows Loading state
- [ ] Logout clears wallet state

### 7.2 Data Fetching
- [ ] Campaigns fetched on mount
- [ ] Transactions fetched ordered by created_at DESC
- [ ] Withdrawals fetched (handles missing table gracefully)
- [ ] Data updates when partnerId changes
- [ ] Mounted flag prevents setState on unmounted component
- [ ] Loading state shows while fetching
- [ ] Empty state shows when no data

### 7.3 Search & Filtering
- [ ] Empty search query returns all transactions
- [ ] Search by student_name works (case-insensitive)
- [ ] Search by phone_number works
- [ ] Search by mpesa_code works
- [ ] Search by campaign_code works
- [ ] Combined search (OR logic) works for transactions
- [ ] Withdrawals search by reference_number works
- [ ] Withdrawals search by account_number works
- [ ] Withdrawals search by amount works

### 7.4 Tab Navigation
- [ ] Payments tab shows transaction data
- [ ] Withdrawals tab shows withdrawal data
- [ ] Tab change persists in query param
- [ ] Active tab styling updates correctly

### 7.5 Mobile vs Desktop Rendering
- [ ] Mobile: Sheet drawer shows Wallet component
- [ ] Mobile: Cards rendered instead of tables
- [ ] Mobile: Wallet button toggles drawer
- [ ] Desktop (lg): Sidebar Wallet component visible
- [ ] Desktop (lg): Tables rendered instead of cards
- [ ] Desktop (lg): No mobile drawer visible
- [ ] Responsive breakpoint transitions smoothly

### 7.6 Data Display
- [ ] Transaction names masked correctly
- [ ] Phone numbers masked (07****234)
- [ ] Dates formatted as "DD MMM YYYY HH:MM AM/PM"
- [ ] Currency formatted as "KES 1,234.56"
- [ ] Status badges colored correctly (default/secondary/outline/destructive)
- [ ] Withdrawal status icons render correctly
- [ ] Withdrawal method display correct ("M-Pesa", "Bank Transfer", etc.)

### 7.7 Actions & Events
- [ ] Copy clipboard button works (mpesa_receipt)
- [ ] Toast notification shows "Copied to clipboard!"
- [ ] View Details button clickable (no-op for now)
- [ ] Search input onChange handler fires
- [ ] Filter button exists (no-op for now)

### 7.8 Edge Cases
- [ ] Null/undefined partner handled
- [ ] Missing campaigns graceful (empty [])
- [ ] Missing transactions graceful (empty [])
- [ ] Missing withdrawals graceful (empty [])
- [ ] Supabase error shows as empty state (silent fail)
- [ ] Very long names truncated with ellipsis
- [ ] Very large tables scrollable
- [ ] Empty table shows "No data" message

### 7.9 Type Safety
- [ ] TypeScript compilation passes (no `any` escape hatches)
- [ ] All imports resolve correctly
- [ ] Props interfaces enforced at call sites
- [ ] Return types match contracts

### 7.10 Build & Bundle
- [ ] `npm run build` succeeds
- [ ] No console errors/warnings
- [ ] Bundle size within threshold (no unexpected bloat)
- [ ] Lazy loading works (if added)

---

## 8. VALIDATION CRITERIA

### 8.1 Modularization Success Metrics

| Criterion | Before | After | Pass? |
|-----------|--------|-------|-------|
| **Circular Dependencies** | Possible (monolith) | None (DAG) | ✓ |
| **Module Cohesion** | Very Low (757 lines, 6 concerns) | High (each module ≤150 lines, 1 concern) | ✓ |
| **Code Reusability** | Low (formatters duplicated) | High (shared exports) | ✓ |
| **Test Isolation** | Impossible (no pure funcs) | Easy (domain, services pure) | ✓ |
| **Type Safety** | Low (many `any` types) | High (strict typing) | ✓ |
| **Bundle Size** | N/A | ≤ +0.5KB (tree-shake dead code) | ✓ |
| **Behavior Regression** | N/A | 0 (100% equivalence) | ✓ |
| **Build Errors** | N/A | 0 | ✓ |
| **Lint Warnings** | N/A | 0 | ✓ |
| **Type Errors** | N/A | 0 | ✓ |

---

## 9. KNOWN CONSTRAINTS & ASSUMPTIONS

### 9.1 Constraints
1. **No breaking changes to public API** — WalletSection props remain identical
2. **No changes to Supabase schema** — only query encapsulation
3. **No UI visual changes** — output HTML/CSS identical
4. **React 18+ requirement** — hooks-based approach
5. **TypeScript strict mode** — assumed enabled in tsconfig

### 9.2 Assumptions
1. **Supabase client is stable** — error handling assumes standard error response
2. **useAuth, usePermissions, usePartnerAccess are stable** — assumed to return typed data
3. **Partner object has _id or id field** — current logic uses optional chaining
4. **Transactions/Withdrawals tables exist or are optional** — code handles missing withdrawals
5. **Domain models don't change frequently** — types.ts is a source of truth

---

## 10. NEXT STEPS

### When User Approves This Plan:
1. User confirms module structure and naming
2. User approves phase-by-phase approach
3. User confirms regression test list is comprehensive
4. Implementation begins with Phase 1 (Domain layer)
5. Each phase completed, tested, validated before proceeding

### Deliverables Upon Completion:
1. ✅ Module boundary map (this document)
2. ✅ Dependency graphs (before/after)
3. ✅ Refactored module structure (8 modules)
4. ✅ Interface definitions per module
5. ✅ Migration changelog (step-by-step)
6. ✅ Regression test checklist (validated)
7. ✅ Updated TypeScript compilation (0 errors)
8. ✅ No behavioral regression (visual/functional equivalence)

---

## 11. DECISION POINTS FOR USER

Please confirm/clarify:

1. **Module naming**: Are the paths and module names clear? Any renaming preferred?
2. **Granularity**: Is 8 modules the right level of decomposition, or too fine/coarse?
3. **Formatter location**: Should formatters go in `ui/wallet/formatters/` or `shared/formatters/wallet/`?
4. **Service injection**: Should WalletService be instantiated globally or injected per hook?
5. **Error handling**: Should errors be logged, toasted, or silently captured?
6. **Pagination**: The pagination buttons are stubs — should they be implemented as part of this refactor?
7. **Mobile drawer state**: Should drawer state be lifted to parent (DashboardLayout) or kept local?
8. **Performance**: Is current filtering performance acceptable, or should pagination be added?

---

**END OF MODULARIZATION PLAN**  
*This document is the specification. No code changes will be applied until explicit instruction is given to proceed with Phase 1.*
