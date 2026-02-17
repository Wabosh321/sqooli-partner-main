# Authentication & Authorization Flow Documentation

## 1. Sign-Up Flow

### Tables

| Table Name | Auth-Related Columns                                                                                           | Purpose                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| auth.users | id, email, email_confirmed_at, raw_user_meta_data                                                              | Supabase Auth user records                 |
| profiles   | id (FK→auth.users), email, username, phone, full_name, role, is_first_login, is_active, created_at, updated_at | User profile linked to auth record         |
| partners   | id, org_name, partner_type, access_level, onboarding_completed                                                 | Partner organization created during signup |

### Functions

| Function Name                                                                                            | Purpose                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| create_user_profile(p_email, p_full_name, p_phone, p_username)                                           | Creates user profile after email verification; checks auth.uid() is not null                                                      |
| create_user_profile(p_auth_id, p_email, p_full_name, p_phone, p_username)                                | Creates profile with explicit auth_id; verifies auth.uid() matches p_auth_id                                                      |
| sync_verified_user_profile()                                                                             | Trigger function (AFTER INSERT/UPDATE on auth.users); syncs verified auth records to profiles with email_confirmed_at IS NOT NULL |
| rpc_onboard_partner_user(p_org_name, p_partner_type, p_user_email, p_user_password, p_full_name, p_role) | Creates partner record and user profile; returns partner_id and user_id                                                           |

### Policies

| Policy Name                            | Table    | Commands | Conditions                                                   |
| -------------------------------------- | -------- | -------- | ------------------------------------------------------------ |
| RPC can create confirmed user profiles | profiles | INSERT   | with_check: ((auth.uid() IS NOT NULL) AND (auth.uid() = id)) |

### Triggers

| Trigger Name                          | Table      | Event                                                             | Function                     |
| ------------------------------------- | ---------- | ----------------------------------------------------------------- | ---------------------------- |
| trg_sync_verified_user_profile_insert | auth.users | AFTER INSERT (WHEN new.email_confirmed_at IS NOT NULL)            | sync_verified_user_profile() |
| trg_sync_verified_user_profile_update | auth.users | AFTER UPDATE (WHEN email_confirmed or raw_user_meta_data changed) | sync_verified_user_profile() |
| profiles_updated_at                   | profiles   | BEFORE UPDATE                                                     | handle_profiles_updated_at() |

---

## 2. Sign-In Flow

### Tables

| Table Name | Auth-Related Columns                                             | Purpose                           |
| ---------- | ---------------------------------------------------------------- | --------------------------------- |
| auth.users | id, email, email_confirmed_at                                    | Source of authentication truth    |
| profiles   | id, email, username, partner_id, role, is_active, is_first_login | User context and role information |

### Functions

| Function Name                  | Purpose                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| is_authenticated()             | Returns TRUE if auth.uid() IS NOT NULL; used by RLS policies for auth checks        |
| get_user_partner_id(p_user_id) | Retrieves partner_id from profiles for given user_id; used for multi-tenant context |

### Policies

| Policy Name                | Table    | Commands | Conditions                                               |
| -------------------------- | -------- | -------- | -------------------------------------------------------- |
| Users can view own profile | profiles | SELECT   | using: ((auth.uid() = id) OR is_super_admin(auth.uid())) |

---

## 3. Partner Types, Roles & Dashboard Access

### Tables

| Table Name   | Auth-Related Columns                                                         | Purpose                                             |
| ------------ | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| partners     | id, partner_type, access_level, onboarding_completed                         | Partner organization type and access level          |
| profiles     | partner_id (FK→partners), role, access_level, permissions (jsonb), is_active | User role within partner org and global permissions |
| team_members | partner_id (FK), user_id (FK→profiles), role, permission_level, is_active    | Fine-grained role assignment per campaign/program   |
| audit_logs   | user_id (FK→profiles), action, action_type, resource_type, resource_id       | Audit trail for access and actions                  |

### Functions

| Function Name                                                                                                                | Purpose                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| is_super_admin(p_user_id)                                                                                                    | Checks if user role is 'super_admin' or 'system_admin'; used by RLS policies                                                       |
| is_partner_admin(p_partner_id)                                                                                               | Checks if any user with partner_id has role containing 'admin' or is_super_admin; used by RLS policies                             |
| rpc_create_team_member(p_partner_id, p_user_id, p_role, p_campaign_id, p_program_id, p_permission_level)                     | Assigns user to campaign/program with role (creator, approver, member, viewer, admin) and permission_level (viewer, member, admin) |
| rpc_update_team_member(p_team_member_id, p_role, p_permission_level, p_is_active)                                            | Updates team member role, permission_level, and active status                                                                      |
| log_activity(p_partner_id, p_user_id, p_action, p_entity_type, p_entity_id, p_before_state, p_after_state, p_change_summary) | Logs user actions for audit trail                                                                                                  |

