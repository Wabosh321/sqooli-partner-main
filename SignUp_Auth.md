# SignUp, SignIn & Auth Flow Documentation

## Complete Authentication Workflow Mapping

| #   | FrontendFileName     | File(s)CallingInWorkspace                                  | Function(s)Used                                                                      | IsFunctionInScript/SupabaseWritten       | TargetTable                     | TargetColumn(s)                                                                                                                                                                      | PoliciesInvolved                                                    |
| --- | -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | SignUp.tsx           | src/utils/handleRegister.ts                                | handleRegister()                                                                     | Script                                   | auth.users                      | (created by Supabase Auth)                                                                                                                                                           | N/A - Auth service                                                  |
| 2   | SignUp.tsx           | src/utils/handleRegister.ts                                | supabase.auth.signUp(email, password)                                                | Supabase Client                          | auth.users                      | id, email, encrypted_password, email_confirmed_at                                                                                                                                    | N/A - Auth service                                                  |
| 3   | SignUp.tsx           | src/utils/handleRegister.ts                                | sessionStorage.setItem('pendingRegistration', data)                                  | Script                                   | Browser SessionStorage          | Registration data (firstName, lastName, email, phone, username)                                                                                                                      | N/A - Client-side storage                                           |
| 4   | SignUp.tsx           | Navigation                                                 | navigate('/signIn')                                                                  | Script                                   | N/A                             | N/A                                                                                                                                                                                  | N/A                                                                 |
| 5   | SignIn.tsx           | src/utils/handleAuthWithSupabase.ts                        | handleSignIn(email, password)                                                        | Script                                   | auth.users                      | id, email                                                                                                                                                                            | N/A - Auth service                                                  |
| 6   | SignIn.tsx           | src/utils/handleAuthWithSupabase.ts                        | supabase.auth.signInWithPassword({email, password})                                  | Supabase Client                          | auth.users                      | id, email, encrypted_password                                                                                                                                                        | N/A - Auth service                                                  |
| 7   | SignIn.tsx           | Navigation                                                 | navigate('/select-account'); window.location.reload()                                | Script                                   | N/A                             | N/A                                                                                                                                                                                  | N/A                                                                 |
| 8   | SignIn.tsx           | src/utils/handleAuthWithSupabase.ts (Edge Function option) | fetch('/api/login', POST)                                                            | Script (Edge Function)                   | N/A                             | Custom backend validation                                                                                                                                                            | N/A                                                                 |
| 9   | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | completeUserProfile()                                                                | Script                                   | N/A                             | N/A                                                                                                                                                                                  | N/A                                                                 |
| 10  | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | supabase.auth.getUser()                                                              | Supabase Client                          | auth.users                      | id, email, email_confirmed_at                                                                                                                                                        | N/A - Auth service                                                  |
| 11  | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | supabase.rpc('create_user_profile', {...})                                           | Supabase Client (calls RPC)              | users                           | id, auth_id, email, full_name, phone, username, role                                                                                                                                 | users_self_select, users_self_update (via security definer)         |
| 12  | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | sessionStorage.removeItem('pendingRegistration')                                     | Script                                   | Browser SessionStorage          | N/A                                                                                                                                                                                  | N/A - Client-side storage                                           |
| 13  | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | supabase.from('users').update({partner_role, ...})                                   | Supabase Client                          | users                           | partner_role                                                                                                                                                                         | users_self_update                                                   |
| 14  | AuthCallback.tsx     | src/utils/completeUserProfile.ts                           | supabase.from('partners').insert({...})                                              | Supabase Client                          | partners                        | id, user_id, org_name, org_email, org_phone, partner_type, access_level, commission_rate, wallet_setup_completed, campaign_created, two_factor_setup_completed, onboarding_completed | partners_service_insert, partners_user_select, partners_user_update |
| 15  | AuthCallback.tsx     | Navigation                                                 | navigate('/dashboard', {replace: true})                                              | Script                                   | N/A                             | N/A                                                                                                                                                                                  | N/A                                                                 |
| 16  | SelectAccount.tsx    | supabase.from('partners').select()                         | supabase.from('partners').select('id').or(`org_email.eq.${email},email.eq.${email}`) | Supabase Client                          | partners                        | id, org_email, email, partner_type                                                                                                                                                   | partners_user_select                                                |
| 17  | SelectAccount.tsx    | supabase.from('users').select()                            | supabase.from('users').select('id,role,partner_role,email').eq('email', email)       | Supabase Client                          | users                           | id, role, partner_role, email                                                                                                                                                        | users_self_select                                                   |
| 18  | SelectAccount.tsx    | Navigation                                                 | navigate('/dashboard')                                                               | Script                                   | N/A                             | N/A                                                                                                                                                                                  | N/A                                                                 |
| 19  | Dashboard.tsx        | src/hooks/useAuth.ts                                       | useAuth() hook                                                                       | Script                                   | N/A (triggers auth state check) | N/A                                                                                                                                                                                  | N/A                                                                 |
| 20  | Dashboard.tsx        | src/utils/verifyAuthData.ts                                | initializeAuthContext()                                                              | Script                                   | users, partners                 | id, auth_id, email, role, partner_id, onboarding_completed, partner_type                                                                                                             | users_self_select, partners_user_select                             |
| 21  | Dashboard.tsx        | src/utils/verifyAuthData.ts                                | verifyAuthenticatedUser()                                                            | Script                                   | users                           | id, auth_id, email, role                                                                                                                                                             | users_self_select                                                   |
| 22  | Dashboard.tsx        | src/utils/verifyAuthData.ts                                | fetchPartnerData(userId)                                                             | Script                                   | partners                        | id, user_id, partner_type, onboarding_completed, wallet_setup_completed, campaign_created                                                                                            | partners_user_select                                                |
| 23  | DashboardSection.tsx | supabase.from('campaigns').select()                        | supabase.from('campaigns').select('\*').eq('partner_id', partnerId)                  | Supabase Client                          | campaigns                       | all columns                                                                                                                                                                          | campaigns_user_select                                               |
| 24  | DashboardSection.tsx | supabase.from('wallets').select()                          | supabase.from('wallets').select('\*').eq('partner_id', partnerId).single()           | Supabase Client                          | wallets                         | all columns                                                                                                                                                                          | wallets_user_select                                                 |
| 25  | Header.tsx           | src/hooks/useAuth.ts                                       | useAuth() hook (within component)                                                    | Script                                   | users, partners                 | email, full_name, role, partner_type                                                                                                                                                 | users_self_select, partners_user_select                             |
| 26  | Database Functions   | 02_Functions_and_Triggers.sql                              | create_user_profile(p_auth_id, p_email, p_full_name, p_phone)                        | Supabase SQL Function (SECURITY DEFINER) | users                           | id, auth_id, email, full_name, phone, role, created_at, updated_at                                                                                                                   | users_self_select, users_self_update                                |
| 27  | Database Functions   | 02_Functions_and_Triggers.sql                              | update_updated_at_column()                                                           | Supabase Trigger Function                | Any table with updated_at       | updated_at                                                                                                                                                                           | N/A (auto-trigger)                                                  |
| 28  | Database Functions   | 02_Functions_and_Triggers.sql                              | is_authenticated()                                                                   | Supabase SQL Function                    | auth.users (implicit)           | N/A                                                                                                                                                                                  | N/A                                                                 |
| 29  | Database Functions   | 02_Functions_and_Triggers.sql                              | get_user_partner_id(p_user_id)                                                       | Supabase SQL Function                    | users                           | partner_id (SELECT only)                                                                                                                                                             | N/A                                                                 |
| 30  | Database Functions   | 02_Functions_and_Triggers.sql                              | is_super_admin(p_user_id)                                                            | Supabase SQL Function                    | users                           | role (SELECT only)                                                                                                                                                                   | N/A                                                                 |
| 31  | Database Functions   | 02_Functions_and_Triggers.sql                              | is_partner_admin(p_partner_id)                                                       | Supabase SQL Function                    | partners, users                 | ids (SELECT only)                                                                                                                                                                    | N/A                                                                 |

