# Supabase CRUD Module Structure

## Overview
The `supabaseCRUD.ts` has been successfully modularized into **12 separate, focused modules** for better code organization, maintainability, and scalability.

## Module Directory Structure

```
src/lib/
├── supabaseCRUD.ts (Main Facade - re-exports all modules)
└── modules/
    ├── genericHelpers.ts       # Generic CRUD operations (listTable, getById, insertRow, etc.)
    ├── convexIdSupport.ts      # Legacy Convex ID support
    ├── partnersCRUD.ts         # Partners operations
    ├── usersCRUD.ts            # Users operations  
    ├── curriculaCRUD.ts        # Curricula operations
    ├── subjectsCRUD.ts         # Subjects operations
    ├── programsCRUD.ts         # Programs operations
    ├── campaignsCRUD.ts        # Campaigns operations
    ├── enrollmentsCRUD.ts      # Program Enrollments operations
    ├── walletsCRUD.ts          # Wallets operations
    ├── transactionsCRUD.ts     # Transactions operations
    ├── withdrawalsCRUD.ts      # Withdrawals operations
    ├── notificationsCRUD.ts    # Notifications operations
    ├── analyticsCRUD.ts        # Analytics & Revenue operations
    ├── permissionsCRUD.ts      # Permissions & Access Control operations
    └── auditCRUD.ts            # Activity Logs & Audit operations
```

## Module Descriptions

### 1. **genericHelpers.ts**
Core CRUD operations used by all other modules.
- `listTable(table, options)` - List all rows with filtering/pagination
- `getById(table, id)` - Get single row by ID
- `insertRow(table, payload)` - Insert new row
- `insertBatch(table, payload)` - Batch insert
- `updateRow(table, id, payload)` - Update row
- `deleteRow(table, id)` - Delete row

### 2. **convexIdSupport.ts**
Legacy support for Convex ID migration.
- `findByConvexId(table, convexId)` - Find by legacy Convex ID
- `upsertWithConvexId(table, convexId, payload)` - Upsert by Convex ID
- `upsertWithConvexIdRelaxed(table, convexId, payload)` - Relaxed upsert (any payload)

### 3. **partnersCRUD.ts**
Partner-related operations.
- `listPartners()`, `getPartner()`, `getPartnerByEmail()`
- `createPartner()`, `updatePartner()`, `deletePartner()`

### 4. **usersCRUD.ts**
User management operations.
- `listUsers()`, `getUser()`, `getUserByEmail()`
- `createUser()`, `updateUser()`, `deleteUser()`

### 5. **curriculaCRUD.ts**
Curriculum management.
- `listCurricula()`, `getCurriculum()`
- `createCurriculum()`, `updateCurriculum()`

### 6. **subjectsCRUD.ts**
Subject management.
- `listSubjects()`, `getSubject()`
- `createSubject()`

### 7. **programsCRUD.ts**
Program management.
- `listPrograms()`, `getProgram()`
- `createProgram()`, `updateProgram()`

### 8. **campaignsCRUD.ts**
Campaign management.
- `listCampaigns()`, `getCampaign()`, `getCampaignsByPartner()`
- `createCampaign()`, `updateCampaign()`, `deleteCampaign()`

### 9. **enrollmentsCRUD.ts**
Program enrollment operations.
- `listEnrollments()`, `getEnrollment()`, `getEnrollmentsByCampaign()`
- `createEnrollment()`

### 10. **walletsCRUD.ts**
Wallet management.
- `listWallets()`, `getWallet()`, `getWalletByPartnerId()`
- `createWallet()`, `updateWallet()`

### 11. **transactionsCRUD.ts**
Transaction tracking.
- `listTransactions()`, `getTransaction()`, `getTransactionsByWallet()`
- `createTransaction()`

### 12. **withdrawalsCRUD.ts**
Withdrawal operations.
- `listWithdrawals()`, `getWithdrawal()`, `getWithdrawalsByPartner()`
- `createWithdrawal()`, `updateWithdrawal()`
- `approveWithdrawal()`, `rejectWithdrawal()`

### 13. **notificationsCRUD.ts**
Notification management.
- `listNotifications()`, `getNotification()`, `getUnreadCount()`
- `createNotification()`, `markAsRead()`, `markAllAsRead()`
- `deleteNotification()`, `deleteReadNotifications()`

### 14. **analyticsCRUD.ts**
Analytics and revenue reporting.
- `listPartnerRevenue()`, `getRevenueByPartner()`, `createPartnerRevenue()`
- `getPartnerEarningsSummary()`, `getSystemEarningsTimeline()`
- `getTopEarningPartners()`

### 15. **permissionsCRUD.ts**
Permission and access control.
- `getPermissions()`, `createPermission()`
- `updatePermission()`, `deletePermission()`

### 16. **auditCRUD.ts**
Activity logs and audit trail.
- `createActivityLog()`, `getActivityLogs()`

## Main Entry Point: supabaseCRUD.ts

The main facade re-exports all functions from individual modules for backward compatibility:

```typescript
// All exports available for direct access
export { listTable, getById, insertRow, ... } from './modules/genericHelpers';
export { findByConvexId, upsertWithConvexId, ... } from './modules/convexIdSupport';
// ... and all other modules

// Plus default export containing all functions
export default { listTable, getById, ... }
```

## Benefits

✅ **Better Organization** - Related functions grouped by domain
✅ **Improved Maintainability** - Each module has single responsibility
✅ **Easier Testing** - Modules can be tested independently
✅ **Reduced Complexity** - No single large file (~900 lines → ~40-100 lines per module)
✅ **Scalability** - Easy to add new modules without affecting existing code
✅ **Backward Compatibility** - Main facade ensures existing imports still work

## Type Safety

All modules use:
- Type-only imports for TypeScript types (compliant with `verbatimModuleSyntax`)
- Proper error handling with `SupabaseResponse<T>`
- Generic helper functions that accept flexible payloads

## Import Examples

```typescript
// Option 1: Direct module imports (recommended)
import { listUsers, createUser } from '@/lib/modules/usersCRUD';

// Option 2: From main facade
import { listUsers, createUser } from '@/lib/supabaseCRUD';

// Option 3: Default export
import supabase from '@/lib/supabaseCRUD';
const users = await supabase.listUsers();
```

## No Breaking Changes

All existing code continues to work without modification since the main `supabaseCRUD.ts` file re-exports all functions with the same signatures.
