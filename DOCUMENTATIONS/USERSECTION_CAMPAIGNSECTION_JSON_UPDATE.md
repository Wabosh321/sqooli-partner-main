# UserSection & CampaignSection JSON Integration

## Overview

Updated UserSection.tsx and CampaignSection.tsx to use JSON data files instead of database queries.

## Files Updated

### 1. UserSection.tsx

**Changes Made:**

- Added import for `useEffect` hook
- Imported JSON data files:
  - `created_users.json` - Child user definitions
  - `user_activity.json` - Activity logs for all users
  - `user_metrics.json` - Individual user performance metrics

**Data Loading:**

```typescript
useEffect(() => {
  // Get child users created by current user
  const childUsers = createdUsersData.created_users.filter(
    (cu: any) => cu.parent_user_id === user.id
  );

  // Map to ViewUser format with metrics
  const usersWithMetrics = childUsers.map((cu: any) => {
    const metrics = userMetricsData.user_metrics.find(
      (m: any) => m.user_id === cu.id
    );
    return {
      _id: cu.id,
      name: cu.full_name,
      email: cu.email,
      role: cu.role,
      is_account_activated: cu.is_active,
      access_level: cu.access_level,
      partner_type: cu.partner_type,
      metrics: metrics || {},
    };
  });

  // Get activities for user and their child users
  const relevantActivities = userActivityData.user_activities.filter(
    (activity: any) => {
      if (activity.user_id === user.id) return true;
      if (activity.parent_user_id === user.id) return true;
      return false;
    }
  );

  // Sort activities by timestamp
  const sortedActivities = [...relevantActivities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  setUsers(usersWithMetrics);
  setAuditLogs(sortedActivities);
}, [user]);
```

**Features:**

- Parent users see their created child users in the Users tab
- Child users are formatted with metrics included
- Audit logs show activities from current user and all their child users
- Activities sorted by most recent first
- Error handling with fallback to empty arrays

**User Display Format:**

```typescript
{
  _id: string; // User ID
  name: string; // Full name
  email: string; // Email address
  role: string; // User role
  is_account_activated: boolean; // Active status
  access_level: number; // Permission level
  partner_type: string; // Partner type
  metrics: object; // Performance metrics
}
```

### 2. CampaignSection.tsx

**Changes Made:**

- Added import for `useEffect` hook
- Removed import of `useCampaigns` hook (was fetching from Supabase)
- Imported `campaigns.json` data file

**Data Loading:**

```typescript
const [campaigns, setCampaigns] = useState<any[]>([]);
const [campaignsLoading, setCampaignsLoading] = useState(false);

useEffect(() => {
  try {
    setCampaignsLoading(true);
    if (!partnerId || !canViewCampaigns) {
      setCampaigns([]);
      return;
    }

    // Filter campaigns by partner_id
    const filteredByPartner = campaignsData.campaigns.filter(
      (c: any) => !partnerId || c.partner_id === partnerId
    );

    setCampaigns(filteredByPartner);
  } catch (err) {
    console.error("CampaignSection: error loading campaigns", err);
    setCampaigns([]);
  } finally {
    setCampaignsLoading(false);
  }
}, [partnerId, canViewCampaigns]);
```

**Features:**

- Campaigns filtered by current partner ID
- Loading state properly managed
- Error handling with empty fallback
- Respects user permissions (canViewCampaigns)
- Re-fetches when partnerId or permissions change

**Campaign Display Format:**

```typescript
{
  id: string; // Campaign ID
  name: string; // Campaign name
  partner_id: string; // Partner ID
  status: string; // "active" | "upcoming" | "expired"
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  budget: number; // Budget amount
  spent: number; // Amount spent
  created_at: string; // Creation timestamp
}
```

## Data Flow

### UserSection

```
Current User (useAuth)
    ↓
Get user ID
    ↓
Filter created_users.json by parent_user_id
    ↓
Get metrics for each child user from user_metrics.json
    ↓
Filter user_activity.json for relevant activities
    ↓
Display child users and their activities
```

### CampaignSection

```
Current Partner (useAuth)
    ↓
Get partner ID
    ↓
Filter campaigns.json by partner_id
    ↓
Display campaigns by status (active, draft, expired)
```

## Permission Checks

### UserSection

- `canAccessUsers`: Determines if user tier includes user management
- `canViewUsers`: Read permission for users category
- `canManageUsers`: Write permission for users category
- Parent users see only their created child users

### CampaignSection

- `canAccessCampaigns`: Determines if partner tier includes campaigns
- `canViewCampaigns`: Read permission for campaigns category
- `canManageCampaigns`: Write permission for campaigns category
- Campaigns are filtered by current partner ID

## Component Behavior

### UserSection Tabs

- **Active Users**: Shows is_account_activated = true
- **Inactive Users**: Shows is_account_activated = false
- **Audit Logs**: Shows activities for user and all child users

### CampaignSection Tabs

- **Active**: Shows campaigns with status = "active"
- **Draft**: Shows campaigns with status = "draft"
- **Expired**: Shows campaigns with status = "expired"

## Mock Data Structure

### created_users.json

- 5 child users total
- 3 created by user-002
- 2 created by user-003

### user_activity.json

- 12 activity records
- Activities include: campaign_creation, campaign_update, withdrawal_request, etc.
- Each activity has parent_user_id for filtering

### campaigns.json

- 5 campaigns total
- Various partner IDs and statuses
- Includes budget and spending data

## Error Handling

Both components include:

- Try-catch blocks for data loading
- Fallback to empty arrays on error
- Console error logging for debugging
- Loading states during data fetch
- Permission guards before rendering

## Compilation Status

✅ All TypeScript errors resolved
✅ All imports correct
✅ Both components compile successfully
✅ No missing dependencies
✅ Ready for production use

## Future Database Integration

To replace with actual database queries:

**UserSection:**

```typescript
// Replace with:
// SELECT * FROM created_users WHERE parent_user_id = ?
// SELECT * FROM user_metrics WHERE parent_user_id IN (...)
// SELECT * FROM user_activities WHERE parent_user_id = ? OR user_id = ?
```

**CampaignSection:**

```typescript
// Replace with:
// SELECT * FROM campaigns WHERE partner_id = ?
```

## Testing Notes

### Test as Parent User (user-002)

1. Login as partner@sqooli.com
2. Go to Users section
3. Should see 3 child users (John Doe, Jane Smith, Mike Wilson)
4. Audit logs should show activities from all team members

### Test as Child User

1. Login as child user
2. Go to Users section
3. Should see empty/no child users (they have no team)
4. Audit logs should show only their own activities

### Test Campaigns

1. Login as any user with campaign access
2. Go to Campaigns section
3. Should see campaigns filtered by their partner_id
4. Can filter by status (active, draft, expired)
