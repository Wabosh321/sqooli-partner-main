# Permission Flow Architecture - Admin Partner Full Access

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users table                                                     │
│  ├─ id: 3c5bfe77-4b49-452c-80bc-9513167cda3f                   │
│  ├─ email: maxwellmutonyiwabomba@gmail.com                      │
│  ├─ role: admin_partner ◄──┐                                    │
│  └─ partner_id: f74b13a5... │                                   │
│                              │                                   │
│  partners table              │                                   │
│  ├─ id: f74b13a5...         │                                   │
│  ├─ partner_type: media ─────┼──────┐                           │
│  └─ access_level: 100 ───────┼──┐   │                           │
│                              │  │   │                           │
│  partner_type_permissions    │  │   │                           │
│  ├─ partner_type_slug: partner │ │  │                           │
│  └─ 35 permissions ◄──────────┘ │  │                           │
│                                  │  │                           │
│  partner_type_roles             │  │                           │
│  ├─ partner_type_slug: partner  │  │                           │
│  └─ role_name: admin_partner ────┘  │                           │
│     (permissions: {...}) ───────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Permission Resolution Flow

### 1. Authentication Layer
```
useAuth() Hook
├─ Returns: user (3c5bfe77...) with role = "admin_partner"
├─ Returns: partner with partner_type = "media", access_level = 100
└─ Provides: loginMethod, loading state
```

### 2. Permission Context Provider
```
PermissionProvider
│
├─ Extract user role: "admin_partner"
│
├─ Check Priority 1: Is admin_partner?
│  └─ YES ✅ → Return ["all_access"] permission
│
├─ (if not admin) Check Priority 2: Check access_level
│  └─ NO (because admin_partner returned early)
│
└─ (if not admin) Check Priority 3: Check partner_type
   └─ NO (because admin_partner returned early)

Result: Permissions = [
  { _id: "all_access", key: "all_access", category: "all_access", level: "full" }
]
```

### 3. Permission Hook
```
usePermissions() Hook
│
├─ canRead("campaigns") 
│  └─ Checks: permission.level === "full" OR category === "all_access"
│  └─ Result: true ✅
│
├─ canWrite("campaigns")
│  └─ Checks: permission.level === "full" OR category === "all_access"
│  └─ Result: true ✅
│
├─ hasPermission("manage_campaigns")
│  └─ Checks: permission.category === "all_access" OR level === "full"
│  └─ Result: true ✅
│
└─ isSuperAdmin()
   └─ Checks: userRole === "super_admin"
   └─ Result: false (but full access via "all_access")
```

### 4. Partner Access Hook
```
usePartnerAccess() Hook
│
├─ Extract: userRole = "admin_partner"
│
├─ Check Priority 1: Is admin_partner or super_admin?
│  └─ YES ✅ → Return all sections:
│     ["dashboard", "campaigns", "wallet", "reports", "users", "programs", "settings"]
│
├─ (if not admin) Check Priority 2: access_level?
│  └─ NO (because admin_partner matched)
│
└─ (if not admin) Check Priority 3: partner_type?
   └─ NO (because admin_partner matched)

Result: Available Sections = [
  "dashboard", "campaigns", "wallet", "reports", "users", "programs", "settings"
]

Derived Booleans:
├─ canAccessDashboard: true ✅
├─ canAccessCampaigns: true ✅
├─ canAccessWallet: true ✅
├─ canAccessReports: true ✅
├─ canAccessUsers: true ✅
├─ canAccessPrograms: true ✅
└─ canAccessSettings: true ✅
```

## Component Access Decision Tree

### DashboardSection Example
```
DashboardSection
│
├─ usePartnerAccess()
│  └─ canAccessDashboard: true ✅
│  └─ partnerType: "media"
│
├─ Permission Guard
│  if (!canAccessDashboard && !isSuperAdmin && partnerType) {
│    return <LockedSection />
│  }
│  // Passes because canAccessDashboard = true ✅
│
├─ usePermissions()
│  ├─ hasPermission("dashboard.admin"): true ✅
│  ├─ hasPermission("dashboard.read"): true ✅
│  └─ canViewFullDashboard: true ✅
│
└─ Render main dashboard with all metrics and features
```

### UserSection Example
```
UserSection
│
├─ usePartnerAccess()
│  └─ canAccessUsers: true ✅
│
├─ Permission Guard
│  if (!canAccessUsers && partnerType) {
│    return <LockedSection />
│  }
│  // Passes because canAccessUsers = true ✅
│
├─ usePermissions()
│  ├─ canRead("users"): true ✅
│  ├─ canWrite("users"): true ✅
│
├─ UI Features Enabled:
│  ├─ Add User Button
│  ├─ Edit/Delete User Icons
│  ├─ Role Change Dropdown (admin_partner + media_partner options)
│  └─ Activate/Inactivate Buttons
│
└─ Functions Available:
   ├─ createUser()
   ├─ updateUserRole()
   ├─ toggleUserActivation()
   └─ deleteUser()
```

