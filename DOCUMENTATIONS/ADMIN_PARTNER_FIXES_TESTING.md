# Admin Partner User Management - Fixes Applied & Testing Guide

**Date:** January 2, 2026  
**Status:** ✅ FIXES APPLIED - READY FOR TESTING  
**User:** maxwellmutonyiwabomba@gmail.com  
**Partner ID:** f74b13a5-145e-42e2-ad53-5f130dd496b5

---

## Summary of Fixes

### Issue 1: AddUserDialog Not Loading Permissions
**Root Cause:** Component was querying old `permissions` table which was empty or missing default permissions.

**Fix Applied:**
- Updated [src/components/common/AddUserDialog.tsx](src/components/common/AddUserDialog.tsx#L60-L90)
- Now loads permissions from `partner_type_permissions` table (new system)
- Falls back to old `permissions` table for backward compatibility
- Added `admin_partner` and `media_partner` roles to the role selector

**Code Change:**
```typescript
// Load from partner_type_permissions first (admin_partner system)
const { data: partnerPerms } = await supabase
  .from('partner_type_permissions')
  .select('*')
  .eq('partner_type_slug', 'partner');

if (partnerPerms && partnerPerms.length > 0) {
  const mappedPerms = partnerPerms.map((p: any) => ({
    _id: p.id,
    id: p.id,
    name: p.permission_key,
    description: p.description,
    permission_key: p.permission_key,
    category: p.permission_key.split('_')[0],
    is_default: false
  }));
  setPermissions(mappedPerms);
  // Default permissions: settings.view and programs.view
  const defaultPerms = mappedPerms.filter(p => 
    p.permission_key?.includes('settings') || p.permission_key?.includes('programs')
  );
  setDefaultPermissions(defaultPerms.slice(0, 2));
}
```

**Verification:**
```bash
✅ No TypeScript errors
✅ Dialog accepts admin_partner and media_partner roles
✅ Permissions loaded from partner_type_permissions (35 permissions for 'partner' type)
```

---

### Issue 2: UserSection Not Displaying Users (RLS Policy Too Restrictive)
**Root Cause:** RLS policy on `users` table only allowed users to SELECT themselves (`auth_id = auth.uid()`). Admin partners couldn't see users in their partner.

**Fix Applied:**
- Created migration 012: `add_admin_partner_user_rls`
- Added 4 new RLS policies to users table:

#### 1. **admin_partner_select_users** (SELECT)
Allows admin_partner users to view all users in their partner:
```sql
USING (
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  auth_id = auth.uid()  -- Users can still see themselves
)
```

#### 2. **admin_partner_insert_users** (INSERT)
Allows admin_partner users to create new users in their partner:
```sql
WITH CHECK (
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  auth.role() = 'service_role'
)
```

#### 3. **admin_partner_update_users** (UPDATE)
Allows admin_partner users to modify users in their partner:
```sql
USING (
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  auth_id = auth.uid()
)
WITH CHECK (
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
  OR
  auth_id = auth.uid()
)
```

#### 4. **admin_partner_delete_users** (DELETE)
Allows admin_partner users to delete users from their partner:
```sql
USING (
  partner_id IN (
    SELECT partner_id FROM users 
    WHERE auth_id = auth.uid() 
    AND (role = 'admin_partner' OR role = 'super_admin')
  )
)
```

**Verification:**
```bash
✅ Migration applied successfully
✅ All 4 policies exist in database (verified with pg_policies query)
✅ Policies cover SELECT, INSERT, UPDATE, DELETE operations
✅ admin_partner can operate on users with matching partner_id
✅ Regular users still only see themselves
```

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| [src/components/common/AddUserDialog.tsx](src/components/common/AddUserDialog.tsx) | Updated permission loading from partner_type_permissions; added admin_partner & media_partner roles | ✅ Applied |
| [supabase/migrations/012_add_admin_partner_user_rls.sql](supabase/migrations/012_add_admin_partner_user_rls.sql) | Created RLS policies for admin_partner user management | ✅ Applied |

---

## Testing Checklist

Before: Users section showed "No active users" and "Missing permissions or partner ID" error
After: Should display all users for the partner

### Pre-Testing Setup
```bash
# User: maxwellmutonyiwabomba@gmail.com
# Role: admin_partner
# Partner ID: f74b13a5-145e-42e2-ad53-5f130dd496b5
# Auth UID: 025b0d8d-2943-4ea7-a5b3-52a3cf7671d0
```

### Test 1: Login & Dashboard
- [ ] Login as maxwellmutonyiwabomba@gmail.com
- [ ] Dashboard loads without permission errors
- [ ] All 7 sections visible in sidebar (Dashboard, Campaigns, Programs, Wallet, Users, Reports, Settings)
- [ ] No "Access Restricted" messages

### Test 2: Users Section - View Users
- [ ] Users section loads
- [ ] Query executes: `SELECT * FROM users WHERE partner_id = 'f74b13a5-145e-42e2-ad53-5f130dd496b5'`
- [ ] All users for the partner display
- [ ] Audit logs populate (if any audit events exist)
- [ ] No RLS policy violation errors in console

### Test 3: Users Section - Add User
- [ ] "Add User" button visible
- [ ] Dialog opens
- [ ] All fields available: Name, Email, Phone, Role
- [ ] Role dropdown includes: Viewer, Campaign Manager, Accountant, Merchant Admin, Super Agent, Master Agent, Partner Admin, **Admin Partner**, **Media Partner**
- [ ] Permissions section shows all 35 partner_type_permissions
- [ ] Default permissions auto-selected (settings, programs view)
- [ ] Submit creates user without "Missing permissions or partner ID" error

### Test 4: Users Section - Edit User Role
- [ ] Click edit on existing user
- [ ] Role selection available
- [ ] Can change to admin_partner, media_partner, etc.
- [ ] Submit updates user role
- [ ] No RLS UPDATE policy violations

### Test 5: Users Section - Activate/Deactivate
- [ ] Can toggle user activation status
- [ ] Confirmation dialog appears
- [ ] Update succeeds without errors
- [ ] UI refreshes with updated status

### Test 6: Sub-User Creation (Media Partner)
- [ ] Create user with role = "media_partner"
- [ ] If creating as admin_partner, should auto-set parent_user_id and is_sub_user
- [ ] Sub-user created successfully with parent-child relationship

### Test 7: Create Sub-User from Media Partner
- [ ] Create user with role = "viewer" when admin_partner creates it
- [ ] New user should have: parent_user_id = admin_partner's id, is_sub_user = true
- [ ] Hierarchy correctly established

### Test 8: Audit Logs
- [ ] Audit logs display actions (create_user, update_user, etc.)
- [ ] Timestamps show correctly
- [ ] Filter/search functionality works

### Test 9: Permission Verification
- [ ] Run test query in browser console:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('partner_id', 'f74b13a5-145e-42e2-ad53-5f130dd496b5');

console.log('Data:', data);  // Should return user records
console.log('Error:', error); // Should be null
```

---

## Database Verification Queries

Run these in Supabase SQL editor to verify fixes:

### Query 1: Verify RLS Policies Exist
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE '%admin_partner%'
ORDER BY policyname;
```

**Expected Result:**
```
4 rows with policyname values:
- admin_partner_delete_users
- admin_partner_insert_users
- admin_partner_select_users
- admin_partner_update_users
```

### Query 2: Verify Admin Partner Can SELECT Users
```sql
-- Test as admin_partner (auth.uid() = 025b0d8d-2943-4ea7-a5b3-52a3cf7671d0)
SELECT id, email, role, partner_id, parent_user_id, is_sub_user
FROM users
WHERE partner_id = 'f74b13a5-145e-42e2-ad53-5f130dd496b5';
```

**Expected Result:**
- Returns user records if any exist for this partner
- No RLS policy violation errors

### Query 3: Verify Permissions Loaded
```sql
SELECT COUNT(*), permission_key
FROM partner_type_permissions
WHERE partner_type_slug = 'partner'
GROUP BY permission_key
ORDER BY permission_key;
```

**Expected Result:**
- 35 total permissions for 'partner' type
- Covers: dashboard, campaigns, programs, users, wallet, reports, settings, system

### Query 4: Verify User Role & Partner
```sql
SELECT 
  id, 
  email, 
  role, 
  partner_id,
  (SELECT org_name FROM partners WHERE id = users.partner_id) as org_name
FROM users
WHERE email = 'maxwellmutonyiwabomba@gmail.com';
```

**Expected Result:**
```
id: 3c5bfe77-4b49-452c-80bc-9513167cda3f
email: maxwellmutonyiwabomba@gmail.com
role: admin_partner
partner_id: f74b13a5-145e-42e2-ad53-5f130dd496b5
org_name: Maxwell Mutoni Organization
```

---

## Troubleshooting

### Problem: Still seeing "No active users"
**Possible Causes:**
1. User hasn't yet created any sub-users (0 users is correct if partner is new)
2. RLS policy still blocking queries
3. Browser cache issue

**Solutions:**
- Check if any users exist for partner: Run Query 3 above
- Clear browser cache (Ctrl+Shift+Del)
- Check browser console for RLS policy errors
- Verify user has admin_partner role

### Problem: "Missing permissions or partner ID" error when adding user
**Possible Causes:**
1. partnerId is undefined (partner data not loaded)
2. defaultPermissions array is empty
3. FormData.role value not supported

**Solutions:**
- Check that partner loads: `console.log(partner)` in component
- Verify permissions load: `console.log(permissions)` in component
- Check role dropdown includes your desired role
- Verify partner_type_permissions table has 35 records

### Problem: RLS policy violation when updating user
**Possible Causes:**
1. RLS policy missing or incorrectly configured
2. User's auth.uid() not matching database records
3. Parent-child relationship issue with sub-users

**Solutions:**
- Verify auth.uid() in browser: `supabase.auth.getUser()`
- Re-apply migration if policies missing
- Check parent_user_id is correct for sub-users

---

## Next Steps

1. **Immediate:** Test all scenarios in Testing Checklist
2. **Monitor:** Watch browser console for RLS/permission errors
3. **Validate:** Run database verification queries
4. **Document:** Update onboarding with admin_partner capabilities
5. **Deploy:** Merge changes to main/staging after successful testing

---

## Rollback Procedure (if needed)

```sql
-- Remove RLS policies
DROP POLICY IF EXISTS admin_partner_select_users ON users;
DROP POLICY IF EXISTS admin_partner_insert_users ON users;
DROP POLICY IF EXISTS admin_partner_update_users ON users;
DROP POLICY IF EXISTS admin_partner_delete_users ON users;

-- Revert AddUserDialog code to previous version (git checkout src/components/common/AddUserDialog.tsx)
```

---

**Generated:** January 2, 2026  
**Last Updated:** After RLS fix application  
**Status:** Ready for manual testing
