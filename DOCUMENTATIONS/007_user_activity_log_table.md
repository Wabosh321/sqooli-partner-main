# User Activity Log Table - Phase 2

| Property        | Value                    |
| --------------- | ------------------------ |
| **Table Name**  | public.user_activity_log |
| **Primary Key** | id (UUID)                |
| **References**  | profiles                 |
| **RLS Enabled** | Yes                      |
| **Realtime**    | Yes (Phase 4)            |
| **Created**     | Phase 2                  |

## Columns

| Column Name    | Type      | Constraints                   | Default           | Nullable | Purpose                                            |
| -------------- | --------- | ----------------------------- | ----------------- | -------- | -------------------------------------------------- |
| id             | UUID      | PK, DEFAULT gen_random_uuid() | —                 | NO       | Log entry identifier                               |
| user_id        | UUID      | FK→profiles, NOT NULL         | —                 | NO       | Team member user                                   |
| parent_user_id | UUID      | FK→profiles                   | NULL              | YES      | Parent/supervisor user                             |
| action         | TEXT      | NOT NULL                      | —                 | NO       | Action description                                 |
| action_type    | TEXT      | NOT NULL                      | —                 | NO       | Action type (campaign_creation, report_view, etc.) |
| details        | TEXT      | —                             | NULL              | YES      | Additional details                                 |
| timestamp      | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Action timestamp                                   |
| created_at     | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Database creation timestamp                        |

## Indexes

| Index Name                           | Columns        | Purpose            |
| ------------------------------------ | -------------- | ------------------ |
| idx_user_activity_log_user_id        | user_id        | Filter by user     |
| idx_user_activity_log_parent_user_id | parent_user_id | Filter by parent   |
| idx_user_activity_log_action_type    | action_type    | Filter by action   |
| idx_user_activity_log_timestamp      | timestamp      | Time-based queries |

## RLS Policies

| Policy Name                          | Operation | Conditions                                                  |
| ------------------------------------ | --------- | ----------------------------------------------------------- |
| Users can view own and team activity | SELECT    | user_id = self OR parent_user_id = self OR is_super_admin() |
| System can insert activity logs      | INSERT    | true                                                        |

## Real-time Subscriptions

| Scenario                    | Filter               | Event  | Component                   |
| --------------------------- | -------------------- | ------ | --------------------------- |
| Parent views child activity | parent_user_id = uid | INSERT | UserSection, RecentActivity |

## Foreign Keys

| Constraint                    | References | On Delete |
| ----------------------------- | ---------- | --------- |
| user_id → profiles(id)        | profiles   | CASCADE   |
| parent_user_id → profiles(id) | profiles   | CASCADE   |

## Action Types

| Action Type        | Description          | Example                    |
| ------------------ | -------------------- | -------------------------- |
| campaign_creation  | Created campaign     | "Summer 2024 Campaign"     |
| campaign_update    | Updated campaign     | "Budget adjustment"        |
| report_generation  | Generated report     | "Q1 Performance"           |
| withdrawal_request | Submitted withdrawal | "KES 15,000"               |
| report_view        | Viewed analytics     | "Q1 Performance Analytics" |
| user_creation      | Created team member  | "John Doe"                 |
| settings_update    | Updated settings     | "Commission rate"          |
