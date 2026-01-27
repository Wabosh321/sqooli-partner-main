# Users & Partners Table Relationship - Complete Data Flow

## Database Schema Relationship

```
┌─────────────────────────────────┐
│      auth.users (Supabase)      │
│  - id (auth_id)                 │
│  - email                         │
│  - encrypted_password            │
│  - email_confirmed               │
└────────────────┬────────────────┘
                 │ auth_id (FK)
                 ▼
┌─────────────────────────────────┐
│    public.users (Database)      │
│  - id (UUID)                    │
│  - auth_id (UUID) ◄─ links here │
│  - email                        │
│  - full_name                    │
│  - phone                        │
│  - username                     │
│  - role ('member'/'admin')      │
│  - created_at                   │
│  - updated_at                   │
└────────────────┬────────────────┘
                 │ user_id (FK)
                 │ (ONE user → ONE OR MANY partners)
                 ▼
┌─────────────────────────────────┐
│     public.partners             │
│  - id (UUID)                    │
│  - user_id (UUID) ◄─ links here │
│  - org_name                     │
│  - org_email                    │
│  - org_phone                    │
│  - status                       │
│  - created_at                   │
│  - updated_at                   │
└─────────────────────────────────┘
```

---

## User Registration & Profile Creation Flow

### Step 1: User Clicks "Sign Up" (SignUp.tsx)
```
User enters:
  - Email
  - Password
  - First Name / Last Name
  - Phone Number
  - Username
```

### Step 2: handleRegister() Executes
**File: `src/utils/handleRegister.ts`**

```typescript
1. Validates all input
2. Calls supabase.auth.signUp({ email, password })
   → Creates record in auth.users table
   → Sends verification email to user
3. Stores registration data in sessionStorage:
   sessionStorage.setItem('pendingRegistration', JSON.stringify(data))
4. Returns success message: "Check your email to verify"
5. User redirected to verify-email page
```

**Database State After Step 2:**
- ✅ auth.users: record created with email + password
- ❌ public.users: EMPTY (not created yet)
- ❌ public.partners: EMPTY (not created yet)

### Step 3: User Clicks Email Verification Link
Supabase sends email with verification link:
```
https://yourapp.com/auth/callback?token=...&type=email
```

User clicks → redirected to callback handler

### Step 4: completeUserProfile() Must Be Called
**File: `src/utils/completeUserProfile.ts`**

This function:
1. Checks if user is authenticated: `auth.getUser()`
2. Verifies email is confirmed: `user.email_confirmed === true`
3. Retrieves stored data from sessionStorage
4. Calls RPC function: `create_user_profile()`
   - Pass: auth_id, email, full_name, phone, username
   - RPC inserts into public.users
5. Creates corresponding partners record

**Database State After Step 4:**
- ✅ auth.users: verified
- ✅ public.users: created with all details (full_name, phone, username, role='member')
- ✅ public.partners: created with org_name from user's full_name

---

## How Dashboard.tsx Uses This Data

### Dashboard.tsx Flow:

```tsx
export default function DashboardPage() {
  // 1. Gets currently logged-in user from Supabase
  // 2. usePermissions() hook fetches permissions based on user role
  // 3. Renders sections based on canAccess() function
}
```

### useAuth() Hook (src/hooks/useAuth.ts) - Core Logic

When user navigates to Dashboard:

```
1. Gets Supabase session: supabase.auth.getSession()
2. Searches for user in public.users table:
   SELECT * FROM public.users WHERE email = session.user.email
3. If found:
   - Extracts: id, email, role, full_name, phone
   - Stores in: supabaseUser state
4. Fetches partner data:
   - Uses user.partner_id or searches by user_id
   - Stores in: partner state
```

### Data Structure in Dashboard Context:

```typescript
useAuth() returns:
{
  user: {
    id: "uuid",           // from public.users.id
    email: "user@email.com",
    role: "member" | "admin",
    full_name: "John Doe",
    phone: "+254712345678",
    username: "johndoe"
  },
  partner: {
    id: "uuid",
    user_id: "uuid",      // FK to public.users.id
    org_name: "John Doe",
    org_email: "user@email.com",
    org_phone: "+254712345678",
    status: "active"
  },
  loading: false,
  error: null
}
```

### Dashboard Section Access Control:

```typescript
const canAccess = (category: string): boolean => {
  // Uses user.role from public.users table
  // Checks permissions based on role
  // Returns true/false to render section
}

// Example:
wallet: canAccess("wallet")
  ? <WalletSection />           // Can access
  : <LockedSection />           // Locked
```

### Sections That Use User/Partner Data:

| Section | Uses | Data From |
|---------|------|-----------|
| DashboardSection | user, partner | useAuth() |
| WalletSection | partner | useAuth().partner |
| UserSection | user, partner | useAuth() |
| SettingsSection | partner | useAuth().partner |
| ReportsSection | partner | useAuth().partner |
| CampaignSection | user, partner | useAuth() |

---

## Critical Issue: Missing Email Verification Callback

### ❌ CURRENT PROBLEM:

1. ✅ User signs up → auth.users created
2. ✅ Verification email sent
3. ❌ **NO CALLBACK ROUTE** to handle email verification
4. ❌ completeUserProfile() is never called
5. ❌ public.users stays EMPTY
6. ❌ Dashboard loads but user data is missing

### ✅ SOLUTION NEEDED:

**Create email callback handler in App.tsx or new route:**

```tsx
// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeUserProfile } from '../utils/completeUserProfile';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase automatically handles token exchange
      // Now complete the profile
      const result = await completeUserProfile();
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        navigate('/signUp', { 
          state: { error: result.message } 
        });
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Verifying email...</div>;
}
```

**Add route to App.tsx:**

```tsx
const routes = [
  {path:"/", element:<Hero />},
  {path:'signIn', element:<SignIn />},
  {path:'signUp', element:<SignUp />},
  {path:'auth/callback', element:<AuthCallback />},  // ← ADD THIS
  {path:'onboarding', element:<ProtectedRoute><OnboardingPage /></ProtectedRoute>},
  {path:'dashboard', element:<ProtectedRoute><DashboardPage /></ProtectedRoute>},
  {path: '*', element: <NotFound />}
]
```

**Configure Supabase to redirect here:**

In Supabase Dashboard → Authentication → URL Configuration:
```
Redirect URL: https://yourapp.com/auth/callback
```

---

## Data Retrieval Priority (useAuth.ts)

When user accesses Dashboard:

```
PRIORITY 1: Check public.users table
  IF found → Use as primary user (team member/admin)
  
PRIORITY 2: Check public.partners table
  IF found → User is partner account owner
```

This allows:
- **Partners** (account owners) to access dashboard
- **Team Members** (users added to a partner's team) to also access dashboard

---

## Summary Table

| Step | Component | Table | Action | Result |
|------|-----------|-------|--------|--------|
| 1 | SignUp.tsx | auth.users | CREATE | User can sign in |
| 2 | handleRegister.ts | sessionStorage | STORE | Data preserved |
| 3 | Email verification | auth.users | UPDATE email_confirmed | Email marked verified |
| 4 | AuthCallback.tsx | public.users | CREATE | User profile visible |
| 5 | completeUserProfile() | public.partners | CREATE | Partner account set up |
| 6 | Dashboard.tsx / useAuth() | public.users + public.partners | SELECT | Data loaded for dashboard |

---

## Key Takeaway

**The two tables serve different purposes:**

- **public.users**: Identity & access control (who are you? what can you do?)
- **public.partners**: Organization & business data (what company? contact info?)

**Dashboard depends on BOTH:**
- Uses `user.role` for permission checks
- Uses `partner.*` for business context (wallet, campaigns, org name, etc.)

**Without completing Step 4 (email verification callback), the user reaches a broken state where they're authenticated but have no profile data.**
