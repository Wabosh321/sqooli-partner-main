# Database Verification & Backend Checks

## SQL Queries to Verify Data Integrity

### Check User & Partner Linkage
```sql
-- Verify user 3c5bfe77-4b49-452c-80bc-9513167cda3f has correct partner
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.partner_id,
  p.id as partner_id,
  p.name as partner_name,
  p.partner_type,
  p.status,
  p.access_level
FROM users u
LEFT JOIN partners p ON u.partner_id = p.id
WHERE u.id = '3c5bfe77-4b49-452c-80bc-9513167cda3f';
```

**Expected Result:**
```
user_id                              | email         | role    | partner_id                           | partner_id                           | partner_name | partner_type  | status | access_level
3c5bfe77-4b49-452c-80bc-9513167cda3f | user@test.com | partner | f74b13a5-145e-42e2-ad53-5f130dd496b5 | f74b13a5-145e-42e2-ad53-5f130dd496b5 | Test Partner | institutional | active | 100
```

---

### Verify Partner Configuration
```sql
-- Check partner configuration
SELECT 
  id,
  name,
  email,
  partner_type,
  status,
  access_level,
  commission_rate,
  created_at,
  updated_at
FROM partners
WHERE id = 'f74b13a5-145e-42e2-ad53-5f130dd496b5';
```

**Expected Result:**
```
id                                   | name         | email           | partner_type  | status | access_level | commission_rate | created_at | updated_at
f74b13a5-145e-42e2-ad53-5f130dd496b5 | Test Partner | partner@test.com | institutional | active | 100          | 5.0             | 2025-01-01 | 2025-12-29
```

---

### Check for Duplicate/Conflicting Users
```sql
-- Find all users with same partner (to catch duplicates)
SELECT 
  u.id,
  u.email,
  u.role,
  u.partner_id,
  COUNT(*) as count
FROM users u
WHERE u.partner_id = 'f74b13a5-145e-42e2-ad53-5f130dd496b5'
GROUP BY u.email, u.partner_id
HAVING COUNT(*) > 1;
```

**Expected:** No results (no duplicates)

---

### Check User Status Fields
```sql
-- Verify all required user fields are set
SELECT 
  id,
  email,
  role,
  partner_id,
  partner_role,
  is_account_activated,
  is_first_login,
  created_at
FROM users
WHERE id = '3c5bfe77-4b49-452c-80bc-9513167cda3f';
```

**Expected:**
- `is_account_activated` should be `true`
- `partner_id` should not be NULL
- `role` should be `'partner'`

---

### Check for Soft-Delete Flags
```sql
-- Verify no soft-delete or archived flags are blocking access
SELECT 
  id,
  email,
  is_active,
  is_archived,
  deleted_at,
  status
FROM users
WHERE id = '3c5bfe77-4b49-452c-80bc-9513167cda3f';
```

**Verify:**
- `is_active` = true (or NULL/not present)
- `is_archived` = false (or NULL/not present)
- `deleted_at` = NULL
- `status` != 'archived'

---

## Backend Authorization Logic Checklist

### ✅ API Endpoint Verification

If you have backend API endpoints that check permissions:

```typescript
// Example: Backend should implement this logic
async function authorizeUserForSection(
  userId: string,
  section: string
): Promise<boolean> {
  // 1. Fetch user
  const user = await db.users.findById(userId);
  if (!user || !user.partner_id) return false;

  // 2. Fetch partner
  const partner = await db.partners.findById(user.partner_id);
  if (!partner) return false;

  // 3. Check partner status
  if (partner.status !== 'active') return false;

  // 4. Check partner type access
  const sectionsByType = {
    affiliate: ['dashboard', 'campaigns', 'wallet'],
    media: ['dashboard', 'campaigns', 'wallet', 'reports'],
    corporate: ['dashboard', 'campaigns', 'wallet', 'reports'],
    institutional: ['dashboard', 'campaigns', 'wallet', 'reports', 'users', 'programs', 'settings'],
  };

  const allowed = sectionsByType[partner.partner_type] || [];
  
  // 5. Verify access level threshold
  if (partner.access_level === null || partner.access_level < 25) {
    return false;
  }

  return allowed.includes(section.toLowerCase());
}
```

### ✅ Middleware Chain Check

Verify backend middleware processes permissions in correct order:

1. ✅ **Extract User from Token**
   ```typescript
   const user = extractUserFromJWT(token);
   ```

