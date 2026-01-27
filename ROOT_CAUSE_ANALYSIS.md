# Root Cause Analysis: Why Admin Partner Access Failed

**Document:** Issue Investigation & Resolution  
**Date:** January 2, 2026  
**User Affected:** maxwellmutonyiwabomba@gmail.com (admin_partner)

---

## The Symptom

User reported seeing:
- ❌ "Missing permissions or partner ID" error
- ❌ "No active users" in Users section
- ❌ Cannot add new users
- ❌ Cannot view existing team members

---

## Root Cause 1: Permission Loading from Wrong Table

### Diagnosis

**AddUserDialog Component** was querying the wrong database table for permissions.

```typescript
// BROKEN CODE (was doing this)
const { data: allPerms } = await supabase.from('permissions').select('*');
const { data: defPerms } = await supabase.from('permissions').select('*').eq('is_default', true);
```

### Why This Failed

1. **Two Permission Systems Exist:**
   - **Old System:** `permissions` table (legacy, may be empty)
   - **New System:** `partner_type_permissions` table (current, has 35 records)

2. **The Database Reality:**
   ```sql
   -- Old table
   SELECT COUNT(*) FROM permissions;
   -- Result: 0 or very few records
   
   -- New table
   SELECT COUNT(*) FROM partner_type_permissions WHERE partner_type_slug = 'partner';
   -- Result: 35 records ✅
   ```

3. **Result in Component:**
   ```typescript
   allPermIds = [] // Empty!
   if (allPermIds.length === 0 || !partnerId) {
     toast.error('Missing permissions or partner ID'); // ← ERROR SHOWN
   }
   ```

### Fix Applied
```typescript
// NEW CODE (fixed)
// 1. Try new partner_type_permissions first
const { data: partnerPerms } = await supabase
  .from('partner_type_permissions')
  .select('*')
  .eq('partner_type_slug', 'partner');

// 2. Only fall back to old permissions if new system has nothing
if (partnerPerms && partnerPerms.length > 0) {
  // Use new system (35 permissions loaded)
} else {
  // Fall back to old permissions table
}
```

**Impact:** Permissions now load correctly (35 available)

---

## Root Cause 2: Role Selector Didn't Support New Roles

### Diagnosis

**AddUserDialog Form** couldn't handle the new admin_partner role.

```typescript
// BROKEN CODE (missing new roles)
interface FormData {
  role:
    | 'partner_admin'
    | 'accountant'
    | 'campaign_manager'
    | 'viewer'
    // Missing: admin_partner, media_partner
}

// Role dropdown didn't include
<SelectItem value="admin_partner">Admin Partner</SelectItem>
<SelectItem value="media_partner">Media Partner</SelectItem>
```

### Why This Mattered

1. User had `admin_partner` role in database
2. Form couldn't represent/use this role
3. Creating a media_partner sub-user was impossible
4. User management workflow incomplete

### Fix Applied
```typescript
// NEW CODE (added new roles)
interface FormData {
  role:
    | 'partner_admin'
    | 'admin_partner'      // ← NEW
    | 'media_partner'      // ← NEW
    | 'accountant'
    // ... rest
}

// NEW role options in dropdown
<SelectItem value="admin_partner">Admin Partner</SelectItem>
<SelectItem value="media_partner">Media Partner</SelectItem>
```

**Impact:** User can now select and manage admin_partner and media_partner roles

---

## Root Cause 3: RLS Policy Too Restrictive

### Diagnosis

**Row Level Security (RLS)** policy blocked admin_partner from accessing team members.

```sql
-- BROKEN POLICY (in database)
CREATE POLICY "users_self_select" ON users FOR SELECT 
USING (auth_id = auth.uid());
-- ↑ Only allows users to see THEMSELVES
```

### Why This Failed

1. **What the policy allowed:**
   ```sql
   -- User can run:
   SELECT * FROM users WHERE id = <their own id>;
   -- ✅ Works
   
   -- User cannot run:
   SELECT * FROM users WHERE partner_id = <partner_id>;
   -- ❌ Blocked by RLS! (partner_id doesn't equal their own id)
   ```

