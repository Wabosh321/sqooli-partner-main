# Partner Type System Integration Guide

## Overview

The partner type system enables differentiated access and permissions across four partner categories:
- **Affiliate** (25% access level) - Individual agents & grassroots distribution
- **Media** (35% access level) - Radio, influencers, content creators
- **Corporate** (40% access level) - Corporate organizations
- **Institutional** (45% access level) - Educational & institutional partners

## Architecture

### Database Layer

**Tables:**
- `partners` - Extended with `partner_type`, `access_level`, `commission_rate`
- `partner_types` - Reference table for partner type definitions
- `partner_type_permissions` - Maps permissions to each partner type
- `partner_type_roles` - Defines roles available for each partner type

**User Profile Extension:**
- `users.partner_role` - User's specific role within their partner type
- `users.partner_id` - Foreign key to partners table

### TypeScript Types

**File:** `src/types/partner.types.ts`

Key types:
```typescript
enum PartnerTypeSlug {
  AFFILIATE = 'affiliate',
  MEDIA = 'media',
  CORPORATE = 'corporate',
  INSTITUTIONAL = 'institutional',
}

enum PartnerRole {
  AFFILIATE_AGENT = 'affiliate_agent',
  MEDIA_MANAGER = 'media_manager',
  MEDIA_ADMIN = 'media_admin',
  CORPORATE_ADMIN = 'corporate_admin',
  HUB_MANAGER = 'hub_manager',
  // ... 6 more roles
}
```

**Permission & Section Mappings:**
```typescript
PERMISSIONS_BY_PARTNER_TYPE[partnerType] // Array of available permissions
DASHBOARD_SECTIONS_BY_PARTNER_TYPE[partnerType] // Array of accessible sections
```

### Authentication Flow

**Signup → Verification → Profile Completion**

1. **handleRegister()** - Initial signup
   - User enters: first name, last name, email, phone, username, password
   - **NEW:** Optionally selects partner type (defaults to 'affiliate')
   - Stores data in sessionStorage
   - Creates Supabase Auth user

2. **Email Verification** - Supabase sends verification email
   - User clicks link with callback token
   - Browser redirects to `/auth/callback?code=...`

3. **AuthCallback Component** - Handles callback
   - Calls `completeUserProfile()`
   - Triggers RPC to create public.users record
   - Assigns default role based on partner type
   - Creates partners record with partner_type

4. **completeUserProfile()** - Finalizes profile
   - Maps partner type → default role:
     - affiliate → affiliate_agent
     - media → media_manager
     - corporate → corporate_admin
     - institutional → hub_manager
   - Creates users record with partner_role
   - Creates partners record with partner_type

## Integration Points

### 1. Sign Up Form Update

The signup form should include partner type selection:

```typescript
// In your signup form component
const [formData, setFormData] = useState<RegisterFormData>({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  username: '',
  password: '',
  confirmPassword: '',
  partnerType: 'affiliate', // Default selection
});

// Add dropdown/radio for partner type
<select 
  name="partnerType" 
  value={formData.partnerType}
  onChange={(e) => setFormData({...formData, partnerType: e.target.value})}
>
  <option value="affiliate">Affiliate (25% access)</option>
  <option value="media">Media (35% access)</option>
  <option value="corporate">Corporate (40% access)</option>
  <option value="institutional">Institutional (45% access)</option>
</select>
```

### 2. Permission Checking in Components

Use `usePartnerPermissions()` hook:

```typescript
import { usePartnerPermissions } from '../hooks/usePartnerPermissions';

export function MyComponent() {
  const { 
    canAccessSection, 
    hasPermission, 
    partnerType,
    isPartnerAdmin 
  } = usePartnerPermissions();

  if (!canAccessSection('dashboard')) {
    return <LockedSection sectionName="Dashboard" />;
  }

  if (!hasPermission('view_analytics')) {
    return <RestrictedFeature />;
  }

  return <Dashboard />;
}
```

### 3. Dashboard Section Routing

Dashboard automatically filters sections based on partner type:

