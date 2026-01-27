# Partner Type System - Quick Reference

## 🚀 Quick Start for Developers

### Using Permission Checking in Your Components

```typescript
import { usePartnerPermissions } from '../hooks/usePartnerPermissions';

export function MyFeature() {
  const { canAccessSection, hasPermission, partnerType } = usePartnerPermissions();

  // Check if user can access a section
  if (!canAccessSection('reports')) {
    return <LockedSection sectionName="Reports" />;
  }

  // Check if user has a specific permission
  if (!hasPermission('analytics_view')) {
    return <div>This feature is not available in your plan</div>;
  }

  return <ReportsSection />;
}
```

### Checking Partner Type

```typescript
const { 
  isAffiliatePartner, 
  isMediaPartner, 
  isCorporatePartner, 
  isInstitutionalPartner 
} = usePartnerPermissions();

if (isInstitutionalPartner()) {
  // Show institutional-only features
}
```

### Checking User Role

```typescript
const { hasRole, partnerRole } = usePartnerPermissions();

if (hasRole(PartnerRole.CORPORATE_ADMIN)) {
  // Show admin-only features
}

// Or use the raw value
console.log(partnerRole); // 'corporate_admin' | null
```

### Getting Available Sections

```typescript
const { getAvailableSections, partnerType } = usePartnerPermissions();

const sections = getAvailableSections();
// Affiliate: ['dashboard', 'campaigns', 'wallet']
// Media: ['dashboard', 'campaigns', 'wallet', 'reports', 'analytics']
// etc...

sections.forEach(section => {
  // Dynamically render available sections
});
```

## 📊 Partner Type Reference

### Affiliate Partner
- **Access Level:** 25%
- **Sections:** dashboard, campaigns, wallet
- **Default Role:** affiliate_agent
- **Commission:** 5%
- **Permissions:** campaign_view, dashboard_view, wallet_view, commission_view, profile_management

### Media Partner
- **Access Level:** 35%
- **Sections:** dashboard, campaigns, wallet, reports, analytics
- **Default Role:** media_manager
- **Commission:** 12.5%
- **Permissions:** (5 from Affiliate) + analytics_view, content_management, bulk_operations

### Corporate Partner
- **Access Level:** 40%
- **Sections:** dashboard, campaigns, wallet, reports, analytics
- **Default Role:** corporate_admin
- **Commission:** Volume-based
- **Permissions:** (7 from Media) + user_management

### Institutional Partner
- **Access Level:** 45%
- **Sections:** dashboard, campaigns, wallet, reports, users, programs, settings
- **Default Role:** hub_manager
- **Commission:** 5-10%
- **Permissions:** (8 from Corporate) + program_management, curriculum_management, hub_operations, community_management, settings_management

## 🔐 Role Reference

```typescript
enum PartnerRole {
  AFFILIATE_AGENT = 'affiliate_agent',
  AFFILIATE_ADMIN = 'affiliate_admin',
  
  MEDIA_MANAGER = 'media_manager',
  MEDIA_ADMIN = 'media_admin',
  
  CORPORATE_ADMIN = 'corporate_admin',
  CORPORATE_MANAGER = 'corporate_manager',
  CORPORATE_ANALYST = 'corporate_analyst',
  
  HUB_MANAGER = 'hub_manager',
  HUB_COORDINATOR = 'hub_coordinator',
  
  SUPER_ADMIN = 'super_admin',
}
```

## 📋 Common Tasks

### Task: Restrict Feature to Corporate+ Partners

```typescript
function AnalyticsBoard() {
  const { accessLevel } = usePartnerPermissions();
  
  // Corporate (40%) and Institutional (45%) only
  if (accessLevel < 40) {
    return <UpgradePrompt minAccessLevel={40} />;
  }
  
  return <AnalyticsContent />;
}
```

### Task: Show Admin-Only UI

```typescript
function UserManagement() {
  const { isPartnerAdmin, partnerType } = usePartnerPermissions();
  
  return (
    <>
      {isPartnerAdmin() && (
        <AdminToolbar>
          {/* Admin controls */}
        </AdminToolbar>
      )}
      <UserTable />
    </>
  );
}
```

### Task: Dynamic Permission Checking

```typescript
function ContentManager() {
  const { hasPermission } = usePartnerPermissions();
  
  return (
    <div>
      {hasPermission('content_management') && (
        <ContentUploadButton />
      )}
    </div>
  );
}
```

### Task: Get Commission Rate

