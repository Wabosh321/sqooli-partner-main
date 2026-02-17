# Supabase Database Schema Report

Generated: 2026-01-02T17:56:53.470Z
Source: final_database_schema.sql

## Tables (13)

### users

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| auth_id | UUID | UNIQUE, NOT NULL |
| convex_id | TEXT | UNIQUE |
| email | TEXT | UNIQUE, NOT NULL |
| full_name | TEXT | - |
| phone | TEXT | - |
| username | TEXT | UNIQUE |
| role | TEXT | DEFAULT |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### partners

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| user_id | UUID | NOT NULL, FK |
| org_name | TEXT | NOT NULL |
| org_email | TEXT | - |
| org_phone | TEXT | - |
| description | TEXT | - |
| logo_url | TEXT | - |
| status | TEXT | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### campaigns

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| partner_id | UUID | NOT NULL, FK |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| status | TEXT | - |
| target_amount | NUMERIC | - |
| current_amount | NUMERIC | - |
| commission_rate | NUMERIC | - |
| start_date | DATE | - |
| end_date | DATE | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### transactions

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| campaign_id | UUID | FK |
| user_id | UUID | FK |
| partner_id | UUID | FK |
| amount | NUMERIC | NOT NULL |
| currency | TEXT | - |
| status | TEXT | - |
| transaction_type | TEXT | - |
| external_ref | TEXT | - |
| payment_method | TEXT | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### wallets

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| partner_id | UUID | NOT NULL, FK |
| balance | NUMERIC | - |
| total_earned | NUMERIC | - |
| bank_name | TEXT | - |
| account_number | TEXT | - |
| account_holder | TEXT | - |
| status | TEXT | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### withdrawals

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| partner_id | UUID | NOT NULL, FK |
| wallet_id | UUID | NOT NULL, FK |
| amount | NUMERIC | NOT NULL |
| status | TEXT | - |
| reason | TEXT | - |
| admin_notes | TEXT | - |
| mpesa_receipt | TEXT | - |
| requested_at | TIMESTAMP | DEFAULT |
| approved_at | TIMESTAMP | - |
| completed_at | TIMESTAMP | - |
| approved_by | TEXT | - |
| rejection_reason | TEXT | - |
| rejected_at | TIMESTAMP | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### curricula

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### subjects

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### programs

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| curriculum_id | UUID | FK |
| name | TEXT | NOT NULL |
| description | TEXT | - |
| status | TEXT | - |
| start_date | DATE | - |
| end_date | DATE | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### program_enrollments

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| program_id | UUID | NOT NULL, FK |
| campaign_id | UUID | FK |
| user_id | UUID | FK |
| status | TEXT | - |
| enrollment_date | DATE | DEFAULT |
| completion_date | DATE | - |
| metadata | JSONB | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### notifications

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| user_id | UUID | NOT NULL, FK |
| title | TEXT | NOT NULL |
| message | TEXT | NOT NULL |
| type | TEXT | - |
| is_read | BOOLEAN | DEFAULT |
| read_at | TIMESTAMP | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### permissions

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| name | TEXT | UNIQUE, NOT NULL |
| description | TEXT | - |
| created_at | TIMESTAMP | DEFAULT |
| updated_at | TIMESTAMP | DEFAULT |

### audit_logs

| Name | Type | Extras |
|---|---|---|
| id | UUID | PK, DEFAULT |
| convex_id | TEXT | UNIQUE |
| user_id | UUID | FK |
| action | TEXT | NOT NULL |
| table_name | TEXT | NOT NULL |
| record_id | TEXT | - |
| old_values | JSONB | - |
| new_values | JSONB | - |
| ip_address | TEXT | - |
| created_at | TIMESTAMP | DEFAULT |

## Functions (1)

### update_updated_at_column()

- **Returns:** TRIGGER