```typescript
// Dashboard.tsx uses usePartnerPermissions()
const { getAvailableSections } = usePartnerPermissions();

// Only renders sections available to user's partner type
const availableSections = getAvailableSections();
// Affiliate gets: [dashboard, campaigns, wallet]
// Media gets: [dashboard, campaigns, wallet, reports, analytics]
// Corporate gets: [dashboard, campaigns, wallet, reports, analytics]
// Institutional gets: [dashboard, campaigns, wallet, reports, users, programs, settings]
```

### 4. useAuth Hook Integration

`useAuth()` now fetches partner type information:

```typescript
const { user, partner } = useAuth();

// partner.partner_type contains:
// {
//   id: string,
//   name: string,
//   slug: PartnerTypeSlug,
//   access_level: number,
//   default_commission_rate: number
// }

// user.partner_role contains user's specific role
```

## Data Flow Example

### User Signup: Jane (Corporate Partner)

1. **Signup Page**
   - Jane enters: Jane Smith, jane@company.com, 555-1234, jsmith, password
   - Selects: "Corporate"
   - Stored in sessionStorage: `{firstName, lastName, email, phone, username, partnerType: 'corporate'}`

2. **Email Verification**
   - Jane clicks email link
   - Redirects to `/auth/callback?code=...&type=signup`

3. **AuthCallback Component**
   - `completeUserProfile()` called
   - Gets data from sessionStorage + Supabase auth
   - Calls RPC `create_user_profile()`:
     - Creates public.users record with:
       - id, email, full_name, phone, username, auth_id
       - **partner_role: 'corporate_admin'** (assigned by type)
       - is_first_login: true

4. **Partner Record Creation**
   - Creates partners record:
     - user_id: jane's user id
     - org_name: "Jane Smith"
     - org_email: jane@company.com
     - org_phone: 555-1234
     - **partner_type: 'corporate'**
     - access_level: null (set by admin later)
     - commission_rate: null (set by admin later)

5. **Dashboard Access**
   - Jane logs in
   - useAuth() fetches user + partner with partner_type
   - usePartnerPermissions() determines:
     - partnerType: 'corporate'
     - userPartnerRole: 'corporate_admin'
     - availableSections: [dashboard, campaigns, wallet, reports, analytics]
   - Dashboard renders only those 5 sections
   - Jane can access all corporate permissions

## Permission Matrix

### Affiliate Partner (25% access)
- Permissions: campaign_view, dashboard_view, wallet_view, commission_view, profile_management
- Sections: dashboard, campaigns, wallet
- Default Role: affiliate_agent
- Commission: 5%

### Media Partner (35% access)
- Permissions: campaign_view, dashboard_view, wallet_view, analytics_view, commission_view, content_management, profile_management, bulk_operations
- Sections: dashboard, campaigns, wallet, reports, analytics
- Default Role: media_manager
- Commission: 12.5%

### Corporate Partner (40% access)
- Permissions: campaign_view, dashboard_view, wallet_view, reports_view, analytics_view, user_management, content_management, profile_management, bulk_operations
- Sections: dashboard, campaigns, wallet, reports, analytics
- Default Role: corporate_admin
- Commission: Volume-based pricing

### Institutional Partner (45% access)
- Permissions: campaign_view, dashboard_view, wallet_view, reports_view, analytics_view, user_management, content_management, profile_management, program_management, curriculum_management, hub_operations, community_management, settings_management
- Sections: dashboard, campaigns, wallet, reports, users, programs, settings
- Default Role: hub_manager
- Commission: 5-10%

## Migration Steps

If updating existing database:

1. **Run Migration**
   ```sql
   -- Execute supabase/migrations/add_partner_types.sql
   -- This creates partner_types, partner_type_permissions, partner_type_roles tables
   -- And adds partner_type, access_level, commission_rate to partners table
   ```

2. **Update Existing Partners (Admin)**
   ```sql
   UPDATE partners 
   SET partner_type = 'affiliate'  -- Set appropriate type
   WHERE partner_type IS NULL;
   ```

