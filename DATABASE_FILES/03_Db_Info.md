# SQOOLI PARTNER DATABASE - SCHEMA REFERENCE

**Generated:** February 15, 2026  
**Version:** 1.0  
**Database:** PostgreSQL 14+  
**Total Tables:** 22  
**Total Functions:** 13  
**Total Triggers:** 17

---

## Overview

This document provides a comprehensive reference for the Sqooli Partner Platform database schema. The database is designed to support:

- Partner/affiliate management with onboarding workflows
- Educational program delivery and enrollment
- Marketing campaign creation and tracking
- Financial transaction and wallet management
- Two-factor authentication and security
- Audit logging and compliance tracking

---

## Database Tables Reference

| #   | Table Name                   | Columns (Sample)                                                                                                                                                                                                                                                                                                                                     | RLS Enabled | Key Policies                                                                                  | Primary Functions                                                                                               | FKs                                                                             | PK  | Relationships                                                                                                                                                       |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **users**                    | id: UUID, auth_id: UUID, email: TEXT, full_name: TEXT, phone: TEXT, username: TEXT, role: TEXT, partner_id: UUID, created_at, updated_at                                                                                                                                                                                                             | ✓ YES       | users_self_select, users_self_update                                                          | create_user_profile(), is_authenticated()                                                                       | -                                                                               | id  | 1:N to partners (as owner), 1:N to audit_logs, 1:N to notifications, 1:N to program_enrollments                                                                     |
| 2   | **partners**                 | id: UUID, user_id: UUID, org_name: TEXT, org_email: TEXT, org_phone: TEXT, logo_url: TEXT, status: TEXT, partner_type: TEXT, commission_rate: NUMERIC, wallet_setup_completed: BOOLEAN, campaign_created: BOOLEAN, users_added: BOOLEAN, two_factor_setup_completed: BOOLEAN, onboarding_completed: BOOLEAN, metadata: JSONB, created_at, updated_at | ✓ YES       | partners_service_insert, partners_user_select, partners_user_update                           | create_campaign(), get_partner_onboarding_status(), update_partner_onboarding_step(), sync_partner_to_user_fn() | user_id → users(id)                                                             | id  | 1:N to campaigns, 1:N to channels, 1:N to transactions, 1:1 to wallets, 1:N to withdrawals, 1:N to two_factor_verifications, 1:N to user_invites, 1:N to audit_logs |
| 3   | **campaigns**                | id: UUID, partner_id: UUID, program_id: UUID, channel_id: UUID, name: TEXT, description: TEXT, status: TEXT, target_signups: INT, target_amount: NUMERIC, current_amount: NUMERIC, commission_rate: NUMERIC, start_date: DATE, end_date: DATE, duration_start: DATE, duration_end: DATE, metadata: JSONB, created_at, updated_at                     | ✓ YES       | campaigns_service_insert, campaigns_user_select, campaigns_user_update, campaigns_user_delete | create_campaign()                                                                                               | partner_id → partners(id), program_id → programs(id), channel_id → channels(id) | id  | N:1 to partners, N:1 to programs, N:1 to channels, 1:N to transactions, 1:N to program_enrollments                                                                  |
| 4   | **transactions**             | id: UUID, campaign_id: UUID, user_id: UUID, partner_id: UUID, amount: NUMERIC, currency: TEXT, status: TEXT, transaction_type: TEXT, external_ref: TEXT, payment_method: TEXT, metadata: JSONB, created_at, updated_at                                                                                                                               | ✓ YES       | transactions_service_insert, transactions_user_select                                         | rpc_log_audit_event()                                                                                           | campaign_id → campaigns(id), user_id → users(id), partner_id → partners(id)     | id  | N:1 to campaigns, N:1 to users, N:1 to partners                                                                                                                     |
| 5   | **wallets**                  | id: UUID, partner_id: UUID, user_id: UUID, balance: NUMERIC, total_earned: NUMERIC, bank_name: TEXT, account_number: TEXT, account_holder: TEXT, status: TEXT, withdrawal_method: TEXT, paybill_number: TEXT, beneficiaries: JSONB, metadata: JSONB, created_at, updated_at                                                                          | ✓ YES       | wallets_service_all, wallets_user_select                                                      | update_wallet_setup_completed()                                                                                 | partner_id → partners(id)                                                       | id  | 1:1 to partners, 1:N to withdrawals                                                                                                                                 |
| 6   | **withdrawals**              | id: UUID, partner_id: UUID, wallet_id: UUID, amount: NUMERIC, status: TEXT, reason: TEXT, admin_notes: TEXT, mpesa_receipt: TEXT, requested_at: TIMESTAMP, approved_at: TIMESTAMP, completed_at: TIMESTAMP, approved_by: TEXT, rejection_reason: TEXT, rejected_at: TIMESTAMP, metadata: JSONB, created_at, updated_at                               | ✓ YES       | withdrawals_service_all, withdrawals_user_select                                              | -                                                                                                               | partner_id → partners(id), wallet_id → wallets(id)                              | id  | N:1 to partners, N:1 to wallets                                                                                                                                     |
| 7   | **programs**                 | id: UUID, curriculum_id: UUID, name: TEXT, description: TEXT, status: TEXT, pricing: NUMERIC, start_date: DATE, end_date: DATE, metadata: JSONB, created_at, updated_at                                                                                                                                                                              | ✓ YES       | programs_public_select, programs_service_all                                                  | -                                                                                                               | curriculum_id → curricula(id)                                                   | id  | N:1 to curricula, 1:N to campaigns, 1:N to program_enrollments                                                                                                      |
| 8   | **program_enrollments**      | id: UUID, program_id: UUID, campaign_id: UUID, user_id: UUID, status: TEXT, enrollment_date: DATE, completion_date: DATE, metadata: JSONB, created_at, updated_at                                                                                                                                                                                    | ✓ YES       | program_enrollments_service_all, enrollments_user_select                                      | -                                                                                                               | program_id → programs(id), campaign_id → campaigns(id), user_id → users(id)     | id  | N:1 to programs, N:1 to campaigns, N:1 to users                                                                                                                     |
| 9   | **curricula**                | id: UUID, name: TEXT, description: TEXT, created_at, updated_at                                                                                                                                                                                                                                                                                      | ✓ YES       | curricula_public_select, curricula_service_all                                                | -                                                                                                               | -                                                                               | id  | 1:N to programs                                                                                                                                                     |
| 10  | **subjects**                 | id: UUID, name: TEXT, description: TEXT, created_at, updated_at                                                                                                                                                                                                                                                                                      | ✓ YES       | subjects_public_select, subjects_service_all                                                  | -                                                                                                               | -                                                                               | id  | Standalone (curriculum support)                                                                                                                                     |
| 11  | **channels**                 | id: UUID, partner_id: UUID, name: TEXT, subchannels: JSONB, metadata: JSONB, created_at, updated_at                                                                                                                                                                                                                                                  | ✓ YES       | channels_prevent_direct_insert, channels_user_select                                          | -                                                                                                               | partner_id → partners(id)                                                       | id  | N:1 to partners, 1:N to campaigns                                                                                                                                   |
| 12  | **audit_logs**               | id: UUID, user_id: UUID, action: TEXT, table_name: TEXT, record_id: TEXT, old_values: JSONB, new_values: JSONB, ip_address: TEXT, created_at                                                                                                                                                                                                         | ✓ YES       | audit_logs_service_insert, audit_logs_user_select                                             | rpc_log_audit_event()                                                                                           | user_id → users(id)                                                             | id  | N:1 to users (audit trail)                                                                                                                                          |
| 13  | **notifications**            | id: UUID, user_id: UUID, title: TEXT, message: TEXT, type: TEXT, is_read: BOOLEAN, read_at: TIMESTAMP, created_at, updated_at                                                                                                                                                                                                                        | ✓ YES       | notifications_service_insert, notifications_user_select, notifications_user_update            | -                                                                                                               | user_id → users(id)                                                             | id  | N:1 to users                                                                                                                                                        |
| 14  | **permissions**              | id: UUID, name: TEXT, description: TEXT, created_at, updated_at                                                                                                                                                                                                                                                                                      | ✓ YES       | permissions_public_select                                                                     | -                                                                                                               | -                                                                               | id  | 1:N to partner_type_permissions                                                                                                                                     |
| 15  | **partner_types**            | id: UUID, name: TEXT, slug: TEXT, description: TEXT, access_level: INT, default_commission_rate: NUMERIC, created_at, updated_at                                                                                                                                                                                                                     | ✗ NO        | (RLS disabled)                                                                                | -                                                                                                               | -                                                                               | id  | 1:N to partner_type_permissions, 1:N to partner_type_roles                                                                                                          |
| 16  | **partner_type_permissions** | id: UUID, partner_type_slug: TEXT, permission_key: TEXT, description: TEXT, created_at, UNIQUE(partner_type_slug, permission_key)                                                                                                                                                                                                                    | ✗ NO        | (RLS disabled)                                                                                | -                                                                                                               | partner_type_slug → partner_types(slug)                                         | id  | N:1 to partner_types                                                                                                                                                |
| 17  | **partner_type_roles**       | id: UUID, partner_type_slug: TEXT, role_name: TEXT, description: TEXT, created_at, UNIQUE(partner_type_slug, role_name)                                                                                                                                                                                                                              | ✗ NO        | (RLS disabled)                                                                                | -                                                                                                               | partner_type_slug → partner_types(slug)                                         | id  | N:1 to partner_types                                                                                                                                                |
| 18  | **two_factor_verifications** | id: UUID, partner_id: UUID, verification_type: TEXT, contact_value: TEXT, otp_code: TEXT, attempts: INT, is_verified: BOOLEAN, created_at, verified_at, expires_at (10min), metadata: JSONB                                                                                                                                                          | ✗ NO        | (RLS disabled - CRITICAL)                                                                     | cleanup_expired_2fa_codes()                                                                                     | partner_id → partners(id)                                                       | id  | N:1 to partners (one-time OTPs)                                                                                                                                     |
| 19  | **user_invites**             | id: UUID, partner_id: UUID, email: TEXT, role: TEXT, status: TEXT, invited_by: UUID, invitation_token: TEXT, created_at, accepted_at, expires_at (7days), metadata: JSONB                                                                                                                                                                            | ✗ NO        | (RLS disabled - HIGH)                                                                         | -                                                                                                               | partner_id → partners(id), invited_by → users(id)                               | id  | N:1 to partners, N:1 to users                                                                                                                                       |
| 20  | **social_media_platforms**   | id: UUID, name: TEXT, display_name: TEXT, icon_name: TEXT, url_pattern: TEXT, is_active: BOOLEAN, sort_order: INT, created_at                                                                                                                                                                                                                        | ✗ NO        | (RLS disabled)                                                                                | -                                                                                                               | -                                                                               | id  | Configuration/reference data                                                                                                                                        |
| 21  | **admin_audit**              | (Similar to audit_logs for admin actions)                                                                                                                                                                                                                                                                                                            | ✗ NO        | -                                                                                             | -                                                                                                               | -                                                                               | id  | Administrative action tracking                                                                                                                                      |
| 22  | **logs**                     | (System logging for debugging)                                                                                                                                                                                                                                                                                                                       | ✗ NO        | -                                                                                             | -                                                                                                               | -                                                                               | id  | Non-critical system logs                                                                                                                                            |

