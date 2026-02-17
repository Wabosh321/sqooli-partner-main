# User Performance Metrics Table - Phase 2

| Property        | Value                           |
| --------------- | ------------------------------- |
| **Table Name**  | public.user_performance_metrics |
| **Primary Key** | id (UUID)                       |
| **References**  | profiles                        |
| **RLS Enabled** | Yes                             |
| **Realtime**    | No                              |
| **Created**     | Phase 2                         |

## Columns

| Column Name           | Type                     | Constraints                                                                | Default | Nullable | Purpose                         |
| --------------------- | ------------------------ | -------------------------------------------------------------------------- | ------- | -------- | ------------------------------- |
| id                    | UUID                     | PK, DEFAULT gen_random_uuid()                                              | —       | NO       | Metric record identifier        |
| user_id               | UUID                     | FK→profiles, NOT NULL, UNIQUE                                              | —       | NO       | Team member user (one per user) |
| parent_user_id        | UUID                     | FK→profiles                                                                | NULL    | YES      | Parent/supervisor user          |
| total_campaigns       | INTEGER                  | DEFAULT 0                                                                  | —       | NO       | Total campaigns created         |
| active_campaigns      | INTEGER                  | DEFAULT 0                                                                  | —       | NO       | Currently active campaigns      |
| total_earnings        | NUMERIC                  | PRECISION 15,2, DEFAULT 0                                                  | —       | NO       | Cumulative earnings             |
| pending_withdrawals   | NUMERIC                  | PRECISION 15,2, DEFAULT 0                                                  | —       | NO       | Pending withdrawal amount       |
| completed_withdrawals | NUMERIC                  | PRECISION 15,2, DEFAULT 0                                                  | —       | NO       | Completed withdrawal amount     |
| engagements           | INTEGER                  | DEFAULT 0                                                                  | —       | NO       | Total user engagements          |
| tasks_completed       | INTEGER                  | DEFAULT 0                                                                  | —       | NO       | Completed approval tasks        |
| performance_score     | NUMERIC                  | PRECISION 5,2, CHECK (performance_score >= 0 AND performance_score <= 100) | 50      | NO       | Score 0-100 (default 50)        |
| created_at            | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP                                                  | —       | NO       | Creation timestamp              |
| updated_at            | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP                                                  | —       | NO       | Last update timestamp           |

## Indexes

| Index Name                                     | Columns           | Purpose               |
| ---------------------------------------------- | ----------------- | --------------------- |
| idx_user_performance_metrics_user_id           | user_id           | Unique lookup by user |
| idx_user_performance_metrics_parent_user_id    | parent_user_id    | Filter by parent      |
| idx_user_performance_metrics_performance_score | performance_score | Score-based ranking   |

## RLS Policies

| Policy Name                         | Operation | Conditions                                                                 |
| ----------------------------------- | --------- | -------------------------------------------------------------------------- |
| Users can view own and team metrics | SELECT    | user_id = self OR parent_user_id = self OR is_super_admin()                |
| Admin can update metrics            | UPDATE    | is_super_admin() OR is_partner_admin(get_partner_id_from_user(auth.uid())) |

## Foreign Keys

| Constraint                    | References | On Delete |
| ----------------------------- | ---------- | --------- |
| user_id → profiles(id)        | profiles   | CASCADE   |
| parent_user_id → profiles(id) | profiles   | SET NULL  |

## Triggers

| Trigger Name                        | Event  | Action                             |
| ----------------------------------- | ------ | ---------------------------------- |
| user_performance_metrics_updated_at | UPDATE | SET updated_at = CURRENT_TIMESTAMP |

## Performance Scoring

| Score Range | Category          | Qualification                              |
| ----------- | ----------------- | ------------------------------------------ |
| 90-100      | Excellent         | 10+ active campaigns, 90%+ task completion |
| 80-89       | Very Good         | 7+ active campaigns, 80%+ task completion  |
| 70-79       | Good              | 5+ active campaigns, 70%+ task completion  |
| 60-69       | Satisfactory      | 3+ active campaigns, 60%+ task completion  |
| 0-59        | Needs Improvement | Below satisfactory threshold               |

## Related Tables

| Table             | Relationship | Key                |
| ----------------- | ------------ | ------------------ |
| profiles          | One-to-One   | user_id → id       |
| user_activity_log | One-to-Many  | user_id            |
| campaigns         | One-to-Many  | created_by_user_id |
| tasks             | One-to-Many  | created_by_user_id |

## Update Scenarios

| Scenario             | Trigger                   | Fields Updated                            |
| -------------------- | ------------------------- | ----------------------------------------- |
| New campaign created | INSERT campaigns          | total_campaigns +1, active_campaigns +1   |
| Campaign completed   | UPDATE campaigns status   | active_campaigns -1                       |
| Task approved        | UPDATE tasks status       | tasks_completed +1                        |
| Withdrawal processed | UPDATE withdrawals status | total_earnings +X, pending_withdrawals -X |
| Engagement recorded  | INSERT user_activity_log  | engagements +1                            |
| Manual scoring       | ADMIN UPDATE              | performance_score                         |

## Dashboard Display

| Metric             | Display Format               | Data Point                                   |
| ------------------ | ---------------------------- | -------------------------------------------- |
| Total Earnings     | KES {total_earnings}         | user_performance_metrics.total_earnings      |
| Active Campaigns   | {active_campaigns} campaigns | user_performance_metrics.active_campaigns    |
| Tasks Completed    | {tasks_completed} tasks      | user_performance_metrics.tasks_completed     |
| Performance        | {performance_score}/100      | user_performance_metrics.performance_score   |
| Pending Withdrawal | KES {pending_withdrawals}    | user_performance_metrics.pending_withdrawals |