2. ✅ **Load User Record**
   ```typescript
   const userRecord = await db.users.findById(user.id);
   ```

3. ✅ **Load Partner Record**
   ```typescript
   const partner = await db.partners.findById(userRecord.partner_id);
   ```

4. ✅ **Validate Partner Status**
   ```typescript
   if (partner.status !== 'active') return 403;
   ```

5. ✅ **Check Section Access**
   ```typescript
   if (!partner.partner_type || !allowed_sections.includes(section)) return 403;
   ```

---

## JWT Token Validation

### Check Token Claims

After authentication, verify JWT contains correct claims:

```bash
# Extract token from browser
# DevTools > Application > Cookies > supabase auth token

# Decode JWT (use jwt.io or decode locally)
# Verify claims include:
{
  "sub": "3c5bfe77-4b49-452c-80bc-9513167cda3f",
  "email": "user@test.com",
  "email_verified": true,
  "iss": "https://your-supabase-url",
  "aud": "authenticated",
  "exp": 1704067200
}
```

### ⚠️ Common JWT Issues

| Issue | Symptom | Fix |
|---|---|---|
| Token expired | Auth fails immediately | User needs to re-login |
| Token stale | Permissions changed but old token cached | Clear sessionStorage + reload |
| Sub mismatch | User ID doesn't match database | Verify Supabase ID generation |
| Email unverified | New accounts blocked | User must click verification email |

---

## Performance Monitoring

### Query Performance Baseline

Monitor these queries don't exceed 100ms:

```sql
-- User lookup (should be <10ms with index)
SELECT * FROM users WHERE id = 'xxx';

-- Partner lookup (should be <10ms with index)  
SELECT * FROM partners WHERE id = 'xxx';

-- User+Partner join (should be <20ms)
SELECT u.*, p.* FROM users u 
  LEFT JOIN partners p ON u.partner_id = p.id 
  WHERE u.id = 'xxx';
```

### Recommended Indexes

```sql
-- Create indexes for faster lookups
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_partners_partner_type ON partners(partner_type);
CREATE INDEX idx_partners_status ON partners(status);
```

---

## Session State Validation

### Frontend Session Check

```javascript
// Run in browser DevTools console
const session = await supabase.auth.getSession();
console.log('Session:', {
  userId: session.data.session?.user.id,
  email: session.data.session?.user.email,
  expiresAt: session.data.session?.expires_at,
});
```

### Verify Auth Provider State

```javascript
// Check Supabase connection
const { data: { user } } = await supabase.auth.getUser();
console.log('Auth User:', user);

// Check partner data was loaded
const { partner } = useAuth();
console.log('Partner Data:', partner);

// Check permissions were derived
const { permissions } = usePermissions();
console.log('Permissions:', permissions);
```

---

## Common Troubleshooting Matrix

| Symptom | Root Cause | Fix |
|---|---|---|
| Dashboard locked (LockedSection shown) | `canAccessDashboard === false` | Check partner.status + partner_type |
| Permissions empty | PermissionProvider not deriving from partner_type | Verify PermissionProvider.tsx changes applied |
| Sections visible but data empty | `canRead()` returns false | Check permissions object generation |
| Works for super_admin only | Role-based check blocking partners | Verify partner_type permission derivation |
| Works after logout/login only | Stale cache or session | Clear sessionStorage + reload |
| API returns 403 Forbidden | Backend authorization failed | Check backend middleware order |

---

## Monitoring & Alerting

### Metrics to Track

```typescript
// Log these metrics to your observability platform:
{
  "event": "authorization_check",
  "user_id": "xxx",
  "section_requested": "dashboard",
  "authorized": true/false,
  "partner_type": "institutional",
  "access_level": 100,
  "response_time_ms": 15,
  "timestamp": "2025-12-29T..."
}
```

### Alert Thresholds

- ⚠️ **Authorization failures > 10% of requests** → Investigate database/config
- ⚠️ **Response time > 500ms** → Check database indexes
- ⚠️ **New user with partner_type NULL** → Onboarding flow broken
- ⚠️ **Partner status = 'pending' for > 24h** → Manual review needed

---

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Frontend code deployed
- [ ] Browser cache cleared (users)
- [ ] Auth tokens refreshed (users logged out/in)
- [ ] Authorization logs flowing (check DevTools)
- [ ] No 403 errors in error tracking
- [ ] Partner section visibility correct
- [ ] All partner types tested
- [ ] Performance baseline established
