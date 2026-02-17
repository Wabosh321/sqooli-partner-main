# Child Users & Team Management System

## Overview

The system now supports parent users (like `admin_partner`) creating and managing child users. Parent users can view aggregated metrics and activity logs from all their created users.

## JSON Data Files

### 1. **created_users.json**

Location: `src/auth/data/created_users.json`

Structure: Array of user objects created by parent users

```json
{
  "id": "child-user-001",
  "parent_user_id": "user-002",
  "email": "john.doe@partner.com",
  "full_name": "John Doe",
  "role": "team_member",
  "partner_type": "institutional",
  "access_level": 20,
  "permissions": [...],
  "is_active": true,
  "created_at": "2025-01-10T10:30:00Z",
  "created_by": "user-002"
}
```

**Fields:**

- `id`: Unique identifier for the child user
- `parent_user_id`: ID of the user who created this user
- `email`: User's email address
- `full_name`: User's full name
- `role`: User's role (team_member, campaign_manager, analyst, etc.)
- `partner_type`: Partner type (institutional, affiliate, media, corporate)
- `access_level`: Permission level (1-100)
- `permissions`: Array of permission objects with category and level
- `is_active`: Whether the user account is active
- `created_at`: When the user was created
- `created_by`: ID of the user who created them

### 2. **user_activity.json**

Location: `src/auth/data/user_activity.json`

Structure: Array of activity logs for all users

```json
{
  "id": "activity-001",
  "user_id": "child-user-001",
  "parent_user_id": "user-002",
  "user_name": "John Doe",
  "action": "created new campaign",
  "action_type": "campaign_creation",
  "details": "Summer Marketing Campaign 2025",
  "timestamp": "2025-01-20T15:30:00Z"
}
```

**Fields:**

- `id`: Unique activity ID
- `user_id`: ID of the user performing the action
- `parent_user_id`: ID of the parent user (null if parent user is taking action)
- `user_name`: Name of the user taking action
- `action`: Human-readable description of the action
- `action_type`: Normalized action type (campaign_creation, report_view, etc.)
- `details`: Additional details about the action
- `timestamp`: When the action occurred

**Activity Types:**

- campaign_creation, campaign_update
- withdrawal_request, withdrawal_approval
- report_generation, report_view, report_download
- program_creation
- login
- user_creation

### 3. **user_metrics.json**

Location: `src/auth/data/user_metrics.json`

Structure: Performance metrics for each user

```json
{
  "user_id": "child-user-001",
  "parent_user_id": "user-002",
  "user_name": "John Doe",
  "total_campaigns": 8,
  "active_campaigns": 3,
  "total_earnings": 45000,
  "pending_withdrawals": 15000,
  "completed_withdrawals": 30000,
  "engagements": 1250,
  "tasks_completed": 45,
  "performance_score": 85,
  "last_activity": "2025-01-20T15:30:00Z"
}
```

**Fields:**

- `user_id`: ID of the user
- `parent_user_id`: ID of the parent user
- `user_name`: User's name
- `total_campaigns`: Total number of campaigns created/managed
- `active_campaigns`: Number of currently active campaigns
- `total_earnings`: Total earnings from all campaigns
- `pending_withdrawals`: Total pending withdrawal requests
- `completed_withdrawals`: Total completed withdrawals
- `engagements`: Number of user engagements
- `tasks_completed`: Number of tasks completed
- `performance_score`: Calculated performance score (0-100)
- `last_activity`: Timestamp of last user action

## Hooks

### useTeamData(user)

Returns aggregated team data for a parent user.

```typescript
const {
  childUsers,
  teamMetrics,
  totalTeamEarnings,
  totalTeamCampaigns,
  averagePerformanceScore,
  teamSize,
} = useTeamData(user);
```

**Returns:**

```typescript
{
  childUsers: any[],           // Array of child user objects
  teamMetrics: any[],          // Performance metrics for all team members
  totalTeamEarnings: number,   // Sum of all team member earnings
  totalTeamCampaigns: number,  // Total campaigns across team
  averagePerformanceScore: number, // Average performance score
  teamSize: number             // Number of team members
}
```

### useUserMetrics(userId)

Returns metrics for a specific user.

```typescript
const metrics = useUserMetrics(userId);
```

**Returns:** User metrics object or null

### useChildUser(userId)

Returns information about a specific child user.

```typescript
const childUser = useChildUser(userId);
```

**Returns:** Child user object or null

## Component Updates

### RecentActivity.tsx

**Changes:**

- Now uses `useAuth()` hook to get current user
- Imports `user_activity.json` instead of `audit_logs.json`
- Filters activities to show:
  - Own activities (current user)
  - Activities of all child users (if parent user)
- Displays user name, action, and timestamp
- Shows 10 most recent activities

**Usage:**
When a parent user (like user-002) logs in, they'll see activities from themselves and all their created users (John Doe, Jane Smith, Mike Wilson) in the Recent Activity widget.

When a child user logs in, they'll only see their own activities.

## Example Scenarios

### Parent User Viewing Dashboard

User: user-002 (admin_partner with 3 created users)

Recent Activity shows:

- John Doe: "created new campaign"
- Jane Smith: "updated campaign settings"
- Mike Wilson: "generated report"
- John Doe: "submitted withdrawal request"
- Jane Smith: "viewed campaign analytics"

Team Metrics:

- Team Size: 3
- Total Earnings: KES 155,500
- Average Performance Score: 84
- Total Campaigns: 26

### Child User Viewing Dashboard

User: child-user-001 (John Doe)

Recent Activity shows:

- Only their own activities:
  - "created new campaign"
  - "submitted withdrawal request"
  - "downloaded report"

Team Data: None (they have no child users)

## Database Integration Ready

These JSON files are production-ready to be replaced with actual database queries:

- `created_users.json` → SELECT \* FROM created_users WHERE parent_user_id = ?
- `user_activity.json` → SELECT \* FROM audit_logs WHERE parent_user_id = ? OR user_id = ?
- `user_metrics.json` → SELECT \* FROM user_metrics WHERE parent_user_id = ?

## Compilation Status

✅ All TypeScript types resolved
✅ All hooks exported and ready for use
✅ RecentActivity component updated
✅ Zero compilation errors