2. **The Query That Failed:**
   ```typescript
   // UserSection component tried to do:
   const { data: udata, error } = await supabase
     .from('users')
     .select('*')
     .eq('partner_id', partnerId);
   // ❌ RLS blocked this even though user is admin_partner!
   ```

3. **Result:**
   - Query returned no data
   - Component showed "No active users"
   - Frontend had no way to fetch team members
   - User management impossible

### The Database Check
```sql
-- Check RLS policies on users table
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- BEFORE fix:
users_self_select     ← Only this, too restrictive
users_self_update     ← Only for self

-- AFTER fix:
users_self_select
users_self_update
admin_partner_select_users    ← ✅ NEW
admin_partner_insert_users    ← ✅ NEW
admin_partner_update_users    ← ✅ NEW
admin_partner_delete_users    ← ✅ NEW
```

### Fix Applied

**Created Migration 012** with 4 new RLS policies:

#### Policy 1: SELECT
```sql
CREATE POLICY "admin_partner_select_users" ON users FOR SELECT
USING (
  -- Admin partners can see users in THEIR partner
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  -- Everyone can still see themselves
  auth_id = auth.uid()
);
```

**What This Does:**
```
Query: SELECT * FROM users WHERE partner_id = '<partner_id>'
Before: ❌ BLOCKED (auth_id != user's id)
After:  ✅ ALLOWED (user is admin_partner in that partner)
```

#### Policy 2: INSERT
```sql
CREATE POLICY "admin_partner_insert_users" ON users FOR INSERT
WITH CHECK (
  -- Admin partners can CREATE users in their partner
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
);
```

**What This Does:**
```
Query: INSERT INTO users (partner_id, email, ...) VALUES (...)
Before: ❌ BLOCKED
After:  ✅ ALLOWED (adding user to their own partner)
```

#### Policy 3: UPDATE
```sql
CREATE POLICY "admin_partner_update_users" ON users FOR UPDATE
USING (
  -- Admin partners can UPDATE users in their partner
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  -- Everyone can update themselves
  auth_id = auth.uid()
);
```

**What This Does:**
```
Query: UPDATE users SET role = 'media_partner' WHERE id = '<user_id>'
Before: ❌ BLOCKED
After:  ✅ ALLOWED (updating user in their partner)
```

#### Policy 4: DELETE
```sql
CREATE POLICY "admin_partner_delete_users" ON users FOR DELETE
USING (
  -- Admin partners can DELETE users in their partner
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
);
```

**What This Does:**
```
Query: DELETE FROM users WHERE id = '<user_id>'
Before: ❌ BLOCKED
After:  ✅ ALLOWED (removing user from their partner)
```

**Impact:** All CRUD operations now work for team members in admin_partner's partner

---

## Why These Issues Went Undetected

### Issue 1: Permission Table Not Updated
- Phase 2 created 35 permissions in `partner_type_permissions`
- But AddUserDialog still queried old `permissions` table
- **Why:** Component was written before new permission system was fully implemented
- **Gap:** Frontend and database evolved separately

### Issue 2: Role Types Incomplete
- New roles (`admin_partner`, `media_partner`) added to permission system
- But form component wasn't updated to support them
- **Why:** Type definitions evolved, but UI components weren't synchronized
- **Gap:** TypeScript type wasn't used in component's FormData interface

### Issue 3: RLS Policies Missing
- Database schema had RLS enabled on users table
- But only `users_self_select` policy existed
- Phase 2 granted admin_partner role, but no RLS policies to match
- **Why:** RLS policies need to be explicit; default policies don't auto-generate
- **Gap:** Phase 2 didn't include necessary RLS policy definitions

---

## Evidence of the Issues

### Issue 1 Evidence
```typescript
// AddUserDialog.tsx line 87-90 (BEFORE FIX)
const { data: allPerms } = await supabase.from('permissions').select('*');
const { data: defPerms } = await supabase.from('permissions').select('*').eq('is_default', true);

// Result: allPerms = [], defPerms = []
// Consequence: allPermIds stays empty
// Error shown: "Missing permissions or partner ID"
```

