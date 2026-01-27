# Integrity Report — Supabase vs Workspace

Date: 2026-01-04

## Sections

- Section A: Canonical Supabase Inventory
- Section B: Workspace DB Consumers
- Section C: RPC Verification (hard requirement)
- Section D: RLS × Code Alignment (SECTION F truth table follows)
- Section E: Type System Audit
- Section F: RLS vs Code Execution Truth Table

---

## Section A — Canonical Supabase Inventory

- Sources inspected (repo):
  - `final_database_schema.sql` (rows/definitions)
  - `sqooli_partner_full_database_details.sql` (detailed schema + functions)
  - `scripts/005_create_campaign_rpc_and_rls.sql` (create_campaign RPC + RLS policies)
  - `supabase/migrations/010_create_campaign_views_rpc.sql` (alternate rpc name `rpc_create_campaign`)

Notes: repository contains multiple schema sources. There is a disagreement for `partners` columns (see Section E).

---

## Section B — Workspace DB Consumers

- `.rpc()` usages located:

  - `src/utils/completeUserProfile.ts` — calls `create_user_profile` (line 66)
  - `src/lib/subUserService.ts` — calls `create_media_partner_sub_user` (line 44)
  - `src/lib/socialMediaService.ts` — calls `admin_add_social_media` (line 104)
  - `src/lib/campaignRPC.ts` — calls `create_campaign` (line 83)

- `.insert|.update|.delete` write callsites found across `src/` (examples):
  - `src/components/common/CreateCampaign.tsx` — `.insert('campaigns')` (line 236)
  - `src/components/CreateCampaign.tsx` — `.insert('campaigns')` (line 184)
  - `src/utils/handleCreateUser.ts` — `.from('users').insert(...)` (line 66)
  - `src/lib/supabaseClient.ts` — multiple `.insert` calls for `partners`, `users`, `campaigns` (lines 37,60,77)

---

## Section C — RPC Verification (per hard requirement)

Summary of `.rpc()` cross-checks:

- `create_campaign`

  - Found in repo: `scripts/005_create_campaign_rpc_and_rls.sql` (CREATE OR REPLACE FUNCTION public.create_campaign(...)) — confirmed. (See SQL in repo)
  - Called in code: `src/lib/campaignRPC.ts:83` — confirmed call. Argument names and order match the migration's parameter list (p_partner_id, p_user_id, p_program_id, p_channel_id, p_subchannel, p_name, p_description, p_target_signups, p_duration_start, p_duration_end). Return type: SETOF campaigns — matches code expectation of an array/result.
  - Status: VERIFIED (repo-defined) — ensure backend `service_role` calls only.

- `create_user_profile`

  - Found in repo: `final_database_schema.sql` (CREATE OR REPLACE FUNCTION public.create_user_profile(...)) — confirmed (parameters: p_auth_id UUID, p_email TEXT, p_full_name TEXT, p_phone TEXT, p_username TEXT DEFAULT NULL). Returns TABLE with id, auth_id, email, full_name, phone, username, role.
  - Called in code: `src/utils/completeUserProfile.ts:66` — parameters passed appear to match; verify that `auth.uid()` usage on DB side aligns with client code providing `p_auth_id`.
  - Status: VERIFIED (repo-defined). Validate that callers pass `p_auth_id` equal to the logged-in auth ID.

- `create_media_partner_sub_user`

  - Found in repo: migration added `supabase/migrations/014_create_missing_rpcs.sql` — CREATE OR REPLACE FUNCTION public.create_media_partner_sub_user(...)
  - Called in code: `src/lib/subUserService.ts:44` — uses parameter names `p_email`, `p_full_name`, `p_phone`, `p_username` and expects returned `user_id` and `email`.
  - Status: PRESENT IN REPO (migration 014 added). Deployment required to apply to live DB.

- `admin_add_social_media`
  - Found in repo: migration added `supabase/migrations/014_create_missing_rpcs.sql` — CREATE OR REPLACE FUNCTION public.admin_add_social_media(...)
  - Called in code: `src/lib/socialMediaService.ts:104` — passes `p_platform`, `p_handle`, `p_url`, `p_metadata`.
  - Status: PRESENT IN REPO (migration 014 added). Deployment required to apply to live DB.

No RPC remain assumed. For missing RPCs, migrations were added; apply migrations to MCP to finalize.

---

## Section D — RLS × CODE ALIGNMENT

Key RLS policies extracted (representative):

- `scripts/005_create_campaign_rpc_and_rls.sql` defines (campaigns):
  - `prevent_direct_insert` FOR INSERT WITH CHECK (false)
  - `select_own_campaigns` FOR SELECT USING (partners/user matching logic)
  - `update_own_campaigns` FOR UPDATE ...
  - `delete_own_campaigns` FOR DELETE ...

