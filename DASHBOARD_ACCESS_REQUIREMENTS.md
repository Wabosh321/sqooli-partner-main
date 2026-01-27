# Dashboard Access Requirements for Partner/Admin

## Complete Requirements Checklist

### **Requirement 1: Email Verification ✅**
**Status Required:** User must have verified their email

**Where Checked:**
- Not explicitly blocked, but `completeUserProfile()` checks `user.email_confirmed`
- Without verification, `public.users` record is NOT created

**Database Check:**
```typescript
IF auth.users.email_confirmed === false
  → public.users record is EMPTY
  → Dashboard will show NO user data
```

---

### **Requirement 2: User Profile Exists ✅**
**Status Required:** Must have a record in `public.users` table

**Where Checked:**
```typescript
// src/hooks/useAuth.ts
const { data: userData } = await supabase
  .from("users")
  .select("*")
  .eq("email", session.user.email)
  .single();

if (!userData) {
  // User not found → falls back to partners table
  // If BOTH fail → NOT AUTHENTICATED
}
```

**Required Fields in public.users:**
```sql
✅ id (UUID)
✅ auth_id (UUID) - must match auth.users.id
✅ email
✅ full_name (populated by completeUserProfile())
✅ phone (populated by completeUserProfile())
✅ username (populated by completeUserProfile())
✅ role ('member' | 'admin' | 'partner_admin' | 'super_admin')
✅ created_at
✅ updated_at
```

---

### **Requirement 3: User Role Exists ✅**
**Status Required:** User must have a valid role assigned

**Where Checked:**
```typescript
// src/context/PermissionProvider.tsx
if (isConvexUser(user)) {
  setUserRole(user.role as UserRole);  // ← MUST NOT BE NULL
}

// Valid roles for dashboard access:
const validRoles = ["admin", "partner_admin", "super_admin"];
```

**Current Role Assignments:**
| Role | Created By | Permissions |
|------|-----------|-------------|
| `super_admin` | Direct DB insert | Full access to all sections |
| `admin` | Direct DB insert | Full access to all sections |
| `partner_admin` | Direct DB insert | Full access to all sections |
| `member` | handleRegister() default | NO access (locked sections) |
| `partner` | For partner account owners | Needs further configuration |

---

### **Requirement 4: Active Supabase Session ✅**
**Status Required:** Valid Supabase auth session must exist

**Where Checked:**
```typescript
// src/hooks/useAuth.ts
const { data: { session } } = await supabase.auth.getSession();

if (!session?.user) {
  return { user: null, ... }  // ← Protected route redirects to /signIn
}
```

**Session Created By:**
- User signs up with email/password
- Email is verified (clicks link)
- Supabase sets auth session automatically

---

### **Requirement 5: Partner Data (Optional but Recommended) ✅**
**Status Required:** Should have a record in `public.partners` table

**Where Checked:**
```typescript
// src/hooks/useAuth.ts
if (userData.partner_id) {
  const { data: partnerData } = await supabase
    .from("partners")
    .select("*")
    .eq("id", userData.partner_id)
    .single();
  
  setPartner(partnerData);  // ← Used by all dashboard sections
}
```

**Why Important:**
- Dashboard sections (Wallet, Campaigns, Reports) use `partner` data
- Partner table contains org_name, org_email, org_phone, status
- Without partner data, sections will fail or show empty data

---

### **Requirement 6: Protected Route Check ✅**
**Status Required:** User must pass ProtectedRoute validation

**Where Checked:**
```typescript
// src/components/Protected.tsx
export function ProtectedRoute({ children }) {
  const { user, loading, isFirstLogin } = useAuth();
  
  // ❌ FAIL: Not loaded yet
  if (loading) return <Loader />;
  
  // ❌ FAIL: Not authenticated
  if (!user) {
    navigate('/signIn');
    return null;
  }
  
  // ❌ FAIL: First login - must go to onboarding
  if (isFirstLogin && location.pathname !== '/onboarding') {
    navigate('/onboarding');
    return null;
  }
  
  // ✅ PASS: Render children (Dashboard)
  return children;
}
```

---

### **Requirement 7: Permission Checks in Dashboard ✅**
**Status Required:** User role must allow section access

**Where Checked:**
```typescript
// src/pages/Dashboard.tsx
const canAccess = (category: string): boolean => {
  if (!permissions || permissions.length === 0) return false;
  
  // Check if user is admin
  const admin = permissions.some(
    (p) => p.category === "all_access" || p.level === "full"
  );
  if (admin) return true;  // ← Admins access everything
  
  return hasCategory(category);  // ← Check specific category permission
}

// Each section rendered as:
wallet: canAccess("wallet")
  ? <WalletSection />
  : <LockedSection />
```