---

## Key Relationships & Dependencies

### Dependency Hierarchy

```
FOUNDATION LAYER (No dependencies):
├── users
├── partner_types
├── permissions
├── curricula
├── subjects
└── social_media_platforms

DERIVED LAYER (Depend on foundation):
├── partner_type_permissions → partner_types
├── partner_type_roles → partner_types
├── partners → users (owner)
├── channels → partners
└── programs → curricula

BUSINESS LOGIC LAYER (Complex relationships):
├── campaigns → partners + programs + channels
├── program_enrollments → programs + campaigns + users
├── transactions → campaigns + users + partners
├── wallets → partners (1:1)
└── withdrawals → partners + wallets

SUPPORT LAYER:
├── two_factor_verifications → partners
├── user_invites → partners + users
├── audit_logs → users
├── notifications → users
└── social_media (if exists) → partners + users
```

### Foreign Key Matrix

| From Table               | To Table      | Column → Column          | Type | Delete Behavior  |
| ------------------------ | ------------- | ------------------------ | ---- | ---------------- |
| users                    | partners      | partner_id               | FK   | -                |
| partners                 | users         | user_id → id             | FK   | CASCADE          |
| campaigns                | partners      | partner_id → id          | FK   | CASCADE          |
| campaigns                | programs      | program_id → id          | FK   | SET NULL         |
| campaigns                | channels      | channel_id → id          | FK   | SET NULL         |
| channels                 | partners      | partner_id → id          | FK   | CASCADE          |
| programs                 | curricula     | curriculum_id → id       | FK   | SET NULL         |
| program_enrollments      | programs      | program_id → id          | FK   | CASCADE          |
| program_enrollments      | campaigns     | campaign_id → id         | FK   | SET NULL         |
| program_enrollments      | users         | user_id → id             | FK   | SET NULL         |
| transactions             | campaigns     | campaign_id → id         | FK   | SET NULL         |
| transactions             | users         | user_id → id             | FK   | SET NULL         |
| transactions             | partners      | partner_id → id          | FK   | SET NULL         |
| wallets                  | partners      | partner_id → id          | FK   | CASCADE (UNIQUE) |
| withdrawals              | partners      | partner_id → id          | FK   | CASCADE          |
| withdrawals              | wallets       | wallet_id → id           | FK   | CASCADE          |
| audit_logs               | users         | user_id → id             | FK   | SET NULL         |
| notifications            | users         | user_id → id             | FK   | CASCADE          |
| two_factor_verifications | partners      | partner_id → id          | FK   | CASCADE          |
| user_invites             | partners      | partner_id → id          | FK   | CASCADE          |
| user_invites             | users         | invited_by → id          | FK   | SET NULL         |
| partner_type_permissions | partner_types | partner_type_slug → slug | FK   | CASCADE          |
| partner_type_roles       | partner_types | partner_type_slug → slug | FK   | CASCADE          |