Analysis for `.insert/.update/.delete` callsites:

- Any client call performing `.insert('campaigns')` (CreateCampaign components) will be BLOCKED_AT_RUNTIME by `prevent_direct_insert` (policy present at `scripts/005_create_campaign_rpc_and_rls.sql` line 121) if client attempts direct insert.
- Updates and deletes on campaigns in UI (CampaignDetails) are allowed if user's partner ownership maps to `auth.uid()` per `update_own_campaigns`/`delete_own_campaigns` — verify that frontend authority context sets `userId` or uses auth to call RPCs/updates.

SECTION F (complete truth table) follows below.

---

## Section E — Type System Audit (DB ↔ TS)

- Source TS types: `src/types/database.types.ts` (auto-generated file)
- Observed mismatches (representative):
  - `partners` onboarding flags: code expects `wallet_setup_completed`, `onboarding_completed`, `onboarding_completed_at`, `wallet_setup_completed_at`, `onboarding_steps_skipped`, `onboarding_metadata` in several files (e.g., `src/utils/verifyAuthData.ts`, `src/components/layout/Sidebar.tsx`) but `src/types/database.types.ts` does not define these fields on `partners.Row`.
    - Severity: HIGH (Missing required DB fields in TS → HIGH)
    - Cause: repo contains conflicting schema artifacts (`final_database_schema.sql` vs `sqooli_partner_full_database_details.sql`). Determine canonical migration source, update migrations, then regenerate TS types.
  - `campaigns` fields: TS uses `target_amount/current_amount` while `create_campaign` RPC and migrations use `target_signups` and duration fields; check domain mismatch and align naming and types.
    - Severity: HIGH if production uses different field semantics.

Fix actions (Type audit):

1. Decide canonical schema (prefer committed migration SQL in `supabase/migrations` or `scripts/` directory).
2. Add or update migrations to reflect intended schema (including onboarding flags in `partners` if desired).
3. Regenerate TS types: `npx supabase gen types typescript --schema public > src/types/database.types.ts`.
4. Run static type checks / tests and verify runtime flows.

---

## Section F — RLS vs CODE EXECUTION TRUTH TABLE

Table: `campaigns` (policy excerpts and code callsites)

