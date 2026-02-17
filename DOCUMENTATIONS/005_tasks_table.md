# Tasks Table - Phase 2

| Property        | Value               |
| --------------- | ------------------- |
| **Table Name**  | public.tasks        |
| **Primary Key** | id (UUID)           |
| **References**  | campaigns, profiles |
| **RLS Enabled** | Yes                 |
| **Realtime**    | Yes (Phase 4)       |
| **Created**     | Phase 2             |

## Columns

| Column Name        | Type      | Constraints                   | Default           | Nullable | Purpose                                         |
| ------------------ | --------- | ----------------------------- | ----------------- | -------- | ----------------------------------------------- |
| id                 | UUID      | PK, DEFAULT gen_random_uuid() | —                 | NO       | Task identifier                                 |
| campaign_id        | UUID      | FK→campaigns, NOT NULL        | —                 | NO       | Associated campaign                             |
| created_by_user_id | UUID      | FK→profiles                   | NULL              | YES      | Task creator                                    |
| approver_id        | UUID      | FK→profiles                   | NULL              | YES      | Task approver                                   |
| task_name          | TEXT      | NOT NULL                      | —                 | NO       | Task name                                       |
| status             | TEXT      | NOT NULL, DEFAULT 'pending'   | —                 | NO       | Status (pending, approved, rejected, completed) |
| reference_no       | TEXT      | UNIQUE                        | NULL              | YES      | Reference number                                |
| description        | TEXT      | —                             | NULL              | YES      | Task description                                |
| channel            | TEXT      | —                             | NULL              | YES      | Channel (e.g., Marketing)                       |
| sub_channel        | TEXT      | —                             | NULL              | YES      | Sub-channel (e.g., Digital)                     |
| date_created       | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Creation date                                   |
| completed_at       | TIMESTAMP | —                             | NULL              | YES      | Completion timestamp                            |
| created_at         | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Database creation timestamp                     |
| updated_at         | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Last update timestamp                           |

## Indexes

| Index Name                   | Columns            | Purpose             |
| ---------------------------- | ------------------ | ------------------- |
| idx_tasks_campaign_id        | campaign_id        | Filter by campaign  |
| idx_tasks_created_by_user_id | created_by_user_id | Filter by creator   |
| idx_tasks_approver_id        | approver_id        | Filter by approver  |
| idx_tasks_status             | status             | Filter by status    |
| idx_tasks_reference_no       | reference_no       | Lookup by reference |

## RLS Policies

| Policy Name                          | Operation | Conditions                                            |
| ------------------------------------ | --------- | ----------------------------------------------------- |
| Stakeholders can view tasks          | SELECT    | created_by_user_id OR approver_id OR is_super_admin() |
| Partner admins can create tasks      | INSERT    | is_partner_admin(campaign's partner)                  |
| Creator or approver can update tasks | UPDATE    | creator OR approver OR is_super_admin()               |

## Triggers

| Trigger Name     | Event         | Function                  |
| ---------------- | ------------- | ------------------------- |
| tasks_updated_at | BEFORE UPDATE | handle_tasks_updated_at() |

## Foreign Keys

| Constraint                        | References | On Delete |
| --------------------------------- | ---------- | --------- |
| campaign_id → campaigns(id)       | campaigns  | CASCADE   |
| created_by_user_id → profiles(id) | profiles   | SET NULL  |
| approver_id → profiles(id)        | profiles   | SET NULL  |

## Workflow

| Status   | Transition  | Trigger            |
| -------- | ----------- | ------------------ |
| pending  | → approved  | rpc_approve_task() |
| pending  | → rejected  | rpc_reject_task()  |
| approved | → completed | Manual update      |