---

## Access Control (RLS Policies)

### RLS Enabled Tables (14)

- **users**: users_self_select, users_self_update
- **partners**: partners_service_insert, partners_user_select, partners_user_update
- **campaigns**: campaigns_service_insert, campaigns_user_select, campaigns_user_update, campaigns_user_delete
- **channels**: channels_prevent_direct_insert, channels_user_select
- **programs**: programs_public_select, programs_service_all
- **curricula**: curricula_public_select, curricula_service_all
- **subjects**: subjects_public_select, subjects_service_all
- **program_enrollments**: program_enrollments_service_all, enrollments_user_select
- **transactions**: transactions_service_insert, transactions_user_select
- **wallets**: wallets_service_all, wallets_user_select
- **withdrawals**: withdrawals_service_all, withdrawals_user_select
- **audit_logs**: audit_logs_service_insert, audit_logs_user_select
- **notifications**: notifications_service_insert, notifications_user_select, notifications_user_update
- **permissions**: permissions_public_select

### RLS Disabled Tables (8) - ⚠️ Review Required

- **partner_types**: Configuration data - consider public read
- **partner_type_permissions**: Should restrict to service role only
- **partner_type_roles**: Should restrict to service role only
- **social_media_platforms**: Configuration data - consider public read
- **two_factor_verifications**: ⚠️ CRITICAL - Contains OTP codes - must enable RLS
- **user_invites**: ⚠️ HIGH - Contains invitation tokens - must enable RLS
- **admin_audit**: Audit table - should restrict to admins
- **logs**: System logs - should restrict to service role