**Permission Derivation:**
```typescript
// src/context/PermissionProvider.tsx
if (userRole === "super_admin" || userRole === "admin" || userRole === "partner_admin") {
  permissions = [{ category: "all_access", level: "full" }];  // ← Full access
}
```

---

## **Complete Dashboard Access Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SIGNS UP (SignUp.tsx)                               │
│    Input: email, password, firstName, lastName, phone, ...  │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. handleRegister() Creates auth.users                       │
│    ✅ auth.users created in Supabase Auth                    │
│    ✅ Verification email sent                                │
│    ❌ public.users is EMPTY                                  │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS EMAIL VERIFICATION LINK                       │
│    Redirects to: /auth/callback?token=...                    │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. completeUserProfile() Executes (AuthCallback.tsx)        │
│    ✅ Verifies email_confirmed === true                      │
│    ✅ Calls RPC create_user_profile() with:                  │
│       - auth_id, email, full_name, phone, username          │
│    ✅ Creates public.users with role='member'               │
│    ✅ Creates public.partners linked to user_id             │
│    ✅ Redirects to /dashboard                               │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. USER NAVIGATES TO DASHBOARD                              │
│    Route: <ProtectedRoute><DashboardPage /></ProtectedRoute>│
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. ProtectedRoute CHECKS                                     │
│    ✅ loading === false                                      │
│    ✅ user exists (from useAuth)                             │
│    ✅ isFirstLogin === false (already completed onboarding)  │
│    ✅ Renders Dashboard                                      │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Dashboard LOADS (Dashboard.tsx)                           │
│    ✅ useAuth() fetches user from public.users               │
│    ✅ useAuth() fetches partner from public.partners         │
│    ✅ usePermissions() derives permissions from role         │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. RENDER DASHBOARD SECTIONS                                │
│    For each section:                                        │
│    - canAccess() checks user.role                           │
│    - If role='admin'/'partner_admin'/'super_admin':         │
│      Render <Section />                                    │
│    - Else:                                                  │
│      Render <LockedSection />                               │
│                                                             │
│    SECTIONS NEEDING DATA:                                  │
│    - WalletSection uses partner.* data                    │
│    - CampaignSection uses partner.* data                  │
│    - ReportsSection uses partner.* data                   │
│    - UserSection uses user.* data                         │
│    - SettingsSection uses partner.* data                  │
└─────────────────────────────────────────────────────────────┘
```

---

## **The Critical Problem: Role Assignment**

### **Current Issue:**
```typescript
// src/utils/handleRegister.ts
// When user completes profile, role is set to:
p_role = 'member'  // ← This is the DEFAULT

// Result:
if (userRole === 'member') {
  permissions = []  // ← NO permissions
  canAccess = () => false  // ← ALL sections locked
}
```

### **Solution: Role Must Be Changed**

**To access dashboard as admin/partner, user's role must be changed from `'member'` to:**
- `'admin'` - Full access
- `'partner_admin'` - Full access
- `'super_admin'` - Full access

**This must be done MANUALLY via:**

```sql
-- Update user role to admin (requires direct DB access)
UPDATE public.users
SET role = 'admin'
WHERE email = 'user@email.com';
```

**OR via a future admin panel that allows creating users with specific roles.**

---

## **Summary: Minimum Requirements for Dashboard Access**

| # | Requirement | Default | Needed for Partner/Admin |
|---|-------------|---------|------------------------|
| 1 | Email verified | ❌ Default is unverified | ✅ Must be verified |
| 2 | public.users exists | ❌ Created after verification | ✅ Must exist |
| 3 | full_name populated | ❌ Default null | ✅ Must be populated |
| 4 | phone populated | ❌ Default null | ✅ Must be populated |
| 5 | username populated | ❌ Default null | ✅ Must be populated |
| 6 | user.role assigned | ✅ Defaults to 'member' | ❌ MUST BE 'admin'/'partner_admin'/'super_admin' |
| 7 | public.partners exists | ✅ Created by completeUserProfile() | ✅ Must exist |
| 8 | Supabase session valid | ✅ Auto-managed | ✅ Must be active |
| 9 | ProtectedRoute passes | ✅ Auto-managed | ✅ Must pass all checks |

### **The Blocker:**
**Users are created with `role='member'` by default, which gives ZERO dashboard access.**

**To fix this for testing/development:**
1. User completes email verification
2. Admin manually updates their role to `'admin'` in public.users table
3. User refreshes dashboard
4. Dashboard sections now render

**To fix this permanently:**
- Create an admin panel to assign roles on user creation
- Or modify signup flow to collect role selection
- Or create invitation system for team members