---

## Authentication Flow Stages

### Stage 1: Registration (SignUp Flow)

- **Entry Point**: [SignUp.tsx](src/pages/SignUp.tsx)
- **Key Function**: `handleRegister()` in [src/utils/handleRegister.ts](src/utils/handleRegister.ts)
- **Process**:
  1. User fills registration form (firstName, lastName, email, phoneNumber, username, password)
  2. Form validation via `validateRegistrationData()`
  3. `supabase.auth.signUp()` creates user in Supabase Auth (auth.users table)
  4. Registration data stored in sessionStorage with key `pendingRegistration`
  5. User directed to [SignIn.tsx](src/pages/SignIn.tsx)
  6. EmailRedirectTo callback set to `/auth/callback` for verification link

### Stage 2: Email Verification

- **Trigger**: User clicks verification link in email
- **Redirect**: `/auth/callback` with authentication code
- **Handler**: [AuthCallback.tsx](src/pages/AuthCallback.tsx)
- **Key Function**: `completeUserProfile()` in [src/utils/completeUserProfile.ts](src/utils/completeUserProfile.ts)
- **Process**:
  1. `supabase.auth.getUser()` retrieves authenticated user from Supabase Auth
  2. Checks `user.email_confirmed_at` to verify email is confirmed
  3. Retrieves registration data from sessionStorage
  4. Calls `supabase.rpc('create_user_profile')` → executes `create_user_profile()` SQL function
  5. Creates user profile in public.users table with columns: auth_id, email, full_name, phone, username, role='member'
  6. Updates users.partner_role with default role based on partnerType
  7. Creates partner record in public.partners table with partner_type and initial onboarding flags
  8. Clears sessionStorage
  9. Redirects to `/dashboard`

