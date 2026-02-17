# Partners Table - Phase 1

| Property        | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| **Table Name**  | public.partners                                                                 |
| **Primary Key** | id (UUID)                                                                       |
| **References**  | Referenced by profiles, campaigns, programs, wallets, transactions, withdrawals |
| **RLS Enabled** | Yes                                                                             |
| **Realtime**    | No                                                                              |
| **Created**     | Phase 1                                                                         |

## Columns

| Column Name          | Type         | Constraints                   | Default           | Nullable | Purpose                                           |
| -------------------- | ------------ | ----------------------------- | ----------------- | -------- | ------------------------------------------------- |
| id                   | UUID         | PK, DEFAULT gen_random_uuid() | —                 | NO       | Partner identifier                                |
| org_name             | TEXT         | NOT NULL                      | —                 | NO       | Organization name                                 |
| partner_type         | TEXT         | NOT NULL                      | —                 | NO       | Type (affiliate, media, corporate, institutional) |
| access_level         | INTEGER      | CHECK 0-100                   | 0                 | NO       | Access level percentage                           |
| commission_rate      | NUMERIC(5,2) | —                             | 0.00              | NO       | Default commission rate                           |
| onboarding_completed | BOOLEAN      | —                             | false             | NO       | Onboarding completion flag                        |
| created_at           | TIMESTAMP    | —                             | CURRENT_TIMESTAMP | NO       | Creation timestamp                                |
| updated_at           | TIMESTAMP    | —                             | CURRENT_TIMESTAMP | NO       | Last update timestamp                             |

## Indexes

| Index Name                | Columns      | Purpose                |
| ------------------------- | ------------ | ---------------------- |
| idx_partners_partner_type | partner_type | Filter by type         |
| idx_partners_org_name     | org_name     | Search by organization |

## RLS Policies

| Policy Name                           | Operation | Conditions                                 |
| ------------------------------------- | --------- | ------------------------------------------ |
| Users can view own partner            | SELECT    | id = user's partner_id OR is_super_admin() |
| Only super admins can create partners | INSERT    | is_super_admin()                           |
| Partner admins can update own partner | UPDATE    | is_super_admin() OR is partner admin       |

## Triggers

| Trigger Name        | Event         | Function                     |
| ------------------- | ------------- | ---------------------------- |
| partners_updated_at | BEFORE UPDATE | handle_partners_updated_at() |

## Related Tables

| Table        | Relationship    | Type        |
| ------------ | --------------- | ----------- |
| profiles     | partner_id → id | One-to-Many |
| campaigns    | partner_id → id | One-to-Many |
| programs     | partner_id → id | One-to-Many |
| wallets      | partner_id → id | One-to-One  |
| transactions | partner_id → id | One-to-Many |
| withdrawals  | partner_id → id | One-to-Many |
