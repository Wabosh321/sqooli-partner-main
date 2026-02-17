# Script-to-Supabase Function Migration Plan

## Frontend Script Functions to Migrate to Supabase RPCs

| FrontendFileWithFunctionInScript | FileCallingInWorkspace              | FunctionBothInCallerandCalledScript | FunctionInFrontendScript                                 | TargetTable                 | TargetColumns                                                                                                                                                                                                                                                         | FunctionDefinition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Phase   |
| -------------------------------- | ----------------------------------- | ----------------------------------- | -------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| completeUserProfile.ts           | AuthCallback.tsx                    | N/A                                 | completeUserProfile(registrationData?: RegisterFormData) | users, partners             | users: (auth_id, email, full_name, phone, username, role, partner_role); partners: (user_id, org_name, org_email, org_phone, partner_type, access_level, commission_rate, wallet_setup_completed, campaign_created, two_factor_setup_completed, onboarding_completed) | **RPC: complete_onboarding_profile()** - PARAMS: p_auth_id UUID, p_email TEXT, p_full_name TEXT, p_phone TEXT, p_username TEXT, p_partner_type TEXT - LOGIC: (1) Check email_confirmed_at, (2) INSERT INTO users (auth_id, email, full_name, phone, username, role='member', partner_role), (3) INSERT INTO partners (user_id, org_name, org_email, org_phone, partner_type, access_level=25, commission_rate=5.00, wallet_setup_completed=false, campaign_created=false, two_factor_setup_completed=false, onboarding_completed=false) - RETURNS: TABLE(user_id UUID, partner_id UUID, success BOOLEAN) - SECURITY: DEFINER with RLS bypass for service operations                | Phase 1 |
| completeUserProfile.ts           | AuthCallback.tsx                    | N/A                                 | supabase.from('users').update()                          | users                       | partner_role                                                                                                                                                                                                                                                          | **RPC: update_user_partner_role()** - PARAMS: p_user_id UUID, p_partner_role TEXT - LOGIC: UPDATE users SET partner_role = p_partner_role WHERE id = p_user_id - RETURNS: TABLE(id UUID, partner_role TEXT) - SECURITY: DEFINER (consolidate into complete_onboarding_profile)                                                                                                                                                                                                                                                                                                                                                                                                     | Phase 1 |
| SelectAccount.tsx                | verifyAccount()                     | N/A                                 | verifyAccount(accountId: string)                         | partners, users             | partners: (id, partner_type, email, org_email); users: (id, role, partner_role, email)                                                                                                                                                                                | **RPC: verify_account_type()** - PARAMS: p_auth_id UUID, p_account_type TEXT - LOGIC: (1) IF p_account_type='partner': SELECT id FROM partners WHERE user_id IN (SELECT id FROM users WHERE auth_id=p_auth_id AND (org_email=auth.email() OR email=auth.email())), (2) IF p_account_type='school': SELECT id FROM partners WHERE user_id IN (SELECT id FROM users WHERE auth_id=p_auth_id) AND partner_type IN ('beneficiary', 'school'), (3) IF p_account_type='teacher': SELECT id FROM users WHERE auth.uid()=auth_id AND (role='teacher' OR partner_role IN ('teacher', 'instructor')) - RETURNS: TABLE(account_exists BOOLEAN, account_id UUID) - SECURITY: STABLE, RLS-aware | Phase 2 |
| verifyAuthData.ts                | useAuth.ts / Dashboard.tsx          | N/A                                 | initializeAuthContext()                                  | users, partners             | users: (id, auth_id, email, role, partner_id, partner_role, is_first_login); partners: (id, user_id, partner_type, onboarding_completed, wallet_setup_completed, campaign_created, access_level)                                                                      | **RPC: get_auth_context()** - PARAMS: p_auth_id UUID - LOGIC: (1) SELECT u.id, u.auth_id, u.email, u.role, u.partner_id, u.partner_role, u.is_first_login FROM users u WHERE u.auth_id = p_auth_id, (2) LEFT JOIN partners p ON u.id = p.user_id, (3) RETURN user record + partner record - RETURNS: TABLE(user_id UUID, email TEXT, role TEXT, partner_id UUID, partner_role TEXT, is_first_login BOOLEAN, partner_type TEXT, partner_onboarding_completed BOOLEAN, wallet_setup_completed BOOLEAN, campaign_created BOOLEAN, access_level INTEGER) - SECURITY: STABLE, uses auth.uid() for authorization                                                                         | Phase 3 |
| verifyAuthData.ts                | useAuth.ts / Dashboard.tsx          | N/A                                 | verifyAuthenticatedUser()                                | users                       | users: (id, auth_id, email, role)                                                                                                                                                                                                                                     | **RPC: verify_authenticated_user()** - PARAMS: p_auth_id UUID - LOGIC: (1) SELECT id, auth_id, email, role FROM users WHERE auth_id = p_auth_id AND auth.uid() NOT NULL, (2) Ensure user exists in auth context - RETURNS: TABLE(user_id UUID, email TEXT, role TEXT, auth_confirmed BOOLEAN) - SECURITY: STABLE, RLS-protected - NOTE: Consolidate into get_auth_context()                                                                                                                                                                                                                                                                                                        | Phase 3 |
| verifyAuthData.ts                | useAuth.ts / Dashboard.tsx          | N/A                                 | fetchPartnerData(userId: UUID)                           | partners                    | partners: (id, user_id, partner_type, onboarding_completed, wallet_setup_completed, campaign_created, access_level, commission_rate, is_first_login, onboarding_metadata)                                                                                             | **RPC: get_partner_profile()** - PARAMS: p_user_id UUID - LOGIC: (1) SELECT \* FROM partners WHERE user_id = p_user_id AND user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id), (2) Return all partner columns - RETURNS: TABLE (all partners columns) - SECURITY: STABLE, RLS-protected with user ownership check - NOTE: Consolidate into get_auth_context()                                                                                                                                                                                                                                                                                                            | Phase 3 |
| handleRegister.ts                | SignUp.tsx                          | N/A                                 | handleRegister(data: RegisterFormData)                   | Browser SessionStorage only | Registration data (firstName, lastName, email, phone, username)                                                                                                                                                                                                       | **Frontend-only wrapper** - PARAMS: data RegisterFormData - LOGIC: (1) Validate via validateRegistrationData(), (2) Call supabase.auth.signUp(), (3) Store in sessionStorage('pendingRegistration'), (4) Return success message - NOTE: Keep frontend-side for form coordination, but move sessionStorage to local variable or IndexedDB for better security                                                                                                                                                                                                                                                                                                                       | Phase 5 |
| DashboardSection.tsx             | supabase.from('campaigns').select() | N/A                                 | Direct Supabase query in component                       | campaigns                   | all columns (id, partner_id, program_id, channel_id, name, description, status, target_signups, current_amount, commission_rate, start_date, end_date, duration_start, duration_end, metadata)                                                                        | **RPC: get_partner_campaigns()** - PARAMS: p_partner_id UUID - LOGIC: (1) SELECT \* FROM campaigns WHERE partner_id = p_partner_id AND partner_id IN (SELECT id FROM partners WHERE user_id IN (SELECT id FROM users WHERE auth.uid()=auth_id)), (2) ORDER BY created_at DESC - RETURNS: TABLE (all campaigns columns) - SECURITY: STABLE, RLS-protected - OPTIONAL: Can migrate for consistency but not critical                                                                                                                                                                                                                                                                  | Phase 4 |
| DashboardSection.tsx             | supabase.from('wallets').select()   | N/A                                 | Direct Supabase query in component                       | wallets                     | all columns (id, partner_id, user_id, balance, total_earned, bank_name, account_number, account_holder, status, withdrawal_method, paybill_number, beneficiaries, metadata)                                                                                           | **RPC: get_partner_wallet()** - PARAMS: p_partner_id UUID - LOGIC: (1) SELECT \* FROM wallets WHERE partner_id = p_partner_id AND partner_id IN (SELECT id FROM partners WHERE user_id IN (SELECT id FROM users WHERE auth.uid()=auth_id)) - RETURNS: SETOF wallets (single row or null) - SECURITY: STABLE, RLS-protected - OPTIONAL: Can migrate for consistency but not critical                                                                                                                                                                                                                                                                                                | Phase 4 |