### Policies

| Policy Name                                    | Table                    | Commands | Conditions                                                                                                               |
| ---------------------------------------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Only super admins can create partners          | partners                 | INSERT   | with_check: is_super_admin(auth.uid())                                                                                   |
| Partner admins can update own partner          | partners                 | UPDATE   | using/with_check: complex admin check                                                                                    |
| Users can view own partner                     | partners                 | SELECT   | using: ((id IN (SELECT profiles.partner_id FROM profiles WHERE profiles.id = auth.uid())) OR is_super_admin(auth.uid())) |
| Admins can view partner members                | profiles                 | SELECT   | using: admin membership check                                                                                            |
| Users can update own limited fields            | profiles                 | UPDATE   | using/with_check: (auth.uid() = id)                                                                                      |
| Users can view own profile                     | profiles                 | SELECT   | using: ((auth.uid() = id) OR is_super_admin(auth.uid()))                                                                 |
| Partner admins can create campaigns            | campaigns                | INSERT   | with_check: is_partner_admin(partner_id)                                                                                 |
| Partner admins can delete campaigns            | campaigns                | DELETE   | using: is_partner_admin(partner_id)                                                                                      |
| Partner admins can update campaigns            | campaigns                | UPDATE   | using: is_partner_admin(partner_id); with_check: is_partner_admin(partner_id)                                            |
| Users can view own partner campaigns           | campaigns                | SELECT   | using: ((partner_id = get_user_partner_id(auth.uid())) OR is_super_admin(auth.uid()))                                    |
| Partner admins can create programs             | programs                 | INSERT   | with_check: is_partner_admin(partner_id)                                                                                 |
| Partner admins can delete programs             | programs                 | DELETE   | using: is_partner_admin(partner_id)                                                                                      |
| Partner admins can update programs             | programs                 | UPDATE   | using/with_check: is_partner_admin(partner_id)                                                                           |
| Users can view own partner programs            | programs                 | SELECT   | using: ((partner_id = get_user_partner_id(auth.uid())) OR is_super_admin(auth.uid()))                                    |
| Authorized users can update tasks              | tasks                    | UPDATE   | using/with_check: ((created_by_user_id = auth.uid()) OR (approver_id = auth.uid()) OR is_super_admin(auth.uid()))        |
| Partner admins can delete tasks                | tasks                    | DELETE   | using: partner-admin check on related campaign partner                                                                   |
| Users can create tasks in accessible campaigns | tasks                    | INSERT   | with_check: partner-admin check on campaign partner                                                                      |
| Users can view accessible tasks                | tasks                    | SELECT   | using: created/approver/partner membership OR is_super_admin(auth.uid())                                                 |
| System can log user activity                   | user_activity_log        | INSERT   | with_check: is_super_admin(auth.uid())                                                                                   |
| Users can view own activity logs               | user_activity_log        | SELECT   | using: ((user_id = auth.uid()) OR (parent_user_id = auth.uid()) OR is_super_admin(auth.uid()))                           |
| System can create performance metrics          | user_performance_metrics | INSERT   | with_check: is_super_admin(auth.uid())                                                                                   |
| System can update performance metrics          | user_performance_metrics | UPDATE   | using/with_check: is_super_admin(auth.uid())                                                                             |
| Users can view own performance metrics         | user_performance_metrics | SELECT   | using: ((user_id = auth.uid()) OR (parent_user_id = auth.uid()) OR is_super_admin(auth.uid()))                           |
| Authenticated users can create audit logs      | audit_logs               | INSERT   | with_check: (is_authenticated() AND ((user_id = auth.uid()) OR is_super_admin(auth.uid())))                              |
| Users can view own audit logs                  | audit_logs               | SELECT   | using: ((user_id = auth.uid()) OR is_super_admin(auth.uid()))                                                            |

### Triggers

| Trigger Name                        | Table                    | Event         | Function                                     |
| ----------------------------------- | ------------------------ | ------------- | -------------------------------------------- |
| partners_updated_at                 | partners                 | BEFORE UPDATE | handle_partners_updated_at()                 |
| profiles_updated_at                 | profiles                 | BEFORE UPDATE | handle_profiles_updated_at()                 |
| campaigns_updated_at                | campaigns                | BEFORE UPDATE | handle_campaigns_updated_at()                |
| programs_updated_at                 | programs                 | BEFORE UPDATE | handle_programs_updated_at()                 |
| tasks_updated_at                    | tasks                    | BEFORE UPDATE | handle_tasks_updated_at()                    |
| user_performance_metrics_updated_at | user_performance_metrics | BEFORE UPDATE | handle_user_performance_metrics_updated_at() |
