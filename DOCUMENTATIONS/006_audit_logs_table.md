# Audit Logs Table - Phase 2

| Property        | Value             |
| --------------- | ----------------- |
| **Table Name**  | public.audit_logs |
| **Primary Key** | id (UUID)         |
| **References**  | profiles          |
| **RLS Enabled** | Yes               |
| **Realtime**    | No                |
| **Immutable**   | Yes               |
| **Created**     | Phase 2           |

## Columns

| Column Name   | Type      | Constraints                   | Default           | Nullable | Purpose                                            |
| ------------- | --------- | ----------------------------- | ----------------- | -------- | -------------------------------------------------- |
| id            | UUID      | PK, DEFAULT gen_random_uuid() | —                 | NO       | Log entry identifier                               |
| user_id       | UUID      | FK→profiles                   | NULL              | YES      | User who performed action                          |
| action        | TEXT      | NOT NULL                      | —                 | NO       | Human-readable action description                  |
| action_type   | TEXT      | NOT NULL                      | —                 | NO       | Action type (create, update, delete, view, export) |
| resource_type | TEXT      | —                             | NULL              | YES      | Resource type (campaigns, wallets, users)          |
| resource_id   | TEXT      | —                             | NULL              | YES      | Resource identifier (polymorphic)                  |
| changes       | JSONB     | —                             | NULL              | YES      | Old vs new values (for updates)                    |
| ip_address    | INET      | —                             | NULL              | YES      | IP address of requester                            |
| user_agent    | TEXT      | —                             | NULL              | YES      | User agent string                                  |
| created_at    | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Log timestamp (immutable)                          |

## Indexes

| Index Name                   | Columns       | Purpose            |
| ---------------------------- | ------------- | ------------------ |
| idx_audit_logs_user_id       | user_id       | Filter by user     |
| idx_audit_logs_action_type   | action_type   | Filter by action   |
| idx_audit_logs_resource_type | resource_type | Filter by resource |
| idx_audit_logs_created_at    | created_at    | Time-based queries |
| idx_audit_logs_resource_id   | resource_id   | Lookup by resource |

## RLS Policies

| Policy Name                         | Operation | Conditions                                      |
| ----------------------------------- | --------- | ----------------------------------------------- |
| Only admins can view audit logs     | SELECT    | is_super_admin() OR role = 'compliance_officer' |
| Authenticated users can create logs | INSERT    | is_authenticated()                              |

## Compliance Features

| Feature            | Value                                 |
| ------------------ | ------------------------------------- |
| **Immutability**   | Yes (no UPDATE/DELETE policies)       |
| **Retention**      | Unlimited (consider archiving policy) |
| **Encryption**     | Supabase encryption at rest           |
| **Access Control** | Admin and compliance officer only     |

## Foreign Keys

| Constraint             | References | On Delete |
| ---------------------- | ---------- | --------- |
| user_id → profiles(id) | profiles   | SET NULL  |

## Usage Example

```json
{
  "user_id": "uuid",
  "action": "created a new campaign",
  "action_type": "create",
  "resource_type": "campaigns",
  "resource_id": "campaign-uuid",
  "changes": {
    "new": { "name": "Summer 2024", "budget": 50000 },
    "old": null
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```
