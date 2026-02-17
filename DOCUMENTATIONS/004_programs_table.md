# Programs Table - Phase 2

| Property        | Value              |
| --------------- | ------------------ |
| **Table Name**  | public.programs    |
| **Primary Key** | id (UUID)          |
| **References**  | partners, profiles |
| **RLS Enabled** | Yes                |
| **Realtime**    | Yes (Phase 4)      |
| **Created**     | Phase 2            |

## Columns

| Column Name        | Type      | Constraints                   | Default           | Nullable | Purpose                             |
| ------------------ | --------- | ----------------------------- | ----------------- | -------- | ----------------------------------- |
| id                 | UUID      | PK, DEFAULT gen_random_uuid() | —                 | NO       | Program identifier                  |
| partner_id         | UUID      | FK→partners, NOT NULL         | —                 | NO       | Partner that owns program           |
| created_by_user_id | UUID      | FK→profiles                   | NULL              | YES      | Creator user                        |
| name               | TEXT      | NOT NULL                      | —                 | NO       | Program name                        |
| description        | TEXT      | —                             | NULL              | YES      | Program description                 |
| status             | TEXT      | NOT NULL, DEFAULT 'active'    | —                 | NO       | Status (active, inactive, archived) |
| created_at         | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Creation timestamp                  |
| end_date           | TIMESTAMP | —                             | NULL              | YES      | Program end date                    |
| updated_at         | TIMESTAMP | —                             | CURRENT_TIMESTAMP | NO       | Last update timestamp               |

## Indexes

| Index Name                      | Columns            | Purpose           |
| ------------------------------- | ------------------ | ----------------- |
| idx_programs_partner_id         | partner_id         | Filter by partner |
| idx_programs_created_by_user_id | created_by_user_id | Filter by creator |
| idx_programs_status             | status             | Filter by status  |

## RLS Policies

| Policy Name                         | Operation | Conditions                                      |
| ----------------------------------- | --------- | ----------------------------------------------- |
| Users can view own partner programs | SELECT    | partner_id = user's partner OR is_super_admin() |
| Partner admins can create programs  | INSERT    | is_partner_admin(partner_id)                    |
| Partner admins can update programs  | UPDATE    | is_partner_admin(partner_id)                    |
| Partner admins can delete programs  | DELETE    | is_partner_admin(partner_id)                    |

## Triggers

| Trigger Name        | Event         | Function                     |
| ------------------- | ------------- | ---------------------------- |
| programs_updated_at | BEFORE UPDATE | handle_programs_updated_at() |

## Foreign Keys

| Constraint                        | References | On Delete |
| --------------------------------- | ---------- | --------- |
| partner_id → partners(id)         | partners   | CASCADE   |
| created_by_user_id → profiles(id) | profiles   | SET NULL  |

## Related Tables

| Table               | Relationship    | Type        |
| ------------------- | --------------- | ----------- |
| campaigns           | program_id → id | One-to-Many |
| program_enrollments | program_id → id | One-to-Many |