```typescript
function EarningsDisplay() {
  const { getDefaultCommissionRate } = usePartnerPermissions();
  
  const commissionRate = getDefaultCommissionRate();
  // Returns: Affiliate=5, Media=12.5, Corporate=variable, Inst=5-10
  
  return <div>Commission: {commissionRate}%</div>;
}
```

## 🔗 Data Flow

```
User Signup
  ↓ Select: Affiliate|Media|Corporate|Institutional
  ↓
completeUserProfile()
  ↓ Get partnerType from sessionStorage
  ↓ Map to default role
  ↓ Store both in database
  ↓
useAuth() loads
  ↓ Fetches user.partner_role from database
  ↓ Fetches partner.partner_type from database
  ↓
usePartnerPermissions() reads
  ↓ user.partner_role → determines role permissions
  ↓ partner.partner_type → determines section access
  ↓
Components check
  ↓ canAccessSection('analytics')?
  ↓ hasPermission('user_management')?
  ↓
UI renders based on permissions
```

## 🛠️ Debugging

### Check Partner Type in Browser Console

```javascript
// In browser DevTools
localStorage.getItem('auth-token') // Check if logged in
// Then call:
const { usePartnerPermissions } = await import('./hooks/usePartnerPermissions');
const perms = usePartnerPermissions();
console.log(perms.partnerType); // Should be 'affiliate'|'media'|'corporate'|'institutional'
console.log(perms.partnerRole);  // Should be role string
```

### Database Query for User Permissions

```sql
SELECT 
  u.id,
  u.email,
  u.partner_role,
  p.id as partner_id,
  p.partner_type,
  p.access_level,
  p.commission_rate,
  pt.name as partner_type_name
FROM users u
JOIN partners p ON u.partner_id = p.id
JOIN partner_types pt ON p.partner_type = pt.slug
WHERE u.email = 'user@example.com';
```

### Check Available Sections for Partner Type

```typescript
import { DASHBOARD_SECTIONS_BY_PARTNER_TYPE } from '../types/partner.types';

const sections = DASHBOARD_SECTIONS_BY_PARTNER_TYPE['corporate'];
console.log(sections);
// ['dashboard', 'campaigns', 'wallet', 'reports', 'analytics']
```

### List All Permissions for Partner Type

```typescript
import { PERMISSIONS_BY_PARTNER_TYPE } from '../types/partner.types';

const perms = PERMISSIONS_BY_PARTNER_TYPE['institutional'];
console.log(perms);
// All permissions available to institutional partners
```

## ⚠️ Common Mistakes

### ❌ Wrong: Checking partner_role directly

```typescript
// Don't do this
if (user?.partner_role === 'corporate_admin') { }
```

### ✅ Right: Use the hook

```typescript
// Do this
const { hasRole } = usePartnerPermissions();
if (hasRole(PartnerRole.CORPORATE_ADMIN)) { }
```

### ❌ Wrong: Hardcoding section names

```typescript
// Don't do this
const sections = ['dashboard', 'campaigns', 'wallet'];
```

### ✅ Right: Get from config

```typescript
// Do this
const { getAvailableSections } = usePartnerPermissions();
const sections = getAvailableSections();
```

### ❌ Wrong: Checking permissions without partner type

```typescript
// Don't do this - won't work if no partner type
if (user.role === 'admin') { }
```

### ✅ Right: Use permission hook

```typescript
// Do this - uses partner type
const { hasPermission } = usePartnerPermissions();
if (hasPermission('analytics_view')) { }
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [PARTNER_TYPE_SYSTEM_GUIDE.md](PARTNER_TYPE_SYSTEM_GUIDE.md) | Full documentation with examples |
| [PARTNER_TYPE_IMPLEMENTATION.md](PARTNER_TYPE_IMPLEMENTATION.md) | Implementation checklist |
| [PARTNER_TYPE_SYSTEM_COMPLETE.md](PARTNER_TYPE_SYSTEM_COMPLETE.md) | Complete status report |
| [src/types/partner.types.ts](src/types/partner.types.ts) | Type definitions |
| [src/hooks/usePartnerPermissions.ts](src/hooks/usePartnerPermissions.ts) | Permission hook implementation |

## 🚨 Getting Help

1. **TypeScript errors?** → Check `src/types/partner.types.ts` for correct enum values
2. **Permission denied?** → Check database has partner_type set and useAuth() fetches it
3. **Wrong sections showing?** → Verify DASHBOARD_SECTIONS_BY_PARTNER_TYPE mapping
4. **Role not assigned?** → Check completeUserProfile() calls getDefaultRoleForPartnerType()

---

**Last Updated:** {{date}}
**System Status:** ✅ PRODUCTION READY