- Policy: `prevent_direct_insert` (scripts/005_create_campaign_rpc_and_rls.sql#L121)

  - Effect: Client INSERT denied (WITH CHECK (false)).
  - Code callsites:
    - `src/components/common/CreateCampaign.tsx:236` — `.insert('campaigns')` → DECISION: BLOCKED_AT_RUNTIME (prior to patch)
    - `src/components/CreateCampaign.tsx:184` — `.insert('campaigns')` —> DECISION: BLOCKED_AT_RUNTIME (prior to patch)
  - Fix: Replace these callsites to call a backend endpoint that invokes `create_campaign` RPC (see Section C preferred fix). After remediation, callsites now POST to `/api/create-campaign`.

- Policy: `update_own_campaigns` / `delete_own_campaigns` (scripts/005_create_campaign_rpc_and_rls.sql)
  - Effect: allows UPDATE/DELETE for partner owners (auth.uid() logic present).
  - Code callsites:
    - `src/components/CampaignDetails.tsx:160` — `.update({ status: 'expired' })` → DECISION: POLICY_DEPENDENT (allowed if user is owner)
  - Fix: Ensure client only attempts updates when the UI knows the current user owns the partner or route calls through a secured backend that enforces ownership.

---

## Final Notes & Next Steps (short)

1. Critical: Replace frontend direct campaign inserts with backend RPC path immediately (or temporarily disable campaign creation in client until fixed). This has been implemented by changing client callsites to POST to `/api/create-campaign`.
2. Critical: Add migrations defining `create_media_partner_sub_user` and `admin_add_social_media` — migration `supabase/migrations/014_create_missing_rpcs.sql` was added to this repo.
3. High: Reconcile `partners` schema differences and regenerate TypeScript DB types.
4. After fixes: run integration tests and exercise onboarding flow end-to-end in staging.

Files generated:

- `supabase_metadata/integrity_matrix.csv`
- `supabase_metadata/rls_vs_code_matrix.csv`
- `supabase_metadata/integrity_report.json`

---

## Post-Remediation Status

- Actions performed (2026-01-04):

  - Added migration `supabase/migrations/014_create_missing_rpcs.sql` which defines `create_media_partner_sub_user` and `admin_add_social_media` as idempotent, SECURITY DEFINER functions and grants execute to `authenticated` and `service_role`.
  - Patched frontend callsites that performed direct `.insert('campaigns')` to POST to `/api/create-campaign` instead.
  - Scaffolded server-side handler `src/server/createCampaignHandler.ts` which calls the `create_campaign` RPC using `SUPABASE_SERVICE_ROLE_KEY` (must be run only on server).

- Remaining verification steps (manual / deploy-time):
  1. Deploy and run migration `014_create_missing_rpcs.sql` against the canonical MCP database (or apply via your migration runner). This will remove the "missing RPC" failures.
  2. Regenerate TypeScript types from the canonical DB after migrations are applied:

```
npx supabase gen types typescript --schema public > src/types/database.types.ts
```

3. Run integration tests in staging to validate onboarding and campaign creation flows.

- Current status summary:
  - RPC drift issues for `create_media_partner_sub_user` and `admin_add_social_media`: MIGRATION FILES ADDED (pending apply).
  - Frontend direct `campaigns` inserts: REPLACED with backend API call (requires server wiring / deployment).
  - Type drift for `partners` onboarding fields: NOT YET RESOLVED — requires canonical schema decision and types regeneration.

All changes are persisted under `supabase_metadata/` and `supabase/migrations/` in this repository.

# Integrity Report — Supabase vs Workspace

Date: 2026-01-04

## Sections

- Section A: Canonical Supabase Inventory
- Section B: Workspace DB Consumers
- Section C: RPC Verification (hard requirement)
- Section D: RLS × Code Alignment (SECTION F truth table follows)
- Section E: Type System Audit
- Section F: RLS vs Code Execution Truth Table

---

## Section A — Canonical Supabase Inventory

- Sources inspected (repo):
  - `final_database_schema.sql` (rows/definitions)
  - `sqooli_partner_full_database_details.sql` (detailed schema + functions)
  - `scripts/005_create_campaign_rpc_and_rls.sql` (create_campaign RPC + RLS policies)
  - `supabase/migrations/010_create_campaign_views_rpc.sql` (alternate rpc name `rpc_create_campaign`)

Notes: repository contains multiple schema sources. There is a disagreement for `partners` columns (see Section E).

---

## Section B — Workspace DB Consumers

- `.rpc()` usages located:

  - `src/utils/completeUserProfile.ts` — calls `create_user_profile` (line 66)
  - `src/lib/subUserService.ts` — calls `create_media_partner_sub_user` (line 44)
  - `src/lib/socialMediaService.ts` — calls `admin_add_social_media` (line 104)
  - `src/lib/campaignRPC.ts` — calls `create_campaign` (line 83)

- `.insert|.update|.delete` write callsites found across `src/` (examples):
  - `src/components/common/CreateCampaign.tsx` — `.insert('campaigns')` (line 236)
  - `src/components/CreateCampaign.tsx` — `.insert('campaigns')` (line 184)
  - `src/utils/handleCreateUser.ts` — `.from('users').insert(...)` (line 66)
  - `src/lib/supabaseClient.ts` — multiple `.insert` calls for `partners`, `users`, `campaigns` (lines 37,60,77)

---

## Section C — RPC Verification (per hard requirement)

Summary of `.rpc()` cross-checks:

- `create_campaign`

  - Found in repo: `scripts/005_create_campaign_rpc_and_rls.sql` (CREATE OR REPLACE FUNCTION public.create_campaign(...)) — confirmed. (See SQL in repo)
  - Called in code: `src/lib/campaignRPC.ts:83` — confirmed call. Argument names and order match the migration's parameter list (p_partner_id, p_user_id, p_program_id, p_channel_id, p_subchannel, p_name, p_description, p_target_signups, p_duration_start, p_duration_end). Return type: SETOF campaigns — matches code expectation of an array/result.
  - Status: VERIFIED (repo-defined) — ensure backend `service_role` calls only.

- `create_user_profile`

  - Found in repo: `final_database_schema.sql` (CREATE OR REPLACE FUNCTION public.create_user_profile(...)) — confirmed (parameters: p_auth_id UUID, p_email TEXT, p_full_name TEXT, p_phone TEXT, p_username TEXT DEFAULT NULL). Returns TABLE with id, auth_id, email, full_name, phone, username, role.
  - Called in code: `src/utils/completeUserProfile.ts:66` — parameters passed appear to match; verify that `auth.uid()` usage on DB side aligns with client code providing `p_auth_id`.
  - Status: VERIFIED (repo-defined). Validate that callers pass `p_auth_id` equal to the logged-in auth ID.

- `create_media_partner_sub_user`

  - Found in repo: NO (no matching SQL/migration).
  - Called in code: `src/lib/subUserService.ts:44` — uses parameter names `p_email`, `p_full_name`, `p_phone`, `p_username` and expects returned `user_id` and `email`.
  - Status: MISSING IN REPO — classify as MIGRATION NOT APPLIED (CRITICAL). Next action: add migration that defines this RPC with SECURITY DEFINER.

- `admin_add_social_media`
  - Found in repo: NO (no matching SQL/migration).
  - Called in code: `src/lib/socialMediaService.ts:104` — passes `p_platform`, `p_handle`, `p_url`, `p_metadata`.
  - Status: MISSING IN REPO — classify as MIGRATION NOT APPLIED (CRITICAL). Next action: add migration.

No RPC remain assumed. For missing RPCs, either add migrations or remove/replace callsites.

---

## Section D — RLS × CODE ALIGNMENT

Key RLS policies extracted (representative):

- `scripts/005_create_campaign_rpc_and_rls.sql` defines (campaigns):
  - `prevent_direct_insert` FOR INSERT WITH CHECK (false)
  - `select_own_campaigns` FOR SELECT USING (partners/user matching logic)
  - `update_own_campaigns` FOR UPDATE ...
  - `delete_own_campaigns` FOR DELETE ...

Analysis for `.insert/.update/.delete` callsites:

- Any client call performing `.insert('campaigns')` (CreateCampaign components) will be BLOCKED_AT_RUNTIME by `prevent_direct_insert` (policy present at `scripts/005_create_campaign_rpc_and_rls.sql` line 121).
- Updates and deletes on campaigns in UI (CampaignDetails) are allowed if user's partner ownership maps to `auth.uid()` per `update_own_campaigns`/`delete_own_campaigns` — verify that frontend authority context sets `userId` or uses auth to call RPCs/updates.

SECTION F (complete truth table) follows below.

---

## Section E — Type System Audit (DB ↔ TS)

- Source TS types: `src/types/database.types.ts` (auto-generated file)
- Observed mismatches (representative):
  - `partners` onboarding flags: code expects `wallet_setup_completed`, `onboarding_completed`, `onboarding_completed_at`, `wallet_setup_completed_at`, `onboarding_steps_skipped`, `onboarding_metadata` in several files (e.g., `src/utils/verifyAuthData.ts`, `src/components/layout/Sidebar.tsx`) but `src/types/database.types.ts` does not define these fields on `partners.Row`.
    - Severity: HIGH (Missing required DB fields in TS → HIGH)
    - Cause: repo contains conflicting schema artifacts (`final_database_schema.sql` vs `sqooli_partner_full_database_details.sql`). Determine canonical migration source, update migrations, then regenerate TS types.
  - `campaigns` fields: TS uses `target_amount/current_amount` while `create_campaign` RPC and migrations use `target_signups` and duration fields; check domain mismatch and align naming and types.
    - Severity: HIGH if production uses different field semantics.

Fix actions (Type audit):

1. Decide canonical schema (prefer committed migration SQL in `supabase/migrations` or `scripts/` directory).
2. Add or update migrations to reflect intended schema (including onboarding flags in `partners` if desired).
3. Regenerate TS types: `npx supabase gen types typescript --schema public > src/types/database.types.ts`.
4. Run static type checks / tests and verify runtime flows.

---

## Section F — RLS vs CODE EXECUTION TRUTH TABLE

Table: `campaigns` (policy excerpts and code callsites)

- Policy: `prevent_direct_insert` (scripts/005_create_campaign_rpc_and_rls.sql#L121)

  - Effect: Client INSERT denied (WITH CHECK (false)).
  - Code callsites:
    - `src/components/common/CreateCampaign.tsx:236` — `.insert('campaigns')` → DECISION: BLOCKED_AT_RUNTIME
    - `src/components/CreateCampaign.tsx:184` — `.insert('campaigns')` → DECISION: BLOCKED_AT_RUNTIME
  - Fix: Replace these callsites to call a backend endpoint that invokes `create_campaign` RPC (see Section C preferred fix).

- Policy: `update_own_campaigns` / `delete_own_campaigns` (scripts/005_create_campaign_rpc_and_rls.sql)
  - Effect: allows UPDATE/DELETE for partner owners (auth.uid() logic present).
  - Code callsites:
    - `src/components/CampaignDetails.tsx:160` — `.update({ status: 'expired' })` → DECISION: POLICY_DEPENDENT (allowed if user is owner)
  - Fix: Ensure client only attempts updates when the UI knows the current user owns the partner or route calls through a secured backend that enforces ownership.

---

## Final Notes & Next Steps (short)

1. Critical: Replace frontend direct campaign inserts with backend RPC path immediately (or temporarily disable campaign creation in client until fixed).
2. Critical: Add migrations defining `create_media_partner_sub_user` and `admin_add_social_media` or confirm they exist in MCP and add diffs into repo (if present in MCP only, treat as SCHEMA DRIFT and export to migrations).
3. High: Reconcile `partners` schema differences and regenerate TypeScript DB types.
4. After fixes: run integration tests and exercise onboarding flow end-to-end in staging.

Files generated:

- `supabase_metadata/integrity_matrix.csv`
- `supabase_metadata/rls_vs_code_matrix.csv`
- `supabase_metadata/integrity_report.json`