### Stage 3: Sign In (Authentication)

- **Entry Point**: [SignIn.tsx](src/pages/SignIn.tsx)
- **Key Function**: `handleSignIn(email, password)` in [src/utils/handleAuthWithSupabase.ts](src/utils/handleAuthWithSupabase.ts)
- **Process**:
  1. User enters email and password
  2. Form validation via `validateLoginData()`
  3. Two options:
     - **Option A (Default)**: `supabase.auth.signInWithPassword()` → authenticates with Supabase Auth
     - **Option B (Edge Function)**: `fetch('/api/login', POST)` → custom backend logic via Edge Function
  4. Session automatically managed by Supabase client
  5. Successful login redirects to `/select-account` with page reload

### Stage 4: Account Selection

- **Entry Point**: [SelectAccount.tsx](src/pages/SelectAccount.tsx)
- **Key Function**: `verifyAccount(accountId)`
- **Process**:
  1. User selects account type: Partner, School, or Teacher
  2. Verification queries:
     - **Partner**: `supabase.from('partners').select('id').or(org_email.eq.${email},email.eq.${email})`
     - **School**: Same query but checks `partner_type IN ['beneficiary', 'school']`
     - **Teacher**: `supabase.from('users').select('id,role,partner_role,email').eq('email', email)` and validates role/partner_role contains 'teacher' or 'instructor'
  3. On success, navigates to `/dashboard`

### Stage 5: Dashboard Access (Authorization)

- **Entry Point**: [Dashboard.tsx](src/pages/Dashboard.tsx)
- **Key Hook**: `useAuth()` in [src/hooks/useAuth.ts](src/hooks/useAuth.ts)
- **Helper Functions**: From [src/utils/verifyAuthData.ts](src/utils/verifyAuthData.ts)
  - `initializeAuthContext()`: Initializes auth state, fetches user & partner data
  - `verifyAuthenticatedUser()`: Validates user from auth.users via session
  - `fetchPartnerData(userId)`: Queries partners table to get partner details
- **RLS Policies Applied**:
  - `users_self_select`: User can view own profile
  - `partners_user_select`: User can view partners they own/manage
  - `campaigns_user_select`: User can view campaigns from their partners
  - `wallets_user_select`: User can view wallets associated with their partners

---

## Key Auth-Related Database Objects

### Tables

- **users**: System users with auth mapping (auth_id UUID → Supabase Auth)
- **partners**: Organization/partner records with onboarding flags
- **campaigns**: Partner marketing campaigns (requires partner_id)
- **wallets**: Partner financial accounts (1:1 relationship with partners)
- **transactions**: Financial records (referenced by campaigns, users, partners)
- **notifications**: User alerts (user_id foreign key)
- **audit_logs**: Activity tracking (user_id foreign key)

### Supabase SQL Functions