---

## Migration Phases & Implementation Order

### Phase 1: Profile Creation + Onboarding Inserts

**Goal**: Consolidate completeUserProfile() multi-step operations into atomic SQL function

**RPCs to Create**:

- `complete_onboarding_profile(p_auth_id UUID, p_email TEXT, p_full_name TEXT, p_phone TEXT, p_username TEXT, p_partner_type TEXT)`
  - Atomically creates user profile + partner record
  - Replaces separate user INSERT + user UPDATE + partner INSERT
  - Returns (user_id, partner_id, success)
  - SECURITY DEFINER to bypass RLS for initial profile creation

**Files to Modify**:

- [src/utils/completeUserProfile.ts](src/utils/completeUserProfile.ts) - Replace lines 37-105 with single RPC call
- [src/pages/AuthCallback.tsx](src/pages/AuthCallback.tsx) - Update to use new RPC response structure

**Benefits**:

- Atomic transaction (all-or-nothing)
- Removes sessionStorage dependency for registration data (move to client-side variable)
- Single network roundtrip instead of 3+ separate calls
- Server-side validation of partner_type available for future expansions

---

### Phase 2: Partner/Account Selection Verification

**Goal**: Move verifyAccount() business logic to database layer

**RPCs to Create**:

- `verify_account_type(p_auth_id UUID, p_account_type TEXT)`
  - Centralized verification logic (Partner/School/Teacher checks)
  - Returns account_exists BOOLEAN, account_id UUID
  - Replaces inline query logic in SelectAccount.tsx