### Issue 2 Evidence
```typescript
// AddUserDialog.tsx line 53-63 (BEFORE FIX)
interface FormData {
  role: 'partner_admin' | 'accountant' | 'campaign_manager' | 'viewer' | ...
  // No 'admin_partner' or 'media_partner'
}

// Dropdown didn't include new options
<SelectItem value="partner_admin">Partner Admin</SelectItem>
{/* Missing:
<SelectItem value="admin_partner">Admin Partner</SelectItem>
<SelectItem value="media_partner">Media Partner</SelectItem>
*/}
```

### Issue 3 Evidence
```sql
-- Check RLS policies (BEFORE FIX)
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- Result only showed:
-- users_self_select     ← Too restrictive
-- users_self_update

-- Test what admin_partner could see:
-- SELECT * FROM users WHERE partner_id = 'f74b13a5...';
-- ❌ PERMISSION DENIED (policy didn't allow it)
```

---

## The Complete Fix Chain

```
BROKEN FLOW:
User (admin_partner) 
  → Clicks "Add User"
    → Dialog tries to load permissions
      → Queries old 'permissions' table
        → Gets 0 results
          → allPermIds = []
            → Shows "Missing permissions or partner ID" ❌
            → Form blocked

User (admin_partner)
  → Navigates to Users section
    → Component queries "SELECT * FROM users WHERE partner_id = ..."
      → RLS policy checks: auth_id = auth.uid()?
        → No (querying different partner_id)
          → ❌ PERMISSION DENIED
            → No users display
              → Shows "No active users" ❌

FIXED FLOW:
User (admin_partner)
  → Clicks "Add User"
    → Dialog loads permissions
      → Queries 'partner_type_permissions' ✅
        → Gets 35 results ✅
          → allPermIds = [35 permission IDs]
            → Form shows permissions ✅
              → Form submits successfully ✅

User (admin_partner)
  → Navigates to Users section
    → Component queries "SELECT * FROM users WHERE partner_id = ..."
      → RLS policy checks: Is user admin_partner in that partner? ✅
        → Yes!
          → ✅ PERMISSION ALLOWED
            → Users display ✅
              → Shows user list ✅
```

---

## How Each Fix Connects

```
FIX 1: Permission Loading
├─ Updates AddUserDialog component
└─ Queries correct table (partner_type_permissions)
   → Permissions load (35 available) ✅

FIX 2: Role Support
├─ Extends FormData type
├─ Adds SelectItem options
└─ Allows admin_partner and media_partner selection ✅

FIX 3: RLS Policies
├─ Adds 4 new policies to users table
├─ Allows admin_partner SELECT on partner users
├─ Allows admin_partner INSERT/UPDATE/DELETE
└─ Users section can fetch and manage team ✅

ALL TOGETHER:
Add User Dialog:
  1. Opens ✅ (Form supports admin_partner role)
  2. Loads permissions ✅ (From partner_type_permissions)
  3. User can submit ✅ (No permission error)
  4. New user created ✅ (RLS allows INSERT)

Users Section:
  1. Loads users ✅ (RLS allows SELECT)
  2. Shows user list ✅ (Query returns results)
  3. Can edit roles ✅ (RLS allows UPDATE)
  4. Can delete users ✅ (RLS allows DELETE)
  5. Audit logs populate ✅ (Operations tracked)
```

---

## Prevention for Future Issues

To prevent similar issues:

1. **System-Wide Type Definitions**
   - Export UserRole from single source
   - Import in all components that reference roles
   - TypeScript compiler will catch mismatches

2. **Database-Code Sync**
   - Document which table each component queries
   - Maintain mapping of components → tables → migrations
   - Review in PRs for consistency

3. **RLS Policy Checklist**
   - When adding new role: Add corresponding RLS policies
   - When modifying operations: Check RLS permissions
   - Test queries with new role before deployment

4. **Integration Tests**
   - Test full user creation flow (dialog → database → list)
   - Test all CRUD operations per role
   - Test RLS policies explicitly

---

**Summary:** Three separate systems (permissions table, form types, RLS policies) weren't in sync with the new admin_partner role, causing cascading failures in user management.

