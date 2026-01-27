# Quick Start: Testing the Access Control Fix

## 5-Minute Quick Test

### Step 1: Start the App
```bash
npm run dev
```

### Step 2: Login as Test User
```
Email: your-institutional-partner@example.com
Password: (use your test account)
```

### Step 3: Verify Dashboard Access
```
✅ Dashboard loads (not showing LockedSection)
✅ All 7 tabs visible:
   - Dashboard
   - Campaigns
   - Wallet
   - Reports
   - Users
   - Programs
   - Settings
```

### Step 4: Check Authorization Logs

**In Browser DevTools Console:**
```javascript
// Press F12 or Ctrl+Shift+I

// Method 1: View formatted logs
window.DEBUG_AUTH.checkAccess()

// Method 2: Export logs as CSV (copies to clipboard)
window.DEBUG_AUTH.exportCSV()

// Method 3: Get raw logs array
window.DEBUG_AUTH.getLogs()

// Method 4: Clear logs
window.DEBUG_AUTH.clearLogs()
```

**Expected Console Output:**
```
🔐 Current Authorization Status

User: 
  id: "3c5bfe77-4b49-452c-80bc-9513167cda3f"
  email: "user@test.com"
  role: "partner"

Partner:
  id: "f74b13a5-145e-42e2-ad53-5f130dd496b5"
  name: "Test Partner"
  type: "institutional"
  status: "active"
  accessLevel: 100

Access:
  canAccessDashboard: true ✅
  resolvedSections: 
    - dashboard
    - campaigns
    - wallet
    - reports
    - users
    - programs
    - settings

Permissions:
  dashboard.read
  campaigns.read
  wallet.read
  reports.read
  users.read
  programs.read
  settings.read
```

---

## Testing Different Partner Types

### Affiliate Partner (Access Level 25)
```
Should see:
✅ Dashboard
✅ Campaigns
✅ Wallet

Should NOT see:
❌ Reports (locked)
❌ Users (locked)
❌ Programs (locked)
❌ Settings (locked)
```

### Media Partner (Access Level 35)
```
Should see:
✅ Dashboard
✅ Campaigns
✅ Wallet
✅ Reports

Should NOT see:
❌ Users (locked)
❌ Programs (locked)
❌ Settings (locked)
```

### Corporate Partner (Access Level 40)
```
Should see:
✅ Dashboard
✅ Campaigns
✅ Wallet
✅ Reports

Should NOT see:
❌ Users (locked)
❌ Programs (locked)
❌ Settings (locked)
```

### Institutional Partner (Access Level 100)
```
Should see:
✅ Dashboard
✅ Campaigns
✅ Wallet
✅ Reports
✅ Users
✅ Programs
✅ Settings
```

---

## Debugging Specific Issues

### Issue: "Dashboard still locked"

**Step 1: Check what permissions were generated**
```javascript
window.DEBUG_AUTH.getLogs()[window.DEBUG_AUTH.getLogs().length - 1].permissions
// Should show: ["dashboard.read", "campaigns.read", ...]
```

**Step 2: Verify partner data loaded**
```javascript
// In browser console, check the partner object
const { partner } = useAuth(); // Not available in console, but check Network tab
// Look for Partner object with: partner_type, status, access_level
```

**Step 3: Check if permissions were derived**
```javascript
// Open Network tab, find API calls to /partners or /users
// Verify response includes:
{
  "partner_type": "institutional",
  "status": "active",
  "access_level": 100
}
```

### Issue: "Permissions empty array"

**Debug:**
```javascript
// Check if PermissionProvider is getting partner data
window.DEBUG_AUTH.checkAccess()
// Look at "Permissions:" section - should NOT be empty

// If empty, check:
// 1. useAuth() returning partner data
// 2. Partner has partner_type set
// 3. Partner status = 'active'
// 4. Partner access_level is not null
```

### Issue: "Super Admin sees empty permissions"

**This is expected behavior** for non-admin users. Admins get special handling:
```javascript
// For super_admin users, permissions will be:
["all_access"]  // Single object with level="full"

// This grants full access to everything
```

---

## Production Monitoring

### Monitor in Production

**Add this to your monitoring dashboard:**

```javascript
// Check authorization error rate
const logs = window.DEBUG_AUTH.getLogs();
const deniedCount = logs.filter(l => l.denyReason !== null).length;
const denialRate = (deniedCount / logs.length * 100).toFixed(2);
console.log(`Authorization denial rate: ${denialRate}%`);
```

**Healthy baseline:**
- Denial rate: < 5% (occasional misconfigurations)
- Average check time: < 50ms
- No repeated denials for same user
- Error logs: No 403 Forbidden errors

---

## Common Commands Reference

```javascript
// Get current user's authorization status
window.DEBUG_AUTH.checkAccess()

// See all authorization logs
window.DEBUG_AUTH.getLogs()

// Check specific user's permission
const logs = window.DEBUG_AUTH.getLogs();
logs.find(l => l.userId === "target-user-id")

// Export for analysis (copies CSV to clipboard)
window.DEBUG_AUTH.exportCSV()

// See all denials (failed authorization checks)
window.DEBUG_AUTH.getLogs().filter(l => l.denyReason !== null)

// See recent 5 checks
window.DEBUG_AUTH.getLogs().slice(-5)

// Clear logs to start fresh
window.DEBUG_AUTH.clearLogs()
```

---

## Troubleshooting Tips

| Symptom | Check This | Fix |
|---|---|---|
| Sections locked immediately after login | Partner status in DB | Update partner status to 'active' |
| Sections locked only for some users | partner_type value | Ensure partner_type is set |
| All sections visible for all users | Partner type hierarchy | Check PermissionProvider section mapping |
| Console shows "permission resolution" debug logs | NODE_ENV setting | Set NODE_ENV=production to disable |
| Browser freezes loading permissions | Database query slow | Add indexes to users/partners tables |
| Logs grow very large in sessionStorage | Too many page loads | Clear with `DEBUG_AUTH.clearLogs()` |

---

## Next Steps

1. **Deploy** the code to staging
2. **Run verification test** above
3. **Monitor** authorization logs in production
4. **Check backend** with queries in BACKEND_VERIFICATION.md
5. **Document** any issues you find

---

## Support

**For detailed technical docs, see:**
- **ACCESS_CONTROL_SUMMARY.md** - Executive overview
- **ACCESS_CONTROL_FIX.md** - Detailed debugging guide
- **BACKEND_VERIFICATION.md** - SQL queries and backend checks

**In browser DevTools:**
```javascript
// Full diagnostic
window.DEBUG_AUTH.checkAccess()

// All recent activity
window.DEBUG_AUTH.getLogs()

// Export for support team
window.DEBUG_AUTH.exportCSV()
```