---

## Key Indexes

### Unique Indexes (data integrity)

- `users(auth_id)` - 1:1 with auth.users
- `users(email)` - Unique per system
- `users(username)` - Unique per system
- `users(convex_id)` - Legacy Convex synchronization
- `partner_types(name)`, `partner_types(slug)` - Unique identifiers
- `permissions(name)` - Unique permission names
- `campaigns(convex_id)`, `programs(convex_id)`, etc. - Legacy keys
- `wallets(partner_id)` - 1:1 relationship enforcement
- `user_invites(invitation_token)` - Unique acceptance token
- `partner_types(slug)` in junction tables - Composite uniqueness

### Performance Indexes (query optimization)

- `partners(user_id)`, `partners(status)`, `partners(wallet_setup_completed)`, `partners(onboarding_completed)`
- `campaigns(partner_id)`, `campaigns(program_id)`, `campaigns(channel_id)`, `campaigns(status)`, `campaigns(start_date, end_date)`
- `transactions(campaign_id)`, `transactions(user_id)`, `transactions(partner_id)`, `transactions(status)`, `transactions(created_at)`
- `channels(partner_id)`
- `program_enrollments(program_id)`, `program_enrollments(user_id)`, `program_enrollments(status)`
- `notifications(user_id)`, `notifications(is_read)`, `notifications(created_at)`
- `audit_logs(user_id)`, `audit_logs(table_name)`, `audit_logs(action)`, `audit_logs(created_at)`
- `withdrawals(partner_id)`, `withdrawals(wallet_id)`, `withdrawals(status)`, `withdrawals(requested_at)`
- `two_factor_verifications(partner_id)`, `two_factor_verifications(verification_type)`, `two_factor_verifications(expires_at)`
- `user_invites(partner_id)`, `user_invites(email)`, `user_invites(status)`, `user_invites(expires_at)`