3. **Assign User Roles (Admin)**
   ```sql
   UPDATE users 
   SET partner_role = 'affiliate_agent'  -- Based on partner type
   WHERE partner_role IS NULL;
   ```

## Validation Checklist

Before deploying to production:

- [ ] Partners table has partner_type, access_level, commission_rate columns
- [ ] Users table has partner_role column
- [ ] partner_types table has 4 rows (affiliate, media, corporate, institutional)
- [ ] Signup form includes partner type selection
- [ ] completeUserProfile() stores partner_type in partners table
- [ ] completeUserProfile() assigns default role to users table
- [ ] useAuth() fetches partner_type from partners table
- [ ] Dashboard uses usePartnerPermissions() for section routing
- [ ] RLS policies allow users to update their own partner_role
- [ ] All dashboard sections have permission guards

## Common Issues & Solutions

### Issue: Users see "Locked" for all sections
**Cause:** usePartnerPermissions() returning null for partnerType
**Solution:** 
- Check partners table has partner_type populated
- Check useAuth() is fetching partner data with partner_type
- Verify partner_types table exists with data

### Issue: New users can't see sections after signup
**Cause:** Partner record not created or partner_type not set
**Solution:**
- Check completeUserProfile() successfully creates partners record
- Verify partner_type is passed in registration data
- Check session storage contains partnerType before completeUserProfile() call

### Issue: Wrong role assigned to users
**Cause:** getDefaultRoleForPartnerType() returning unexpected value
**Solution:**
- Add console.log in completeUserProfile() to verify partnerType
- Check partner_type value matches enum values (exact spelling)
- Verify default role mapping in getDefaultRoleForPartnerType()

## Testing Guide

### Manual Testing Checklist

1. **Signup with each partner type**
   - Affiliate signup → should get affiliate_agent role
   - Media signup → should get media_manager role
   - Corporate signup → should get corporate_admin role
   - Institutional signup → should get hub_manager role

2. **Verify database records**
   ```sql
   SELECT id, email, partner_role, partner_id FROM users WHERE email = 'test@example.com';
   SELECT id, org_name, partner_type FROM partners WHERE user_id = 'xxx';
   ```

3. **Dashboard section visibility**
   - Affiliate should see 3 sections
   - Media should see 5 sections
   - Corporate should see 5 sections
   - Institutional should see 7 sections

4. **Permission checking**
   - Call usePartnerPermissions().hasPermission() for each partner type
   - Verify correct permissions returned

### Automated Testing (Example)

```typescript
describe('Partner Type System', () => {
  it('should assign correct role based on partner type', () => {
    const affData = { partnerType: 'affiliate' };
    expect(getDefaultRoleForPartnerType(affData.partnerType))
      .toBe('affiliate_agent');
  });

  it('should return correct sections for corporate', () => {
    const sections = DASHBOARD_SECTIONS_BY_PARTNER_TYPE['corporate'];
    expect(sections.length).toBe(5);
    expect(sections).toContain('dashboard');
  });
});
```

## File Reference

| File | Purpose |
|------|---------|
| [src/types/partner.types.ts](src/types/partner.types.ts) | Enums, interfaces, permission mappings |
| [src/hooks/usePartnerPermissions.ts](src/hooks/usePartnerPermissions.ts) | Permission checking hook |
| [src/hooks/useAuth.ts](src/hooks/useAuth.ts) | Auth hook with partner_type support |
| [src/utils/completeUserProfile.ts](src/utils/completeUserProfile.ts) | Profile completion with partner type |
| [src/types/auth.types.ts](src/types/auth.types.ts) | RegisterFormData with partnerType field |
| [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) | Dashboard using usePartnerPermissions |
| [supabase/migrations/add_partner_types.sql](supabase/migrations/add_partner_types.sql) | Database migration |

## Next Steps

1. **Update Signup Form** - Add partner type selection
2. **Test End-to-End** - New user signup → email → profile → dashboard access
3. **Assign Types to Existing Partners** - Run migration SQL for existing data
4. **Update Admin Dashboard** - Add UI to change partner types/roles for existing partners
5. **Monitor** - Check logs for any permission errors after deployment