## Permission Precedence Rules

```
┌─────────────────────────────────────────────────────────────┐
│             PERMISSION RESOLUTION HIERARCHY                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. USER ROLE (Highest Priority)                            │
│     ├─ super_admin ────────────────────┬─ Full Access       │
│     ├─ partner_admin ──────────────────┤                    │
│     └─ admin_partner ──────────────────┘                    │
│                                                              │
│  2. PARTNER ACCESS LEVEL (if not admin role)                │
│     ├─ 100 ──────────────── All Sections                   │
│     ├─ 45 ──────────────── Sections 1-7                    │
│     ├─ 40 ──────────────── Sections 1-6                    │
│     ├─ 35 ──────────────── Sections 1-4                    │
│     └─ 25 ──────────────── Sections 1-3                    │
│                                                              │
│  3. PARTNER TYPE (if not admin role and level not set)      │
│     ├─ institutional ─────── Sections 1-7                  │
│     ├─ corporate ─────────── Sections 1-6                  │
│     ├─ media ─────────────── Sections 1-4                  │
│     └─ affiliate ─────────── Sections 1-3                  │
│                                                              │
│  4. DEFAULT                                                 │
│     └─ affiliate ─────────── Sections 1-3                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Sections:
1 = dashboard
2 = campaigns
3 = wallet
4 = reports
5 = users
6 = programs
7 = settings
```

## Data Flow Example: User Creating Sub-User

```
User Interaction
│
├─ UserSection renders with admin_partner + media_partner role options
│
└─ User selects: Create new user → media_partner role
   │
   ├─ AddUserDialog Component
   │  ├─ Checks: canManageUsers (from usePermissions)
   │  │  └─ Evaluates: permission.level === "full" → true ✅
   │  │
   │  └─ Checks: user?.role === 'admin_partner'
   │     └─ true ✅ → Include parent_user_id in payload
   │
   └─ Supabase API Call
      │
      ├─ INSERT users (
      │     email, name, role='media_partner',
      │     parent_user_id='3c5bfe77...',
      │     is_sub_user=true,
      │     partner_id='f74b13a5...'
      │  )
      │
      ├─ RLS Policy Check (ON INSERT)
      │  └─ auth.uid()='3c5bfe77...' AND
      │     roles.role='admin_partner'
      │     → ALLOW ✅
      │
      └─ SUCCESS: New media_partner sub-user created
```

## Database Constraint Validation

```
INSERT INTO users (...)
│
├─ RLS Policy Validation
│  └─ INSERT ... WITH CHECK (
│       auth.uid() = '3c5bfe77...' AND
│       (user.role = 'admin_partner' OR user.role = 'super_admin')
│     )
│     → User's role = 'admin_partner' ✅ PASS
│
├─ Foreign Key Validation
│  └─ partner_id REFERENCES partners(id)
│     → partner_id = 'f74b13a5...' exists ✅ PASS
│
├─ Column Type Validation
│  └─ All columns match expected types ✅ PASS
│
└─ Result: Row inserted successfully ✅
```

## RLS Policy Enforcement

### Current Policies on `users` Table

```
Policy: "allow_user_self_update"
├─ Target: UPDATE
├─ Using: auth.uid() = user.auth_id
└─ Allows: Users to update their own records

Policy: "allow_admin_partner_insert"
├─ Target: INSERT
├─ Check: user.role IN ('admin_partner', 'super_admin')
└─ Allows: Admin partners to insert new users

Policy: "allow_admin_partner_update"
├─ Target: UPDATE
├─ Using: (user.role = 'admin_partner' OR user.role = 'super_admin')
└─ Allows: Admin partners to update other users

Policy: "allow_admin_partner_delete"
├─ Target: DELETE
├─ Using: (user.role = 'admin_partner' OR user.role = 'super_admin')
└─ Allows: Admin partners to delete users
```

## Conclusion

For user `maxwellmutonyiwabomba@gmail.com` with role `admin_partner`:

1. **Frontend Permission Check**: ✅ GRANTS FULL ACCESS ("all_access")
2. **Section Access Check**: ✅ ALLOWS ALL SECTIONS
3. **Component Guards**: ✅ ALL SECTIONS RENDER
4. **Database RLS**: ✅ ALL OPERATIONS ALLOWED (IF POLICY MATCHES)

**Result**: Complete platform access across all dashboard sections and user management capabilities.