---

## Trigger Automation

### Timestamp Auto-Update Triggers

Applied to 13 tables to automatically update `updated_at` on modifications:

- users, partners, campaigns, transactions, wallets, withdrawals, programs, program_enrollments, notifications, permissions, curricula, subjects, channels

### Sync Triggers

| Trigger                          | Table      | Event         | Function                        | Purpose                                  |
| -------------------------------- | ---------- | ------------- | ------------------------------- | ---------------------------------------- |
| `handle_new_user_trigger`        | auth.users | AFTER INSERT  | handle_new_auth_user()          | Create matching user row in public.users |
| `handle_user_delete_trigger`     | auth.users | BEFORE DELETE | handle_auth_user_delete()       | Delete corresponding user row            |
| `sync_partner_insert_trigger`    | partners   | AFTER INSERT  | sync_partner_to_user_fn()       | Update user role & partner_id            |
| `wallet_setup_completed_trigger` | wallets    | AFTER INSERT  | update_wallet_setup_completed() | Mark onboarding step as complete         |

---

## Functions Reference

### Helper Functions

| Function                       | Returns | Purpose                          |
| ------------------------------ | ------- | -------------------------------- |
| `is_authenticated()`           | BOOLEAN | Check if user is logged in       |
| `get_user_partner_id(user_id)` | UUID    | Get partner associated with user |
| `is_super_admin(user_id)`      | BOOLEAN | Check admin privileges           |
| `is_partner_admin(partner_id)` | BOOLEAN | Check partner admin privileges   |
| `update_updated_at_column()`   | TRIGGER | Auto-update timestamp            |

### Business Logic Functions

| Function                                                                                                                                    | Parameters             | Returns          | Key Logic                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------- | ------------------------------------------------------ |
| `create_user_profile(auth_id, email, full_name, phone)`                                                                                     | 4 required             | user record      | Creates user after email verification                  |
| `check_partner_onboarding_complete(partner_id)`                                                                                             | 1 required             | BOOLEAN          | Validates all required steps done                      |
| `create_campaign(partner_id, name, description, target_signups, duration_start, duration_end, program_id, channel_id, subchannel, user_id)` | 6 required, 4 optional | campaigns record | Validates inputs, creates campaign, marks partner step |
| `get_partner_onboarding_status(partner_id)`                                                                                                 | 1 required             | rows (5 steps)   | Returns step completion status                         |
| `update_partner_onboarding_step(partner_id, step_name, completed)`                                                                          | 3 required             | VOID             | Updates step, checks overall completion                |
| `cleanup_expired_2fa_codes()`                                                                                                               | none                   | INT (count)      | Deletes expired unverified OTPs (schedule: hourly)     |
| `rpc_log_audit_event(action, action_type, resource_type, resource_id, changes)`                                                             | 2 required, 3 optional | UUID (audit_id)  | Non-blocking audit logging                             |

### Trigger Functions

| Function                          | Attached To | Event         | Action                                    |
| --------------------------------- | ----------- | ------------- | ----------------------------------------- |
| `handle_new_auth_user()`          | auth.users  | AFTER INSERT  | Insert matching public.users row          |
| `handle_auth_user_delete()`       | auth.users  | BEFORE DELETE | Delete matching public.users row          |
| `sync_partner_to_user_fn()`       | partners    | AFTER INSERT  | Update user role and partner_id           |
| `update_wallet_setup_completed()` | wallets     | AFTER INSERT  | Set partner.wallet_setup_completed = TRUE |

---

## Data Integrity Constraints

### Primary Keys

