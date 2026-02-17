# Profiles Table - Phase 1

| Property        | Value                               |
| --------------- | ----------------------------------- |
| **Table Name**  | public.profiles                     |
| **Primary Key** | id (UUID)                           |
| **References**  | auth.users(id), public.partners(id) |
| **RLS Enabled** | Yes                                 |
| **Realtime**    | No                                  |
| **Created**     | Phase 1                             |

## Columns

| Column Name    | Type      | Constraints       | Default           | Nullable | Purpose                                                   |
| -------------- | --------- | ----------------- | ----------------- | -------- | --------------------------------------------------------- |
| id             | UUID      | PK, FK→auth.users | —                 | NO       | User identifier from auth.users                           |
| email          | TEXT      | UNIQUE, NOT NULL  | —                 | NO       | User email address                                        |
| full_name      | TEXT      | —                 | NULL              | YES      | Full name of user                                         |
| partner_id     | UUID      | FK→partners       | NULL              | YES      | Associated partner                                        |
| role           | TEXT      | NOT NULL          | 'team_member'     | NO       | User role (super_admin, admin_partner, team_member, etc.) |
| partner_type   | TEXT      | —                 | NULL              | YES      | Partner type (affiliate, media, corporate, institutional) |
| access_level   | INTEGER   | CHECK 0-100       | 0                 | NO       | Access level percentage                                   |
| permissions    | JSONB     | —                 | '[]'              | NO       | JSON array of permission objects                          |
| parent_user_id | UUID      | FK→profiles       | NULL              | YES      | Parent user ID for hierarchy                              |
| is_first_login | BOOLEAN   | —                 | true              | NO       | First login flag                                          |
| is_active      | BOOLEAN   | —                 | true              | NO       | User active status                                        |
| created_at     | TIMESTAMP | —                 | CURRENT_TIMESTAMP | NO       | Creation timestamp                                        |
| updated_at     | TIMESTAMP | —                 | CURRENT_TIMESTAMP | NO       | Last update timestamp                                     |

## Indexes

| Index Name                  | Columns        | Purpose           |
| --------------------------- | -------------- | ----------------- |
| idx_profiles_partner_id     | partner_id     | Filter by partner |
| idx_profiles_parent_user_id | parent_user_id | Hierarchy queries |
| idx_profiles_role           | role           | Filter by role    |
| idx_profiles_email          | email          | Email lookups     |

## RLS Policies

| Policy Name                         | Operation | Conditions                           |
| ----------------------------------- | --------- | ------------------------------------ |
| Users can view own profile          | SELECT    | auth.uid() = id OR is_super_admin()  |
| Admins can view partner members     | SELECT    | User in same partner with admin role |
| Users can update own limited fields | UPDATE    | auth.uid() = id                      |
| Only admins can create profiles     | INSERT    | is_super_admin()                     |

## Triggers

| Trigger Name        | Event         | Function                     |
| ------------------- | ------------- | ---------------------------- |
| profiles_updated_at | BEFORE UPDATE | handle_profiles_updated_at() |

## Foreign Keys

| Constraint                    | References | On Delete |
| ----------------------------- | ---------- | --------- |
| id → auth.users(id)           | auth.users | CASCADE   |
| partner_id → partners(id)     | partners   | SET NULL  |
| parent_user_id → profiles(id) | profiles   | SET NULL  |
