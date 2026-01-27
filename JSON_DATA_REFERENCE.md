# JSON Data Structure - Quick Reference

## File Locations

All JSON data files are located in: `src/auth/data/`

```
src/auth/data/
├── users.json                 # Main user accounts
├── created_users.json         # Child users created by parents
├── campaigns.json             # Campaign definitions
├── enrollments.json           # Program enrollments
├── revenue.json               # Partner revenue logs
├── programs.json              # Program definitions
├── transactions.json          # Financial transactions
├── wallets.json               # Partner wallets
├── user_activity.json         # Activity audit log
├── user_metrics.json          # User performance metrics
└── audit_logs.json            # Compliance audit trail
```

## Data Schema Reference

### users.json

```json
{
  "users": [
    {
      "id": "user-001",
      "email": "admin@sqooli.com",
      "password": "Password@123",
      "role": "super_admin|admin_partner|partner_member",
      "partner_type": "institutional|affiliate",
      "access_level": 0-100,
      "permissions": [
        {
          "category": "dashboard|campaigns|wallet|reports|users|programs|settings",
          "level": "full|read|write"
        }
      ],
      "is_first_login": true|false,
      "partner_id": "partner-001"
    }
  ]
}
```

### campaigns.json

```json
{
  "campaigns": [
    {
      "id": "campaign-001",
      "name": "Campaign Name",
      "partner_id": "partner-001",
      "program_id": "program-001",
      "status": "active|upcoming|draft|expired",
      "promo_code": "PROMO2024",
      "duration_start": "2024-06-01T00:00:00Z",
      "duration_end": "2024-08-31T23:59:59Z",
      "budget": 50000,
      "spent": 35000,
      "revenue_projection": 75000,
      "target_signups": 150,
      "daily_target": 5,
      "whatsapp_number": "254712345678",
      "bundled_offers": {
        "min_lessons": 10,
        "total_price": 3200
      },
      "discount_rule": {
        "price_per_lesson": 320
      },
      "revenue_share": {
        "partner_percentage": 60,
        "sqooli_percentage": 40
      },
      "created_at": "2024-05-15T10:30:00Z"
    }
  ]
}
```

### enrollments.json

```json
{
  "program_enrollments": [
    {
      "id": "enrollment-001",
      "campaign_id": "campaign-001",
      "program_id": "program-001",
      "user_id": "user-101",
      "status": "redeemed|pending",
      "enrollment_date": "2025-01-15T10:30:00Z",
      "redemption_date": "2025-01-18T14:20:00Z|null"
    }
  ]
}
```

### revenue.json

```json
{
  "partner_revenue": [
    {
      "id": "revenue-001",
      "campaign_id": "campaign-001",
      "partner_id": "partner-001",
      "amount": 3200,
      "split_timestamp": "2025-01-15T10:30:00Z",
      "transaction_type": "enrollment|withdrawal|refund"
    }
  ]
}
```

### programs.json

```json
{
  "programs": [
    {
      "id": "program-001",
      "name": "Advanced Marketing Course",
      "description": "Comprehensive digital marketing training",
      "partner_id": "partner-001",
      "status": "active|inactive",
      "created_at": "2024-12-01T08:00:00Z"
    }
  ]
}
```

### transactions.json

```json
{
  "transactions": [
    {
      "id": "tx-001",
      "partner_id": "partner-001",
      "user_id": "user-002",
      "transaction_type": "earning|withdrawal|engagement",
      "amount": 2500,
      "created_at": "2025-01-20T08:30:00Z",
      "campaign_id": "campaign-001"
    }
  ]
}
```

### wallets.json

```json
{
  "wallets": [
    {
      "id": "wallet-001",
      "partner_id": "partner-001",
      "balance": 125750.5,
      "total_earned": 185000.0,
      "paybill_number": "2847571",
      "account_number": "98765463",
      "currency": "KES",
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2025-01-20T10:30:00Z"
    }
  ]
}
```

### user_activity.json

```json
{
  "user_activities": [
    {
      "id": "activity-001",
      "user_id": "child-user-001",
      "parent_user_id": "user-002",
      "user_name": "John Doe",
      "action": "created new campaign",
      "action_type": "campaign_creation|campaign_update|report_generation|withdrawal_request|login",
      "details": "Description of the action",
      "timestamp": "2025-01-20T15:30:00Z"
    }
  ]
}
```