- **create_user_profile()**: Creates user record post-email-verification (SECURITY DEFINER)
- **is_authenticated()**: Checks if auth.uid() is not null
- **get_user_partner_id()**: Gets partner_id for a user
- **is_super_admin()**: Checks if user role is 'super_admin'
- **is_partner_admin()**: Checks if user manages a specific partner

### Trigger Functions

- **update_updated_at_column()**: Auto-updates updated_at timestamp on row modification

### RLS Policies (Auth-Related)

- **users_self_select**: `auth.uid() = auth_id`
- **users_self_update**: `auth.uid() = auth_id`
- **partners_service_insert**: Service role INSERT (for function callouts)
- **partners_user_select**: User can view own partners `user_id IN (SELECT id FROM users WHERE auth.uid() = auth_id)`
- **partners_user_update**: User can update own partners
- **campaigns_user_select**: User can view campaigns from their partners (nested query)
- **wallets_user_select**: User can view their partner's wallets
- **notifications_user_select**: User can view own notifications
- **audit_logs_user_select**: User can view own audit logs

---

## Critical Auth Columns

| Table    | Column               | Type      | Purpose                                                 | Auth Dependency    |
| -------- | -------------------- | --------- | ------------------------------------------------------- | ------------------ |
| users    | auth_id              | UUID      | 1:1 reference to Supabase auth.users.id                 | Primary auth key   |
| users    | email                | TEXT      | Unique email for login                                  | Auth identifier    |
| users    | role                 | TEXT      | User role (member, partner, partner_admin, super_admin) | Authorization      |
| users    | email_confirmed_at   | TIMESTAMP | Checked by RLS policies (via Supabase Auth)             | Email verification |
| partners | user_id              | UUID      | Foreign key to users.id                                 | Ownership tracking |
| partners | onboarding_completed | BOOLEAN   | Onboarding step tracking                                | Access control     |
| partners | partner_type         | TEXT      | Partner classification (media, beneficiary)             | Role-based access  |

---

## Session Management Flow

1. **Sign In**: `supabase.auth.signInWithPassword()` → Session stored in Supabase client (secure httpOnly cookie)
2. **Persistent Session**: Client automatically provides auth token in Authorization header for subsequent requests
3. **RLS Enforcement**: Server-side RLS policies check `auth.uid()` from Authorization header before returning rows
4. **Sign Out**: `supabase.auth.signOut()` → Clears session from client and server
5. **Session Check**: `supabase.auth.getUser()` → Returns current authenticated user or null

---

## Error Handling & Edge Cases

| Scenario                            | Handling                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Email already registered            | `supabase.auth.signUp()` returns error → user sees "Email already exists" |
| Email not verified within timeout   | Session remains invalid until email link clicked                          |
| Invalid account type selection      | Query returns no results →`verifyAccount()` returns false → error toast   |
| RLS policy violation                | Supabase returns 403 Forbidden → row not returned                         |
| Partner not found during onboarding | `completeUserProfile()` creates partner with default values, continues    |
| Auth token expired                  | Supabase client handles refresh automatically via Refresh Token           |

---

## Frontend-to-Backend Auth Call Chain

```
SignUp.tsx
  ↓ handleRegister()
  ↓ supabase.auth.signUp() [EMAIL SENT]
  ↓ sessionStorage.setItem()
  ↓ Navigate to SignIn

SignIn.tsx
  ↓ handleSignIn()
  ↓ supabase.auth.signInWithPassword()
  ↓ [SESSION CREATED]
  ↓ Navigate to SelectAccount

SelectAccount.tsx
  ↓ verifyAccount()
  ↓ supabase.from('partners').select() [RLS: partners_user_select]
  ↓ Navigate to Dashboard

Dashboard.tsx
  ↓ useAuth() hook
  ↓ initializeAuthContext()
  ↓ supabase.auth.getUser() + supabase.from('users/partners').select()
  ↓ [RLS: users_self_select, partners_user_select]
  ↓ Render protected dashboard

[Email Verification Link]
  ↓ AuthCallback.tsx
  ↓ completeUserProfile()
  ↓ supabase.auth.getUser() [VERIFIES email_confirmed_at]
  ↓ supabase.rpc('create_user_profile()')
  ↓ [SQL FUNCTION: INSERT users + UPDATE users + INSERT partners]
  ↓ [RLS: partners_service_insert (via SECURITY DEFINER)]
  ↓ Navigate to Dashboard
```