All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` for:

- Universally unique identifiers
- No sequence conflicts in distributed systems
- Security (not predictable)

### Unique Constraints

- **users**: auth_id (1:1 with Supabase auth), email, username, convex_id
- **partner_types**: name, slug
- **permissions**: name, convex_id
- **wallets**: convex_id, partner_id (1:1 relationship)
- **user_invites**: invitation_token
- **social_media_platforms**: name

### Foreign Key Constraints

All FK relationships include:

- Proper cascading (CASCADE on parent delete where appropriate, SET NULL for optional)
- Indexing for performance
- Validation in business logic functions

### Check Constraints

Implicit via function validation:

- target_signups must be > 0
- start_date ≤ end_date
- commission_rate valid ranges (0-100)
- OTP attempts tracking

---

## Data Types Reference

### UUID Fields

Used for all primary keys and many foreign keys (generation, security, distributed readiness)

### TEXT Fields

Used for:

- user emails, names, org names
- Action descriptions, table names, resource identifiers
- Flexible string data (no length constraints)

### NUMERIC Fields

Used for:

- amount, balance, commission_rate (precision trading)
- Supports arbitrary precision decimal arithmetic

### JSONB Fields

Used for:

- metadata (flexible schema extensions)
- nested configurations
- Array of objects (subchannels, social_media_links)
- indexed for querying

### TIMESTAMP WITH TIME ZONE

Used for:

- All audit/event timestamps
- Cross-timezone awareness
- Consistent UTC storage

### DATE Fields

Used for:

- enrollment_date, start_date, end_date
- No time component in business logic

### BOOLEAN Fields

Used for:

- Flags (wallet_setup_completed, is_verified, is_read)
- Default FALSE for safety

---

## Onboarding Workflow

The database tracks partner onboarding progress via `partners` table:

```
Step 1: wallet_setup_completed
  ↓
Step 2: campaign_created
  ↓
Step 3: two_factor_setup_completed
  ↓
Step 4: users_added (optional)
  ↓
Step 5: social_media_added (optional)
  ↓
onboarding_completed = TRUE (when 1-3 done)
```

Functions: `get_partner_onboarding_status()`, `update_partner_onboarding_step()`

---

## Recommended Database Maintenance

### Regular Tasks

1. **Cleanup Expired 2FA Codes** (daily)
   - Function: `cleanup_expired_2fa_codes()`
   - Schedule: `SELECT cron.schedule('cleanup_2fa', '0 * * * *', 'SELECT cleanup_expired_2fa_codes()');`

2. **Analyze Query Performance** (weekly)
   - Monitor slow queries in audit_logs
   - Review transaction patterns

3. **Backup & Disaster Recovery** (daily)
   - Enable Supabase automated backups
   - Test recovery procedures

### Missing RLS Policies (⚠️ CRITICAL)

Enable and complete RLS for:

- `two_factor_verifications` - Must restrict to service role + partner owner
- `user_invites` - Must restrict to service role + partner admin
- Remaining disabled tables - Review security model

---

## Deployment Checklist

- [ ] All FK constraints are indexed
- [ ] RLS policies enabled on sensitive tables
- [ ] Audit logging triggered on sensiti changes
- [ ] Two-factor verification RLS enforced
- [ ] User invites token uniqueness tested
- [ ] Wallet 1:1 partner relationship verified
- [ ] Onboarding workflow tested end-to-end
- [ ] Timestamp triggers working on all tables
- [ ] Auth sync triggers validated
- [ ] Commission rate calculations tested
- [ ] Withdrawal approval workflow tested

---

## Performance Notes

- Total indexes: ~70+ across all tables
- Index size: ~50-100MB estimated (JSONB can be large)
- Query plans: Use EXPLAIN ANALYZE on campaigns, transactions, audit_logs
- Partition consideration: Consider partitioning audit_logs by date for multi-year data

---

## Document Metadata

| Property         | Value                     |
| ---------------- | ------------------------- |
| Generated        | 2026-02-15                |
| Version          | 1.0                       |
| Database Version | PostgreSQL 14+            |
| Supabase Version | Latest (as of generation) |
| Status           | Production-Ready          |
| Review Frequency | Quarterly                 |
| Last Updated     | 2026-02-15                |

---

**Created by:** Database Documentation System  
**Purpose:** Comprehensive schema reference for development, deployment, and operational use  
**Distribution:** Internal (Development, Deployment, Operations teams)