### created_users.json

```json
{
  "created_users": [
    {
      "id": "child-user-001",
      "parent_user_id": "user-002",
      "email": "childuser@sqooli.com",
      "name": "Child User Name",
      "role": "partner_member|partner_staff",
      "access_level": 20-50,
      "created_at": "2024-12-15T10:00:00Z"
    }
  ]
}
```

### user_metrics.json

```json
{
  "user_metrics": [
    {
      "id": "metric-001",
      "user_id": "user-001",
      "campaigns_created": 5,
      "total_earnings": 185000.0,
      "performance_score": 85.5,
      "last_updated": "2025-01-20T10:30:00Z"
    }
  ]
}
```

### audit_logs.json

```json
{
  "audit_logs": [
    {
      "id": "audit-001",
      "action": "campaign_created|campaign_updated|user_created|withdrawal_approved",
      "user_id": "user-002",
      "timestamp": "2025-01-20T15:30:00Z",
      "details": "Audit event details",
      "ip_address": "192.168.1.1",
      "status": "success|failure"
    }
  ]
}
```

## Component ↔ JSON Mapping

| Component          | Primary JSON               | Secondary JSON                                |
| ------------------ | -------------------------- | --------------------------------------------- |
| SmallCardsGrid     | campaigns.json             | transactions.json, wallets.json               |
| UpcomingCampaigns  | campaigns.json             | —                                             |
| LineChart          | transactions.json          | —                                             |
| TabbedMetricsChart | transactions.json          | —                                             |
| RecentActivity     | user_activity.json         | created_users.json                            |
| WalletBalanceCard  | wallets.json               | —                                             |
| CampaignDetails    | campaigns.json             | enrollments.json, revenue.json, programs.json |
| CampaignSection    | campaigns.json             | —                                             |
| CampaignAssets     | campaigns.json (generated) | —                                             |

## Common Filtering Patterns

### Filter by Partner

```tsx
const partnerRecords = data.records.filter(
  (r) => !partnerId || r.partner_id === partnerId,
);
```

### Filter by Date Range

```tsx
const since = new Date();
since.setDate(since.getDate() - 30);
const recent = data.records.filter((r) => new Date(r.created_at) >= since);
```

### Filter by Status

```tsx
const active = campaigns.filter((c) => c.status === "active");
const upcoming = campaigns.filter((c) => c.status === "upcoming");
```

### Filter by User

```tsx
const userActivities = activities.filter(
  (a) => a.user_id === user.id || a.parent_user_id === user.id,
);
```

## Import Pattern

```tsx
import dataName from "../../auth/data/filename.json";

// Access the data
const records = dataName.recordKey.filter((r) => condition);
```

## Data Consistency Rules

1. **ID References:** Always match across files (campaign_id, partner_id, user_id)
2. **Dates:** Use ISO 8601 format with timezone (YYYY-MM-DDTHH:mm:ssZ)
3. **Currency:** All amounts in KES (Kenyan Shilling) as integers
4. **Percentages:** Stored as 0-100 (not decimals)
5. **Status:** Use enum values (active, inactive, pending, etc.)
6. **Email:** Always lowercase in storage

## Performance Notes

- JSON files are loaded synchronously
- No database queries required
- All filtering happens in-memory
- File size is manageable for demo data
- Can be optimized with lazy loading if needed

## Error Handling

```tsx
useEffect(() => {
  try {
    const filtered = dataJson.records.filter((r) => condition);
    setState(filtered);
  } catch (err) {
    console.error("Failed to load data", err);
    setState([]);
  }
}, [dependencies]);
```

## Future Scalability

To migrate from JSON to API:

1. Replace JSON imports with API calls
2. Wrap in useEffect with async/await
3. Add loading and error states
4. Update error handling
5. Add pagination for large datasets

Example migration:

```tsx
// FROM:
import dataJson from "../../auth/data/file.json";
const records = dataJson.records.filter(...);

// TO:
const [records, setRecords] = useState([]);
useEffect(() => {
  fetch('/api/records').then(r => r.json()).then(setRecords);
}, []);
```

---

**Last Updated:** January 23, 2026  
**Status:** Complete and Production Ready ✅
