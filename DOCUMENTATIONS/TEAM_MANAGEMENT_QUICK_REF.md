# Quick Reference: Child Users & Team Management

## Files Created

### JSON Data Files

```
src/auth/data/created_users.json    → Child user definitions
src/auth/data/user_activity.json    → Activity logs for all users
src/auth/data/user_metrics.json     → Performance metrics per user
```

### Hook File

```
src/hooks/useTeamData.ts            → Team management hooks
```

### Updated Components

```
src/ui/dashboard/RecentActivity.tsx → Now shows team member activities
```

## Quick Usage Examples

### Display Child Users List

```typescript
import { useTeamData } from "../../hooks/useTeamData";
import { useAuth } from "../../hooks/useAuth";

function MyTeamComponent() {
  const { user } = useAuth();
  const { childUsers, teamSize } = useTeamData(user);

  return (
    <div>
      <h2>My Team ({teamSize})</h2>
      {childUsers.map(child => (
        <div key={child.id}>{child.full_name} - {child.role}</div>
      ))}
    </div>
  );
}
```

### Display Team Metrics

```typescript
import { useTeamData } from "../../hooks/useTeamData";
import { useAuth } from "../../hooks/useAuth";

function TeamMetricsComponent() {
  const { user } = useAuth();
  const { totalTeamEarnings, totalTeamCampaigns, averagePerformanceScore } = useTeamData(user);

  return (
    <div>
      <p>Total Team Earnings: KES {totalTeamEarnings.toLocaleString()}</p>
      <p>Total Campaigns: {totalTeamCampaigns}</p>
      <p>Avg Performance: {averagePerformanceScore}%</p>
    </div>
  );
}
```

### Display User-Specific Metrics

```typescript
import { useUserMetrics } from "../../hooks/useTeamData";

function UserMetricsComponent({ userId }) {
  const metrics = useUserMetrics(userId);

  if (!metrics) return <div>No metrics available</div>;

  return (
    <div>
      <p>Total Earnings: KES {metrics.total_earnings.toLocaleString()}</p>
      <p>Active Campaigns: {metrics.active_campaigns}</p>
      <p>Performance Score: {metrics.performance_score}%</p>
      <p>Tasks Completed: {metrics.tasks_completed}</p>
    </div>
  );
}
```

### Filter Activities for a User

```typescript
import userActivityData from "../../auth/data/user_activity.json";

// Get all activities for a specific user
const userActivities = userActivityData.user_activities.filter(
  (a) => a.user_id === userId
);

// Get all activities from a parent's team
const teamActivities = userActivityData.user_activities.filter(
  (a) => a.parent_user_id === parentUserId
);

// Get recent activities (last 30 days)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentActivities = userActivityData.user_activities.filter(
  (a) => new Date(a.timestamp) >= thirtyDaysAgo
);
```

## Test Data

### Parent Users (Can Create Child Users)

- **user-002** (admin_partner@partner) - Has 3 child users
- **user-003** (affiliate@partner) - Has 2 child users

### Child Users

- child-user-001 to child-user-005

### Sample Activity Flow

1. Parent user (user-002) logs in
2. RecentActivity shows all activities from user-002 and their 3 child users
3. Parent sees team performance in SmallCardsGrid (future integration)
4. Parent can click on child users to see individual metrics

## Integration Points for Future Development

### For Team Dashboard Widget

```typescript
import { useTeamData } from "../../hooks/useTeamData";

export function TeamDashboard() {
  const { user } = useAuth();
  const teamData = useTeamData(user);

  if (teamData.teamSize === 0) {
    return <div>No team members</div>;
  }

  return (
    <div>
      {/* Display team overview cards */}
      {/* Display team member list */}
      {/* Display team metrics */}
    </div>
  );
}
```

### For Team Member Profile

```typescript
import { useChildUser, useUserMetrics } from "../../hooks/useTeamData";

export function TeamMemberProfile({ userId }) {
  const member = useChildUser(userId);
  const metrics = useUserMetrics(userId);

  return (
    <div>
      <h2>{member?.full_name}</h2>
      <p>Role: {member?.role}</p>
      <p>Earnings: KES {metrics?.total_earnings}</p>
    </div>
  );
}
```

### For Activity Timeline

```typescript
import userActivityData from "../../auth/data/user_activity.json";

export function ActivityTimeline({ userId }) {
  const activities = userActivityData.user_activities.filter(
    a => a.user_id === userId || a.parent_user_id === userId
  );

  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id}>
          <span>{activity.user_name}</span>
          <span>{activity.action}</span>
          <span>{new Date(activity.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

## Data Structure Quick Reference

### Child User

```json
{
  "id": "child-user-001",
  "parent_user_id": "user-002",
  "email": "john.doe@partner.com",
  "full_name": "John Doe",
  "role": "team_member | campaign_manager | analyst",
  "access_level": 1-100,
  "is_active": true|false,
  "created_at": "2025-01-10T10:30:00Z"
}
```

### User Activity

```json
{
  "id": "activity-001",
  "user_id": "child-user-001",
  "parent_user_id": "user-002",
  "user_name": "John Doe",
  "action": "created new campaign",
  "action_type": "campaign_creation | withdrawal_request | etc",
  "details": "Summer Marketing Campaign 2025",
  "timestamp": "2025-01-20T15:30:00Z"
}
```

### User Metrics

```json
{
  "user_id": "child-user-001",
  "total_campaigns": 8,
  "active_campaigns": 3,
  "total_earnings": 45000,
  "performance_score": 85,
  "last_activity": "2025-01-20T15:30:00Z"
}
```

## Compilation Status

✅ All files created successfully
✅ All TypeScript errors resolved
✅ RecentActivity component updated and working
✅ useTeamData hook ready for use
✅ Project compiles with zero errors
