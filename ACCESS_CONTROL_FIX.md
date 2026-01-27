# Access Control Fix & Verification Guide

## Root Cause Analysis Summary

### **Critical Issues Found & Fixed**

#### Issue #1: PermissionProvider MVP Implementation ❌
**Location:** `src/context/PermissionProvider.tsx` (lines 30-45)

**Problem:** Only `super_admin`, `admin`, and `partner_admin` roles received full access. Regular `partner` users received an **empty permissions array**, causing:
- `canRead("dashboard")` → FALSE
- `canWrite("campaigns")` → FALSE
- `canRead("users")` → FALSE

**Impact:** All partner users denied access to dashboard sections despite valid `partner_type` and `access_level`.

**Fix Applied:** ✅ Now derives permissions from `partner.partner_type` and `partner.status`:
```typescript
// Institutional partners now get these permissions:
- dashboard.read
- campaigns.read
- wallet.read
- reports.read
- users.read
- programs.read
- settings.read
```

---

#### Issue #2: Incomplete Permission Checks ❌
**Location:** `src/context/PermissionProvider.tsx` (lines ~85-95)

**Problem:** `canRead()` and `canWrite()` only checked for exact level match:
```typescript
// OLD: Too strict
return permissions.some((p) => p.category === category && p.level === "read");
```

**Fix Applied:** ✅ Now checks for any valid permission level:
```typescript
// NEW: More flexible
if (permissions.some((p) => p.category === category && 
    (p.level === "read" || p.level === "write" || p.level === "admin" || p.level === "full"))) {
  return true;
}
```

---

#### Issue #3: Missing Debugging & Audit Trail ❌
**Problem:** No structured logging of authorization decisions made troubleshooting impossible.

**Fix Applied:** ✅ Created `src/lib/authDebugger.ts`:
- `createAuthDebugRecord()` - Captures user, partner, permissions, resolved sections, deny reasons
- `logAuthorizationCheck()` - Logs to console + sessionStorage
- `getStoredAuthLogs()` - Retrieve last 50 authorization checks
- Used in DashboardSection + CampaignSection

---

## Verification Steps

### Step 1: Verify PermissionProvider Generates Correct Permissions

**Expected Behavior for User with:**
- `partner_type: "institutional"`
- `partner.status: "active"`
- `partner.access_level: 100`

```javascript
// Open browser console and check:
getStoredAuthLogs()[0]

// Expected output:
{
  "component": "DashboardSection",
  "permissions": [
    "dashboard.read",
    "campaigns.read", 
    "wallet.read",
    "reports.read",
    "users.read",
    "programs.read",
    "settings.read"
  ],
  "canAccessDashboard": true,
  "resolvedSections": [
    "dashboard",
    "campaigns",
    "wallet",
    "reports",
    "users",
    "programs",
    "settings"
  ]
}
```

**Test Command:**
```javascript
// In browser DevTools console:
const logs = JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
console.table(logs[logs.length - 1]);
```

---

### Step 2: Test Dashboard Access

**Test Case 1: Institutional Partner with Access Level 100**

1. Login as user with `partner_type: "institutional"` and `access_level: 100`
2. Navigate to `/dashboard`
3. Verify dashboard displays (not locked)
4. Check browser console for auth logs:
   ```
   🔐 [DashboardSection] Authorization Check
   ```
5. Verify log shows:
   - `canAccessDashboard: true`
   - `permissions` includes `"dashboard.read"`

**Expected Result:** ✅ Dashboard visible, all sections available

---

### Step 3: Test All Section Access

**For institutional partner, verify access to:**
- [ ] Dashboard (dashboard section)
- [ ] Campaigns (campaign management)
- [ ] Wallet (payment tracking)
- [ ] Reports (analytics)
- [ ] Users (user management)
- [ ] Programs (program management)
- [ ] Settings (configuration)

**For media partner, verify restricted access:**
- [ ] Dashboard ✅
- [ ] Campaigns ✅
- [ ] Wallet ✅
- [ ] Reports ✅
- [ ] Users ❌ (should be locked)
- [ ] Programs ❌ (should be locked)
- [ ] Settings ❌ (should be locked)

---

### Step 4: API-Level Testing

If your system has an API endpoint that checks permissions, verify:

```bash
# Example: Check if API honors the permission hierarchy
GET /api/permissions?user_id=3c5bfe77-4b49-452c-80bc-9513167cda3f

# Expected response:
{
  "user_id": "3c5bfe77-4b49-452c-80bc-9513167cda3f",
  "partner_id": "f74b13a5-145e-42e2-ad53-5f130dd496b5",
  "partner_type": "institutional",
  "access_level": 100,
  "can_access_dashboard": true,
  "allowed_sections": [
    "dashboard", "campaigns", "wallet", "reports", 
    "users", "programs", "settings"
  ],
  "status": "active",
  "resolved_at": "2025-12-29T..."
}
```

---

## Debugging Commands

### View All Authorization Logs

```javascript
// In browser DevTools console:
JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]')
  .map(log => ({
    time: log.timestamp,
    component: log.component,
    userRole: log.userRole,
    partnerType: log.partnerType,
    denied: log.denyReason !== null
  }))
```

### Clear Authorization Logs

```javascript
sessionStorage.removeItem('auth_debug_logs');
```

### Export Logs for Analysis

```javascript
const logs = JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
const csv = [
  'timestamp,component,userId,userRole,partnerType,denyReason',
  ...logs.map(l => 
    `${l.timestamp},${l.component},${l.userId},${l.userRole},${l.partnerType},"${l.denyReason || '—'}"`
  )
].join('\n');
console.log(csv);
```

---

## Token Refresh Requirement

After permission changes in the database, **users must refresh their session**:

### Method 1: Page Reload
```javascript
window.location.reload();
```

### Method 2: Auth State Refresh (if available)
```javascript
// In components using useAuth():
const { refetch } = useAuth();
await refetch();
```

### Method 3: Browser Extension Helper

Add this to a browser console snippet for quick testing:

```javascript
// Clear session and reload
sessionStorage.clear();
localStorage.clear();
location.reload();
```

---

## Regression Tests

### Test Matrix: Permission Level vs Partner Type

| Partner Type   | Access Level | Dashboard | Campaigns | Wallet | Reports | Users | Programs | Settings |
|---|---|---|---|---|---|---|---|---|
| affiliate      | 25           | ✅        | ✅        | ✅     | ❌      | ❌    | ❌       | ❌       |
| media          | 35           | ✅        | ✅        | ✅     | ✅      | ❌    | ❌       | ❌       |
| corporate      | 40           | ✅        | ✅        | ✅     | ✅      | ❌    | ❌       | ❌       |
| institutional  | 100          | ✅        | ✅        | ✅     | ✅      | ✅    | ✅       | ✅       |

### Role-Based Fallback Test

| User Role      | Has Admin Fallback? | Full Access? |
|---|---|---|
| super_admin    | Yes                 | ✅           |
| admin          | Yes                 | ✅           |
| partner_admin  | Yes                 | ✅           |
| partner        | No                  | ❌ (use partner_type) |

---

## Affected Files Summary

| File | Changes | Impact |
|---|---|---|
| `src/context/PermissionProvider.tsx` | Enhanced permission derivation from partner_type | HIGH: Fixes root cause |
| `src/lib/authDebugger.ts` | New file: authorization logging utility | HIGH: Enables troubleshooting |
| `src/sections/DashboardSection.tsx` | Added debug logging | MEDIUM: Better visibility |
| `src/sections/CampaignSection.tsx` | Added debug logging | MEDIUM: Better visibility |

---

## Rollback Instructions (if needed)

If the fixes cause unexpected behavior:

1. **Revert PermissionProvider.tsx:**
   - Remove partner_type-based permission derivation
   - Restore role-only permission check

2. **Disable Logging:**
   - Remove import of `authDebugger.ts`
   - Comment out `logAuthorizationCheck()` calls

3. **Restore Original:**
   ```bash
   git checkout HEAD~1 src/context/PermissionProvider.tsx
   ```

---

## Monitor Production Deployment

After deploying these fixes, monitor:

1. **Console Warnings:** Reduce access-denied errors
2. **User Reports:** Decrease support tickets about locked sections
3. **Performance:** Ensure no additional latency from logging
4. **Browser Storage:** Verify sessionStorage doesn't exceed limits (~5MB)

---

## Next Steps for Complete Security

- [ ] Move permission objects from frontend derivation to backend API
- [ ] Add database audit table for permission changes
- [ ] Implement real-time permission sync (websocket/polling)
- [ ] Add role-based access control (RBAC) matrix to database
- [ ] Create admin panel for permission management UI
- [ ] Add JWT token refresh on permission change detection
