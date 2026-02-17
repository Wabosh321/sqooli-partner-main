# Campaigns Table - Phase 2

| Property        | Value                        |
| --------------- | ---------------------------- |
| **Table Name**  | public.campaigns             |
| **Primary Key** | id (UUID)                    |
| **References**  | partners, programs, profiles |
| **RLS Enabled** | Yes                          |
| **Realtime**    | Yes (Phase 4)                |
| **Created**     | Phase 2                      |

## Columns

| Column Name          | Type          | Constraints                   | Default           | Nullable | Purpose                                   |
| -------------------- | ------------- | ----------------------------- | ----------------- | -------- | ----------------------------------------- |
| id                   | UUID          | PK, DEFAULT gen_random_uuid() | —                 | NO       | Campaign identifier                       |
| partner_id           | UUID          | FK→partners, NOT NULL         | —                 | NO       | Partner that owns campaign                |
| program_id           | UUID          | FK→programs                   | NULL              | YES      | Associated program                        |
| created_by_user_id   | UUID          | FK→profiles                   | NULL              | YES      | Creator user                              |
| created_by_user_role | TEXT          | —                             | NULL              | YES      | Creator's role at creation                |
| name                 | TEXT          | NOT NULL                      | —                 | NO       | Campaign name                             |
| promo_code           | TEXT          | UNIQUE                        | NULL              | YES      | Promotion code                            |
| status               | TEXT          | NOT NULL, DEFAULT 'draft'     | —                 | NO       | Status (draft, active, inactive, expired) |
| duration_start       | TIMESTAMP     | —                             | NULL              | YES      | Campaign start date                       |
| duration_end         | TIMESTAMP     | —                             | NULL              | YES      | Campaign end date                         |
| budget               | NUMERIC(12,2) | —                             | 0.00              | NO       | Campaign budget                           |
| spent                | NUMERIC(12,2) | —                             | 0.00              | NO       | Amount spent                              |
| revenue_projection   | NUMERIC(12,2) | —                             | 0.00              | NO       | Projected revenue                         |
| target_signups       | INTEGER       | —                             | 0                 | NO       | Target signup count                       |
| daily_target         | INTEGER       | —                             | 0                 | NO       | Daily target                              |
| whatsapp_number      | TEXT          | —                             | NULL              | YES      | WhatsApp contact                          |
| bundled_offers       | JSONB         | —                             | NULL              | YES      | Bundle offer details                      |
| discount_rule        | JSONB         | —                             | NULL              | YES      | Discount configuration                    |
| revenue_share        | JSONB         | —                             | NULL              | YES      | Revenue split configuration               |
| created_at           | TIMESTAMP     | —                             | CURRENT_TIMESTAMP | NO       | Creation timestamp                        |
| updated_at           | TIMESTAMP     | —                             | CURRENT_TIMESTAMP | NO       | Last update timestamp                     |

## Indexes

| Index Name                       | Columns            | Purpose           |
| -------------------------------- | ------------------ | ----------------- |
| idx_campaigns_partner_id         | partner_id         | Filter by partner |
| idx_campaigns_program_id         | program_id         | Filter by program |
| idx_campaigns_created_by_user_id | created_by_user_id | Filter by creator |
| idx_campaigns_status             | status             | Filter by status  |
| idx_campaigns_promo_code         | promo_code         | Lookup by code    |

## RLS Policies

| Policy Name                          | Operation | Conditions                                      |
| ------------------------------------ | --------- | ----------------------------------------------- |
| Users can view own partner campaigns | SELECT    | partner_id = user's partner OR is_super_admin() |
| Partner admins can create campaigns  | INSERT    | is_partner_admin(partner_id)                    |
| Partner admins can update campaigns  | UPDATE    | is_partner_admin(partner_id)                    |
| Partner admins can delete campaigns  | DELETE    | is_partner_admin(partner_id)                    |

## Triggers

| Trigger Name         | Event         | Function                      |
| -------------------- | ------------- | ----------------------------- |
| campaigns_updated_at | BEFORE UPDATE | handle_campaigns_updated_at() |

## Foreign Keys

| Constraint                        | References | On Delete |
| --------------------------------- | ---------- | --------- |
| partner_id → partners(id)         | partners   | CASCADE   |
| program_id → programs(id)         | programs   | SET NULL  |
| created_by_user_id → profiles(id) | profiles   | SET NULL  |