**Files to Modify**:

- [src/pages/SelectAccount.tsx](src/pages/SelectAccount.tsx) - Replace verifyAccount() function with RPC call

**Benefits**:

- Single source of truth for account verification logic
- Easier to add new account types in future
- RLS-protected at database level
- Cleaner frontend code (less business logic)

---

### Phase 3: Dashboard Auth Initialization + Partner Data Fetch

**Goal**: Consolidate multiple auth data fetches into single RPC call

**RPCs to Create**:

- `get_auth_context()`
  - Replaces initializeAuthContext() + verifyAuthenticatedUser() + fetchPartnerData()
  - Single call returns user + partner data
  - Internally handles RLS checks via auth.uid()
  - RETURNS: (user_id, email, role, partner_id, partner_role, is_first_login, partner_type, partner_onboarding_completed, wallet_setup_completed, campaign_created, access_level)

**Files to Modify**:

- [src/utils/verifyAuthData.ts](src/utils/verifyAuthData.ts) - Replace initializeAuthContext() function body with RPC call
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts) - Update to use simplified get_auth_context()

**Benefits**:

- 3 database calls → 1 call
- Faster dashboard load time
- Cleaner permission/access level data pipeline
- Easier to debug auth state issues (centralized RPC logic)

---

### Phase 4: Campaign & Wallet Fetch Consolidation (Optional)

**Goal**: Migrate dashboard data queries to RPCs for consistency (optional, not critical)

**RPCs to Create** (Optional):

- `get_partner_campaigns(p_partner_id UUID)` - Cached at REST API level for performance
- `get_partner_wallet(p_partner_id UUID)` - Cached at REST API level for performance

**Files to Modify**:

- [src/sections/DashboardSection.tsx](src/sections/DashboardSection.tsx) - Replace supabase.from().select() calls with RPC calls

**Benefits**:

- Centralized dashboard data layer
- Easier to add computed fields (e.g., campaign performance metrics)
- Single RLS enforcement point
- Simpler to add caching/revalidation logic

**Note**: Can be deferred since direct RLS-protected queries are already sufficient; this phase improves maintainability only.

---

### Phase 5: Final Cleanup & Deprecation

**Goal**: Remove no-longer-needed script functions and improve security

**Changes**:

- [src/utils/handleRegister.ts](src/utils/handleRegister.ts) - Keep wrapper for form coordination, but move sessionStorage to local state or IndexedDB
- [src/utils/completeUserProfile.ts](src/utils/completeUserProfile.ts) - Deprecate; use RPC directly in AuthCallback.tsx
- [src/utils/verifyAuthData.ts](src/utils/verifyAuthData.ts) - Deprecate initializeAuthContext(), keep as wrapper if needed
- Remove validateRegistrationData() and validateLoginData() references from backend (frontend-only validation is fine)

**Files to Remove**:

- (Optional) src/utils/completeUserProfile.ts → Inline simple RPC wrapper into AuthCallback.tsx
- (Optional) Extract initializeAuthContext() into useAuth.ts hook directly

**Benefits**:

- Reduced frontend code complexity
- Improved maintainability (business logic centralized in database)
- Better security (validation and data mutations server-side)
- Easier future migrations (less scattered logic)

---

## RLS Policy Adjustments Required

### New Policies Needed:

| Policy Name                    | Table    | Purpose                                            | Condition                                                    |
| ------------------------------ | -------- | -------------------------------------------------- | ------------------------------------------------------------ |
| users_rpc_create               | users    | Allow service role to insert via RPC               | `true` (service role only)                                   |
| partners_rpc_create            | partners | Allow service role to insert via RPC               | `true` (service role only)                                   |
| users_rpc_read_auth_context    | users    | Allow authenticated users to read own auth context | `auth.uid() = auth_id`                                       |
| partners_rpc_read_auth_context | partners | Allow authenticated users to read own partner      | `user_id IN (SELECT id FROM users WHERE auth.uid()=auth_id)` |

### Existing Policies That Will Still Apply:

- users_self_select / users_self_update
- partners_user_select / partners_user_update
- campaigns_user_select
- wallets_user_select
- All query-only RLS policies (no new write policies needed since RPC functions use SECURITY DEFINER)

---

## Migration Dependencies & Critical Path

```
Phase 1: complete_onboarding_profile()
  ↓
Phase 2: verify_account_type()
  ↓
Phase 3: get_auth_context() [Blocking: useAuth.ts hook refactor]
  ↓
Phase 4: get_partner_campaigns(), get_partner_wallet() [Optional]
  ↓
Phase 5: Code cleanup & deprecation
```

**Critical Path** (must complete in order):

1. Phase 1 → Phase 3 (auth flow must work end-to-end)
2. Phase 2 (can run parallel with Phase 1)
3. Phase 4 → Phase 5 (cleanup after core migrations)

**Estimated Effort**:

- Phase 1: 2-3 hours (RPC + test + client integration)
- Phase 2: 1-2 hours (RPC + SelectAccount.tsx update)
- Phase 3: 2-3 hours (RPC + useAuth.ts refactor + test)
- Phase 4: 1-2 hours (optional, 2 RPCs)
- Phase 5: 1 hour (cleanup + deprecation)

**Total**: 7-11 hours

---

## Implementation Checklist

- [ ] Phase 1: Create complete_onboarding_profile() RPC in 02_Functions_and_Triggers.sql
- [ ] Phase 1: Test RPC with manual queries
- [ ] Phase 1: Update completeUserProfile.ts to call RPC
- [ ] Phase 1: Update AuthCallback.tsx to handle new RPC response
- [ ] Phase 2: Create verify_account_type() RPC
- [ ] Phase 2: Update SelectAccount.tsx verifyAccount() function
- [ ] Phase 2: Test account selection flow (Partner/School/Teacher paths)
- [ ] Phase 3: Create get_auth_context() RPC
- [ ] Phase 3: Refactor useAuth.ts to use get_auth_context()
- [ ] Phase 3: Test dashboard auth state initialization
- [ ] Phase 4 (Optional): Create get_partner_campaigns() and get_partner_wallet() RPCs
- [ ] Phase 4 (Optional): Update DashboardSection.tsx queries
- [ ] Phase 5: Remove/deprecate old functions
- [ ] Phase 5: Update documentation
- [ ] Full integration test: SignUp → Email Verify → SignIn → Account Select → Dashboard (full flow)
