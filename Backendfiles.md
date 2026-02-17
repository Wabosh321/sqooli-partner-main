# Backend/API Files Inventory

**Root:** `/vercel/share/v0-project/src`  
**Extensions:** .ts, .tsx, .js, .jsx

## Backend/API File List

### Domain Layer (Type Definitions & Business Logic)
- domain/campaign/types.ts
- domain/wallet/index.ts
- domain/wallet/types.ts
- domain/wallet/wallet.domain.ts

### Infrastructure Layer (Database Services)
- infrastructure/campaign/campaign.service.ts
- infrastructure/program/program.service.ts
- infrastructure/task/task.service.ts
- infrastructure/wallet/index.ts
- infrastructure/wallet/wallet.service.ts

### Supabase Integration & Database Clients
- lib/supabase.ts
- lib/supabaseAuth.ts
- lib/supabaseCRUD.ts
- lib/supabaseClient.ts
- lib/supabaseHelpers.ts
- lib/supabase/dashboard-client.ts
- lib/supabase/dashboard-rpc.service.ts
- lib/supabase/__tests__/dashboard-client.test.ts

### Database CRUD Operations
- lib/analyticsCRUD.ts
- lib/auditCRUD.ts
- lib/campaignsCRUD.ts
- lib/campaignRPC.ts
- lib/convexIdSupport.ts
- lib/curriculaCRUD.ts
- lib/enrollmentsCRUD.ts
- lib/notificationsCRUD.ts
- lib/partnersCRUD.ts
- lib/permissionsCRUD.ts
- lib/programsCRUD.ts
- lib/subjectsCRUD.ts
- lib/transactionsCRUD.ts
- lib/usersCRUD.ts
- lib/walletsCRUD.ts
- lib/withdrawalsCRUD.ts

### Database CRUD Operations (Modules)
- lib/modules/analyticsCRUD.ts
- lib/modules/auditCRUD.ts
- lib/modules/campaignsCRUD.ts
- lib/modules/convexIdSupport.ts
- lib/modules/curriculaCRUD.ts
- lib/modules/enrollmentsCRUD.ts
- lib/modules/notificationsCRUD.ts
- lib/modules/partnersCRUD.ts
- lib/modules/permissionsCRUD.ts
- lib/modules/programsCRUD.ts
- lib/modules/subjectsCRUD.ts
- lib/modules/transactionsCRUD.ts
- lib/modules/usersCRUD.ts
- lib/modules/walletsCRUD.ts
- lib/modules/withdrawalsCRUD.ts

### Authentication & Security
- lib/authDebugger.ts
- lib/authDebuggerHelper.ts

### External Services
- lib/socialMediaService.ts
- lib/subUserService.ts

### Utilities & Helpers
- lib/genericHelpers.ts
- lib/modules/genericHelpers.ts
- lib/maskPhoneNumber.ts
- lib/utils.ts
- lib/devLogger.tsx

## Notes
- Only backend/API/data-layer code included
- Excludes UI components, hooks, contexts, and page layouts
- Includes database services, authentication logic, CRUD operations, and external service integrations
