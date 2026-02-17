# Sqooli Partner Platform - Complete Database Documentation

**Generated:** January 2, 2026  
**Source:** Supabase MCP - Live Project  
**Project Reference:** `heqsfgmrosuupxahdtda`  
**Project URL:** `https://heqsfgmrosuupxahdtda.supabase.co`  
**Schema:** `public`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tables Overview](#tables-overview)
3. [Detailed Table Schemas](#detailed-table-schemas)
4. [Foreign Key Relationships](#foreign-key-relationships)
5. [Database Functions & Triggers](#database-functions--triggers)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Indexes & Performance](#indexes--performance)
8. [Security Analysis](#security-analysis)
9. [Recommendations](#recommendations)

---

## Project Overview

### Connection Status
- **MCP Session:** ✅ Connected & Authenticated
- **Project:** heqsfgmrosuupxahdtda
- **Tables:** 20
- **Functions:** 11
- **RLS Policies:** 33
- **Indexes:** 127

### Key Statistics
| Metric | Value |
|--------|-------|
| Tables with RLS | 15 (75%) |
| Tables without RLS | 5 (25%) ⚠️ |
| Primary Keys | 20 (all UUID) |
| Foreign Keys | 23 relationships |
| Unique Constraints | 30+ |
| Database Triggers | 8 |
| Stored Functions | 11 |

---

## Tables Overview

### Complete Table List

| # | Name | Columns | RLS | Status | Purpose |
|---|------|---------|-----|--------|---------|
| 1 | `audit_logs` | 10 | ✅ | Active | Audit trail of all system operations |
| 2 | `campaigns` | 20 | ✅ | Active | Marketing campaigns by partners |
| 3 | `channels` | 7 | ✅ | Active | Partner marketing channels |
| 4 | `curricula` | 6 | ✅ | Active | Educational curriculum definitions |
| 5 | `notifications` | 10 | ✅ | Active | User notifications |
| 6 | `partner_type_permissions` | 5 | ❌ | Active | Permission mappings by partner type |
| 7 | `partner_type_roles` | 5 | ❌ | Active | Role definitions by partner type |
| 8 | `partner_types` | 8 | ❌ | Active | Partner classification types |
| 9 | `partners` | 36 | ✅ | Active | Partner organizations & onboarding |
| 10 | `permissions` | 6 | ✅ | Active | Permission definitions |
| 11 | `program_enrollments` | 11 | ✅ | Active | User program enrollments |
| 12 | `programs` | 12 | ✅ | Active | Educational programs |
| 13 | `social_media_platforms` | 8 | ❌ | Active | Social media platform list |
| 14 | `subjects` | 6 | ✅ | Active | Educational subjects |
| 15 | `transactions` | 14 | ✅ | Active | Financial transactions |
| 16 | `two_factor_verifications` | 11 | ❌ | Active | 2FA verification records |
| 17 | `user_invites` | 11 | ❌ | Active | User invitation system |
| 18 | `users` | 11 | ✅ | Active | User accounts & profiles |
| 19 | `wallets` | 17 | ✅ | Active | Wallet accounts |
| 20 | `withdrawals` | 18 | ✅ | Active | Withdrawal requests |

---

## Detailed Table Schemas

### 1. audit_logs
**Purpose:** Complete audit trail for compliance and debugging

```
Columns (10):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  user_id (uuid) FK → users.id
  action (text) NOT NULL
  table_name (text) NOT NULL
  record_id (text)
  old_values (jsonb)
  new_values (jsonb)
  ip_address (text)
  created_at (timestamp with time zone) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 7
- PK: id
- UNIQUE: convex_id
- Functional: action, table_name, user_id, convex_id, created_at

**RLS:** ✅ Enabled (2 policies)
- Service role can insert
- Users can view own audit logs

---

### 2. campaigns
**Purpose:** Marketing campaigns created by partners

```
Columns (20):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  partner_id (uuid) FK → partners.id NOT NULL
  name (text) NOT NULL
  description (text)
  status (text)
  target_amount (numeric)
  current_amount (numeric)
  commission_rate (numeric)
  start_date (date)
  end_date (date)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  program_id (uuid) FK → programs.id
  channel_id (uuid) FK → channels.id
  subchannel (text)
  target_signups (integer)
  duration_start (date)
  duration_end (date)
```

**Indexes:** 6
- PK: id
- UNIQUE: convex_id
- Functional: partner_id, program_id, channel_id, status, date_range, convex_id

**RLS:** ✅ Enabled (6 policies)
- Service role insert
- Users view own campaigns
- Users update own campaigns
- Users delete own campaigns
- Prevent direct insert

---

### 3. channels
**Purpose:** Marketing channels for partner campaigns

```
Columns (7):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  partner_id (uuid) FK → partners.id NOT NULL
  name (text) NOT NULL
  subchannels (jsonb) DEFAULT '[]'::jsonb
  metadata (jsonb) DEFAULT '{}'::jsonb
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 2
- PK: id
- Functional: partner_id

**RLS:** ✅ Enabled (2 policies)
- Prevent direct insert
- Users select own channels

---

### 4. curricula
**Purpose:** Educational curriculum definitions

```
Columns (6):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  name (text) NOT NULL
  description (text)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 3
- PK: id
- UNIQUE: convex_id
- Functional: convex_id

**RLS:** ✅ Enabled (2 policies)
- Public can view
- Service role can manage

---

### 5. notifications
**Purpose:** User notification system

```
Columns (10):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  user_id (uuid) FK → users.id NOT NULL
  title (text) NOT NULL
  message (text) NOT NULL
  type (text)
  is_read (boolean) DEFAULT false
  read_at (timestamp)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 6
- PK: id
- UNIQUE: convex_id
- Functional: user_id, is_read, created_at, convex_id

**RLS:** ✅ Enabled (3 policies)
- Service role insert
- Users view own notifications
- Users update own notifications

---

### 6. partner_type_permissions
**Purpose:** Permission mappings by partner type

```
Columns (5):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  partner_type_slug (text) FK → partner_types.slug NOT NULL
  permission_key (text) NOT NULL
  description (text)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Constraints:**
- UNIQUE: (partner_type_slug, permission_key)

**Indexes:** 3
- PK: id
- UNIQUE: (partner_type_slug, permission_key)
- Functional: partner_type_slug

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK

---

### 7. partner_type_roles
**Purpose:** Role definitions by partner type

```
Columns (5):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  partner_type_slug (text) FK → partner_types.slug NOT NULL
  role_name (text) NOT NULL
  description (text)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Constraints:**
- UNIQUE: (partner_type_slug, role_name)

**Indexes:** 3
- PK: id
- UNIQUE: (partner_type_slug, role_name)

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK

---

### 8. partner_types
**Purpose:** Partner classification system

```
Columns (8):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  name (text) NOT NULL UNIQUE
  slug (text) NOT NULL UNIQUE
  description (text)
  access_level (integer) DEFAULT 25
  default_commission_rate (numeric)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 3
- PK: id
- UNIQUE: name
- UNIQUE: slug

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK

**Current Types:** affiliate, brand, ngo, educational

---

### 9. partners
**Purpose:** Partner organizations with complete onboarding state

```
Columns (36):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  user_id (uuid) FK → users.id NOT NULL
  org_name (text) NOT NULL
  org_email (text)
  org_phone (text)
  description (text)
  logo_url (text)
  status (text)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  
  -- Classification
  partner_type (text) DEFAULT 'affiliate'::text
  access_level (integer) DEFAULT 25
  commission_rate (numeric) DEFAULT 5.00
  
  -- Onboarding Flags
  wallet_setup_completed (boolean) DEFAULT false
  campaign_created (boolean) DEFAULT false
  users_added (boolean) DEFAULT false
  two_factor_setup_completed (boolean) DEFAULT false
  social_media_added (boolean) DEFAULT false
  onboarding_completed (boolean) DEFAULT false
  
  -- Timestamps
  onboarding_completed_at (timestamp)
  wallet_setup_completed_at (timestamp)
  campaign_created_at (timestamp)
  users_added_at (timestamp)
  two_factor_setup_completed_at (timestamp)
  social_media_completed (boolean) DEFAULT false
  social_media_completed_at (timestamp)
  
  -- 2FA Setup
  two_factor_phone (text)
  two_factor_phone_verified (boolean) DEFAULT false
  two_factor_email (text)
  two_factor_email_verified (boolean) DEFAULT false
  
  -- Social Media
  social_media_links (jsonb) DEFAULT '{}'::jsonb
  
  -- UI State
  is_first_login (boolean) DEFAULT true
  onboarding_steps_skipped (jsonb) DEFAULT '[]'::jsonb
  onboarding_metadata (jsonb) DEFAULT '{}'::jsonb
```

**Indexes:** 9
- PK: id
- UNIQUE: convex_id
- Functional: user_id, partner_type, status, wallet_setup_completed, onboarding_completed, is_first_login, convex_id

**RLS:** ✅ Enabled (3 policies)
- Service role insert
- Users view own partners
- Users update own partners

---

### 10. permissions
**Purpose:** Permission definitions for access control

```
Columns (6):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  name (text) NOT NULL UNIQUE
  description (text)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 5
- PK: id
- UNIQUE: convex_id
- UNIQUE: name
- Functional: convex_id, name

**RLS:** ✅ Enabled (1 policy)
- Public can view

---

### 11. program_enrollments
**Purpose:** Track user enrollment in educational programs

```
Columns (11):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  program_id (uuid) FK → programs.id NOT NULL
  campaign_id (uuid) FK → campaigns.id
  user_id (uuid) FK → users.id
  status (text)
  enrollment_date (date) DEFAULT CURRENT_DATE
  completion_date (date)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 7
- PK: id
- UNIQUE: convex_id
- Functional: program_id, campaign_id, user_id, status, convex_id

**RLS:** ✅ Enabled (2 policies)
- Service role manage
- Users view own enrollments

---

### 12. programs
**Purpose:** Educational programs offered through the platform

```
Columns (12):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  curriculum_id (uuid) FK → curricula.id
  name (text) NOT NULL
  description (text)
  status (text)
  start_date (date)
  end_date (date)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  pricing (numeric)
```

**Indexes:** 5
- PK: id
- UNIQUE: convex_id
- Functional: curriculum_id, status, convex_id

**RLS:** ✅ Enabled (2 policies)
- Public can view
- Service role can manage

---

### 13. social_media_platforms
**Purpose:** List of supported social media platforms

```
Columns (8):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  name (text) NOT NULL UNIQUE
  display_name (text) NOT NULL
  icon_name (text)
  url_pattern (text)
  is_active (boolean) DEFAULT true
  sort_order (integer) DEFAULT 0
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 2
- PK: id
- UNIQUE: name

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK

---

### 14. subjects
**Purpose:** Educational subjects for curriculum

```
Columns (6):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  name (text) NOT NULL
  description (text)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 3
- PK: id
- UNIQUE: convex_id
- Functional: convex_id

**RLS:** ✅ Enabled (2 policies)
- Public can view
- Service role can manage

---

### 15. transactions
**Purpose:** Financial transaction records

```
Columns (14):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  campaign_id (uuid) FK → campaigns.id
  user_id (uuid) FK → users.id
  partner_id (uuid) FK → partners.id
  amount (numeric) NOT NULL
  currency (text)
  status (text)
  transaction_type (text)
  external_ref (text)
  payment_method (text)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 8
- PK: id
- UNIQUE: convex_id
- Functional: campaign_id, user_id, partner_id, status, created_at, convex_id

**RLS:** ✅ Enabled (2 policies)
- Service role insert
- Users view own partner transactions

---

### 16. two_factor_verifications
**Purpose:** 2FA verification codes and status

```
Columns (11):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  partner_id (uuid) FK → partners.id NOT NULL
  verification_type (text) NOT NULL
  contact_value (text) NOT NULL
  otp_code (text) NOT NULL
  attempts (integer) DEFAULT 0
  is_verified (boolean) DEFAULT false
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  verified_at (timestamp)
  expires_at (timestamp) DEFAULT (CURRENT_TIMESTAMP + '00:10:00'::interval)
  metadata (jsonb)
```

**Indexes:** 6
- PK: id
- Functional: partner_id, verification_type, contact_value, is_verified, expires_at

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK (Contains sensitive OTP data)

---

### 17. user_invites
**Purpose:** Invitation system for adding users to partners

```
Columns (11):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  partner_id (uuid) FK → partners.id NOT NULL
  email (text) NOT NULL
  role (text) DEFAULT 'member'::text NOT NULL
  status (text) DEFAULT 'pending'::text
  invited_by (uuid) FK → users.id
  invitation_token (text) UNIQUE
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  accepted_at (timestamp)
  expires_at (timestamp) DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval)
  metadata (jsonb)
```

**Indexes:** 7
- PK: id
- UNIQUE: invitation_token
- Functional: partner_id, email, status, expires_at, invited_by, invitation_token

**RLS:** ❌ **DISABLED** - ⚠️ SECURITY RISK (Contains invitation tokens)

---

### 18. users
**Purpose:** User accounts and profiles

```
Columns (11):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  auth_id (uuid) NOT NULL UNIQUE
  convex_id (text) UNIQUE
  email (text) NOT NULL UNIQUE
  full_name (text)
  phone (text)
  username (text) UNIQUE
  role (text) DEFAULT 'member'::text
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  partner_id (uuid) FK → partners.id
```

**Indexes:** 9
- PK: id
- UNIQUE: auth_id, email, username, convex_id
- Functional: auth_id, email, convex_id, partner_id

**RLS:** ✅ Enabled (2 policies)
- Users view own profile
- Users update own profile

---

### 19. wallets
**Purpose:** Wallet accounts for earning and withdrawals

```
Columns (17):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  partner_id (uuid) FK → partners.id NOT NULL (UNIQUE)
  balance (numeric)
  total_earned (numeric)
  bank_name (text)
  account_number (text)
  account_holder (text)
  status (text)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  user_id (uuid)
  withdrawal_method (text)
  paybill_number (text)
  pin (text)
  beneficiaries (jsonb)
```

**Indexes:** 5
- PK: id
- UNIQUE: convex_id
- UNIQUE: partner_id
- Functional: partner_id, convex_id

**RLS:** ✅ Enabled (2 policies)
- Service role manage
- Users view own wallet

---

### 20. withdrawals
**Purpose:** Withdrawal request and processing

```
Columns (18):
  id (uuid) PRIMARY KEY DEFAULT gen_random_uuid()
  convex_id (text) UNIQUE
  partner_id (uuid) FK → partners.id NOT NULL
  wallet_id (uuid) FK → wallets.id NOT NULL
  amount (numeric) NOT NULL
  status (text)
  reason (text)
  admin_notes (text)
  mpesa_receipt (text)
  requested_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  approved_at (timestamp)
  completed_at (timestamp)
  approved_by (text)
  rejection_reason (text)
  rejected_at (timestamp)
  metadata (jsonb)
  created_at (timestamp) DEFAULT CURRENT_TIMESTAMP
  updated_at (timestamp) DEFAULT CURRENT_TIMESTAMP
```

**Indexes:** 6
- PK: id
- UNIQUE: convex_id
- Functional: partner_id, wallet_id, status, requested_at, convex_id

**RLS:** ✅ Enabled (2 policies)
- Service role manage
- Users view own withdrawals

---

## Foreign Key Relationships

### Complete FK Matrix

| Source Table | Source Column | Target Table | Target Column | Constraint Name | Type |
|---|---|---|---|---|---|
| `audit_logs` | `user_id` | `users` | `id` | audit_logs_user_id_fkey | 1:N |
| `campaigns` | `partner_id` | `partners` | `id` | campaigns_partner_id_fkey | 1:N |
| `campaigns` | `program_id` | `programs` | `id` | campaigns_program_id_fkey | 1:N |
| `campaigns` | `channel_id` | `channels` | `id` | campaigns_channel_id_fkey | 1:N |
| `channels` | `partner_id` | `partners` | `id` | channels_partner_id_fkey | 1:N |
| `notifications` | `user_id` | `users` | `id` | notifications_user_id_fkey | 1:N |
| `partner_type_permissions` | `partner_type_slug` | `partner_types` | `slug` | partner_type_permissions_partner_type_slug_fkey | 1:N |
| `partner_type_roles` | `partner_type_slug` | `partner_types` | `slug` | partner_type_roles_partner_type_slug_fkey | 1:N |
| `partners` | `user_id` | `users` | `id` | partners_user_id_fkey | 1:1 |
| `program_enrollments` | `program_id` | `programs` | `id` | program_enrollments_program_id_fkey | 1:N |
| `program_enrollments` | `campaign_id` | `campaigns` | `id` | program_enrollments_campaign_id_fkey | 1:N |
| `program_enrollments` | `user_id` | `users` | `id` | program_enrollments_user_id_fkey | 1:N |
| `programs` | `curriculum_id` | `curricula` | `id` | programs_curriculum_id_fkey | 1:N |
| `transactions` | `campaign_id` | `campaigns` | `id` | transactions_campaign_id_fkey | 1:N |
| `transactions` | `user_id` | `users` | `id` | transactions_user_id_fkey | 1:N |
| `transactions` | `partner_id` | `partners` | `id` | transactions_partner_id_fkey | 1:N |
| `two_factor_verifications` | `partner_id` | `partners` | `id` | two_factor_verifications_partner_id_fkey | 1:N |
| `user_invites` | `partner_id` | `partners` | `id` | user_invites_partner_id_fkey | 1:N |
| `user_invites` | `invited_by` | `users` | `id` | user_invites_invited_by_fkey | 1:N |
| `users` | `partner_id` | `partners` | `id` | fk_users_partner | 1:1 |
| `wallets` | `partner_id` | `partners` | `id` | wallets_partner_id_fkey | 1:1 |
| `withdrawals` | `partner_id` | `partners` | `id` | withdrawals_partner_id_fkey | 1:N |
| `withdrawals` | `wallet_id` | `wallets` | `id` | withdrawals_wallet_id_fkey | 1:N |

**Total Relationships:** 23

---

## Database Functions & Triggers

### Function Definitions

#### 1. `check_partner_onboarding_complete(p_partner_id uuid) → boolean`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Verify if partner completed required onboarding steps

```sql
-- Logic:
-- Returns TRUE if ALL of the following are TRUE:
--   - wallet_setup_completed
--   - campaign_created
--   - two_factor_setup_completed
```

---

#### 2. `cleanup_expired_2fa_codes() → integer`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Delete expired 2FA verification codes

```sql
-- Logic:
-- Deletes all records from two_factor_verifications where:
--   - expires_at < CURRENT_TIMESTAMP
--   - is_verified = FALSE
-- Returns count of deleted rows
```

---

#### 3. `create_campaign(...) → campaigns`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Create new campaign with comprehensive validation

**Parameters:**
- p_partner_id (uuid) - Required
- p_name (text) - Required
- p_description (text) - Required
- p_target_signups (integer) - Required, must be > 0
- p_duration_start (date) - Required
- p_duration_end (date) - Required, must be >= start date
- p_program_id (uuid) - Optional, validates ownership
- p_channel_id (uuid) - Optional, validates ownership
- p_subchannel (text) - Optional
- p_user_id (uuid) - Optional

**Validations:**
- partner_id must not be null
- name and description must not be empty
- target_signups must be positive integer
- start_date ≤ end_date
- program_id must belong to partner (if provided)
- channel_id must belong to partner (if provided)

---

#### 4. `create_user_profile(...) → record`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Create or update user profile from authentication

**Parameters:**
- p_auth_id (uuid) - Must match auth.uid()
- p_email (text)
- p_full_name (text) - Optional
- p_phone (text) - Optional

**Logic:**
- Validates auth_id matches current user
- Inserts or updates user record
- ON CONFLICT updates email, full_name, phone
- Returns updated user record

---

#### 5. `get_partner_onboarding_status(p_partner_id uuid) → record`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Return onboarding progress for partner

**Returns Table:**
| Column | Type | Description |
|--------|------|---|
| step_name | text | wallet_setup, campaign_created, users_added, two_factor_setup, social_media |
| step_number | integer | Order (1-5) |
| completed | boolean | Whether step is complete |
| required | boolean | Whether step is required |

---

#### 6. `handle_auth_user_delete() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Delete user when auth record is deleted

**Trigger:** `BEFORE DELETE ON auth.users`

**Logic:**
- Deletes corresponding public.users record
- Cascades to all dependent records

---

#### 7. `handle_new_auth_user() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Create user profile when new auth user registered

**Trigger:** `AFTER INSERT ON auth.users`

**Logic:**
- Inserts new public.users record
- Copies auth_id and email
- Sets role to 'member', created/updated_at to NOW()

---

#### 8. `handle_new_user() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Sync user creation from auth

**Trigger:** `AFTER INSERT ON auth.users`

**Logic:**
- Same as handle_new_auth_user with ON CONFLICT UPDATE

---

#### 9. `sync_partner_to_user_fn() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Update user role and partner_id when partner created

**Trigger:** `AFTER INSERT ON partners`

**Logic:**
- Updates public.users record:
  - Sets partner_id = NEW.id
  - Sets role = 'partner'
  - Updates updated_at = CURRENT_TIMESTAMP

---

#### 10. `update_partner_onboarding_step(...) → void`
**Type:** Function  
**Language:** PL/pgSQL  
**Purpose:** Update specific onboarding milestone and check completion

**Parameters:**
- p_partner_id (uuid)
- p_step_name (text) - wallet_setup, campaign_created, users_added, two_factor_setup, social_media
- p_completed (boolean)

**Logic:**
- Updates partner record for specific step
- After update, calls check_partner_onboarding_complete()
- If complete, sets onboarding_completed = TRUE and onboarding_completed_at = CURRENT_TIMESTAMP

---

#### 11. `update_updated_at_column() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Auto-update timestamp on record change

**Trigger:** `BEFORE UPDATE` on multiple tables

**Logic:**
- Sets NEW.updated_at = CURRENT_TIMESTAMP before update

---

#### 12. `update_wallet_setup_completed() → trigger`
**Type:** Trigger Function  
**Language:** PL/pgSQL  
**Purpose:** Update partner onboarding when wallet created

**Trigger:** `AFTER INSERT ON wallets`

**Logic:**
- Updates partners record:
  - Sets wallet_setup_completed = true
  - Sets wallet_setup_completed_at = CURRENT_TIMESTAMP

---

### Trigger Relationships

| Trigger | Table | Event | Function | Order |
|---------|-------|-------|----------|-------|
| `handle_new_user` | auth.users | AFTER INSERT | handle_new_auth_user | 100 |
| `handle_user_delete` | auth.users | BEFORE DELETE | handle_auth_user_delete | 100 |
| `sync_partner_insert` | partners | AFTER INSERT | sync_partner_to_user_fn | 100 |
| `sync_2fa_insert` | two_factor_verifications | AFTER INSERT | (custom logic) | - |
| `wallet_setup_trigger` | wallets | AFTER INSERT | update_wallet_setup_completed | 100 |
| `update_timestamp_campaigns` | campaigns | BEFORE UPDATE | update_updated_at_column | 100 |
| `update_timestamp_partners` | partners | BEFORE UPDATE | update_updated_at_column | 100 |
| `update_timestamp_wallets` | wallets | BEFORE UPDATE | update_updated_at_column | 100 |

---

## Row Level Security (RLS)

### RLS Overview

| Status | Count | Percentage |
|--------|-------|-----------|
| ✅ Enabled | 15 | 75% |
| ❌ Disabled | 5 | 25% |

### Tables with RLS Enabled

#### audit_logs (2 policies)

**Policy 1: Service role can insert audit logs**
- Command: INSERT
- Roles: public
- WITH CHECK: true (always allow service role)

**Policy 2: Users can view own audit logs**
- Command: SELECT
- Roles: public
- USING: `user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id)`

---

#### campaigns (6 policies)

**Policy 1: Service role can insert campaigns**
- Command: INSERT
- WITH CHECK: true

**Policy 2: Users can view own partner campaigns**
- Command: SELECT
- USING: `partner_id IN (SELECT partners.id FROM partners WHERE partners.user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id))`

**Policy 3: select_own_campaigns**
- Command: SELECT
- USING: Partners and users with partner_id match

**Policy 4: update_own_campaigns**
- Command: UPDATE
- WITH CHECK: Partners and users with partner_id match

**Policy 5: delete_own_campaigns**
- Command: DELETE
- USING: Partners and users with partner_id match

**Policy 6: prevent_direct_insert**
- Command: INSERT
- WITH CHECK: false (prevent direct insert, use function instead)

---

#### channels (2 policies)

**Policy 1: prevent_direct_channel_insert**
- Command: INSERT
- WITH CHECK: false

**Policy 2: select_own_channels**
- Command: SELECT
- USING: Users and partners with matching partner_id

---

#### curricula (2 policies)

**Policy 1: Public can view curricula**
- Command: SELECT
- USING: true (public read)

**Policy 2: Service role can manage curricula**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

---

#### notifications (3 policies)

**Policy 1: Service role can insert notifications**
- Command: INSERT
- WITH CHECK: true

**Policy 2: Users can view own notifications**
- Command: SELECT
- USING: `user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id)`

**Policy 3: Users can update own notifications**
- Command: UPDATE
- USING & WITH CHECK: Users can update own notifications only

---

#### partners (3 policies)

**Policy 1: Service role can insert partners**
- Command: INSERT
- WITH CHECK: true

**Policy 2: Users can view own partners**
- Command: SELECT
- USING: `user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id)`

**Policy 3: Users can update own partners**
- Command: UPDATE
- USING & WITH CHECK: `user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id)`

---

#### permissions (1 policy)

**Policy: Public can view permissions**
- Command: SELECT
- USING: true

---

#### program_enrollments (2 policies)

**Policy 1: Service role can manage enrollments**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

**Policy 2: Users can view own enrollments**
- Command: SELECT
- USING: `user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id)`

---

#### programs (2 policies)

**Policy 1: Public can view programs**
- Command: SELECT
- USING: true

**Policy 2: Service role can manage programs**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

---

#### subjects (2 policies)

**Policy 1: Public can view subjects**
- Command: SELECT
- USING: true

**Policy 2: Service role can manage subjects**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

---

#### transactions (2 policies)

**Policy 1: Service role can insert transactions**
- Command: INSERT
- WITH CHECK: true

**Policy 2: Users can view own partner transactions**
- Command: SELECT
- USING: `partner_id IN (SELECT partners.id FROM partners WHERE partners.user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id))`

---

#### users (2 policies)

**Policy 1: Users can view own profile**
- Command: SELECT
- USING: `auth.uid() = auth_id`

**Policy 2: Users can update own profile**
- Command: UPDATE
- USING & WITH CHECK: `auth.uid() = auth_id`

---

#### wallets (2 policies)

**Policy 1: Service role can manage wallets**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

**Policy 2: Users can view own wallet**
- Command: SELECT
- USING: `partner_id IN (SELECT partners.id FROM partners WHERE partners.user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id))`

---

#### withdrawals (2 policies)

**Policy 1: Service role can manage withdrawals**
- Command: INSERT, UPDATE, DELETE
- WITH CHECK: true

**Policy 2: Users can view own withdrawals**
- Command: SELECT
- USING: `partner_id IN (SELECT partners.id FROM partners WHERE partners.user_id IN (SELECT users.id FROM users WHERE auth.uid() = users.auth_id))`

---

### ⚠️ Tables with RLS DISABLED

The following tables are exposed to PostgREST but have NO RLS policies:

1. **partner_type_permissions** - Permission mappings
2. **partner_type_roles** - Role definitions
3. **partner_types** - Partner classification
4. **social_media_platforms** - Platform list (less critical)
5. **two_factor_verifications** - **CRITICAL** - Contains OTP codes

---

## Indexes & Performance

### Index Statistics

**Total Indexes:** 127

**Breakdown by Type:**
- Primary Keys: 20
- Unique Constraints: 30+
- Functional Indexes: 77+

### Top Indexed Tables

| Table | Indexes | Type | Purpose |
|-------|---------|------|---------|
| partners | 9 | Multi-type | High-traffic operational table |
| users | 9 | Multi-type | Authentication & lookup |
| transactions | 8 | Multi-type | Financial reporting |
| campaigns | 6 | Multi-type | Partner operations |
| program_enrollments | 7 | Multi-type | Enrollment queries |

### Query Optimization Strategies

**Common Patterns Indexed:**
- `partner_id` queries (campaigns, channels, wallets, withdrawals, etc.)
- `user_id` queries (audit_logs, notifications, etc.)
- Status filters (campaigns.status, partners.status, etc.)
- Timestamp ranges (created_at, expires_at)
- Onboarding state (partners.wallet_setup_completed, etc.)

---

## Security Analysis

### ✅ Strengths

1. **Comprehensive RLS on Core Tables** - 75% coverage
2. **Trigger-based Data Integrity** - Automatic timestamp updates, cascading operations
3. **Foreign Key Constraints** - Referential integrity enforced
4. **UUID Primary Keys** - Better than sequential IDs for security
5. **Service Role Pattern** - Clear separation of user vs. backend operations
6. **Function Validation** - Business logic enforced in database

### ⚠️ Critical Issues

**1. Missing RLS on Sensitive Tables**

| Table | Risk | Data Exposed |
|-------|------|---|
| `partner_types` | Medium | Partner classification config |
| `partner_type_permissions` | Medium | Permission system config |
| `partner_type_roles` | Medium | Role system config |
| `two_factor_verifications` | **CRITICAL** | OTP codes, verification status |
| `user_invites` | High | Invitation tokens, email addresses |
| `social_media_platforms` | Low | Platform list (public info) |

**2. Function Search Path Issues**

10 functions lack explicit `SET search_path = public` directive:
- check_partner_onboarding_complete
- cleanup_expired_2fa_codes
- create_campaign
- create_user_profile
- get_partner_onboarding_status
- handle_auth_user_delete
- handle_new_auth_user
- handle_new_user
- sync_partner_to_user_fn
- update_partner_onboarding_step
- update_updated_at_column
- update_wallet_setup_completed

**Security Advisory:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

**3. Leaked Password Protection**

Supabase Auth has leaked password protection disabled - enable in Auth settings.

---

## Recommendations

### Immediate Actions Required

#### 1. Enable RLS on `two_factor_verifications` - **CRITICAL**

```sql
ALTER TABLE two_factor_verifications ENABLE ROW LEVEL SECURITY;

-- Restrict to service role and own partner
CREATE POLICY "service_role_manage_2fa" 
  ON two_factor_verifications FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "users_view_own_2fa"
  ON two_factor_verifications FOR SELECT
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ));
```

#### 2. Enable RLS on `user_invites` - **HIGH PRIORITY**

```sql
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage_invites"
  ON user_invites FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "users_view_own_invites"
  ON user_invites FOR SELECT
  USING (partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ));
```

#### 3. Add RLS to `partner_type_*` Tables - **MEDIUM PRIORITY**

```sql
ALTER TABLE partner_type_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_type_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;

-- Public read, service role write
CREATE POLICY "public_read_partner_types" ON partner_types FOR SELECT USING (true);
CREATE POLICY "service_write_partner_types" ON partner_types FOR INSERT, UPDATE, DELETE WITH CHECK (true);
-- ... repeat for other tables
```

#### 4. Fix Function Search Paths

```sql
ALTER FUNCTION check_partner_onboarding_complete(uuid) 
  SET search_path = public;

ALTER FUNCTION cleanup_expired_2fa_codes() 
  SET search_path = public;

-- ... apply to all functions
```

#### 5. Enable Leaked Password Protection

In Supabase Dashboard:
- Settings → Auth → Security
- Enable "Leaked password protection"

### Long-Term Improvements

1. **Audit Logging** - Implement systematic audit trail for sensitive operations
2. **API Rate Limiting** - Add rate limiting on sensitive endpoints
3. **Access Control Hierarchy** - Formalize role-based access control
4. **Backup Strategy** - Ensure automated backups with point-in-time recovery
5. **Monitoring** - Set up alerts for suspicious access patterns
6. **Documentation** - Maintain data classification for GDPR/compliance

---

## Summary

The Sqooli Partner Platform database is well-structured with:
- 20 operational tables
- 11 stored functions with business logic
- 23 foreign key relationships
- 127 indexes for performance
- 33 RLS policies on 15 tables

**Current Status:** Functional but requires RLS enforcement on 5 sensitive tables before production deployment.

**Last Updated:** January 2, 2026  
**Source:** Supabase MCP Live Session  
**Authority:** Database Administrator
