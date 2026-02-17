# Program → Campaign Integration Proposal

**Generated:** January 2, 2026
**Context:** Supabase (Postgres + RLS + RPC + Views). Minimal disruption; reuse existing tables (programs, campaigns, partners, users, channels, transactions, wallets, withdrawals).

---

# Executive Summary

Programs are platform-owned, pre-created entities. Campaigns are link-first, partner-owned artifacts: a campaign is defined by its canonical link (the system-issued URL), plus metadata and statistics. This proposal confirms the current schema supports that model and prescribes a minimal-cost integration using SQL views and a small set of RPCs (the canonical RPCs now enforce deterministic link issuance) to enforce ownership, compute campaign metrics, and preserve a read-only programs model for partners. Use the existing program named "Sqooli Launch" for validation and testing.

**What changed:** The proposal is updated to require system-generated campaign links and to treat campaigns as link-first objects. RPC semantics now guarantee a link is created atomically during campaign creation; QR codes are derived from that link at the frontend.

---

# Current System Assessment

- Programs: Present as platform records (created_by = platform/super_admin). Partners must not create/modify programs.
- Campaigns: Exist and reference `partner_id` and `program_id` (one-to-many relationship). Campaigns store per-campaign stats.
- Partners & Users: `partners` table contains `partner_type`, `access_level`, and `commission_rate`. `users` include `partner_role`.
- Existing artifacts: `sqooli_partner_full_database_details.sql`, `PARTNER_TYPE_VALIDATION_REPORT.md`, and `src/types/partner.types.ts` show clear role/permission mapping.

Conclusion: No schema rewrite required. The existing schema supports the authoritative Program→Campaign→Statistics model.

---

# Program Ownership & Role Responsibilities

- Programs: Created/managed by `super_admin` only. Partners have read-only access to program metadata.
- Media Partners (role `media_partner` / `media_manager`): Can create campaigns bound to an existing `program_id`, view their own campaign stats, and create channels (if role allows). They cannot insert/update/delete programs.
- Super Admins: Full access across tables (no RLS constraint).

Reference test program: `Sqooli Launch` (use for queries and example SQL).

---

## Campaign Definition (Link-First)

Definition: A campaign is the canonical distribution link plus metadata and campaign-scoped statistics. The campaign cannot exist without a system-generated public link. The system is responsible for:

- Generating the canonical campaign URL at creation time (deterministic and reproducible from the campaign record, e.g. based on `campaign.id`).
- Persisting the canonical link (stored in `campaigns.link_url` or a generated/computed column) so that the link is immutable from partner input.
- Rendering QR codes from the canonical link on the frontend; QR images need not be persisted in the database.
- Treating an expired or revoked link as an inactive campaign (the `revoked` or `active` flags drive visibility).

Implications:

- Any campaign creation flow must return a valid `link_url` as part of the created record. Creation must fail if the system cannot produce this link.
- The link is unique to the campaign (1:1 relationship). No program-level or global redirect objects are used for campaign links.
- Partners may request creation (initiate), but the backend/RPC finalizes the artifact and performs link issuance.

---

# Proposed Integration Approach (Minimal, Low-Cost)

Principles:
- Prefer read-only SQL views for aggregated metrics and safe JOINs for nested selects.
- Use Postgres RPCs (stored procedures) for controlled writes where logic or additional checks are required.
- Only use Edge Functions when a server-side service role call is unavoidable (e.g., third-party payment webhooks); avoid them for campaign creation.
- Avoid new tables; use materialized views only if performance testing shows need.

Core pieces:
1. Read-only SQL view: `vw_programs_public` — program metadata safe for partner read.
2. Campaign metrics view: `vw_campaign_stats` — campaign-level aggregates (engagements, purchases, revenue, conversions).
3. RPC: `rpc_create_campaign()` — encapsulates campaign creation with server-side defaulting and validation (optional if RLS allows direct insert).
4. Lightweight policy changes: add targeted RLS policies for `campaigns` (allow partner inserts when partner_id = auth.uid()) and restrict `programs` writes to admins only.

Rationale: Views are cheap (zero runtime compute if simple) and require no Supabase credits; RPCs run inside DB and are inexpensive. Edge Functions reserved for external integrations.

---

# Campaign Statistics Architecture

Goals:
- All metrics are campaign-scoped.
- No duplication of derived data in source tables.
- Compute-on-read via views or RPCs; materialize only if performance dictates.

Suggested views (examples):

1) Campaign stats view (single-row per campaign)

```sql
CREATE VIEW public.vw_campaign_stats AS
SELECT
  c.id                 AS campaign_id,
  c.program_id,
  c.partner_id,
  c.name,
  COUNT(e.id) FILTER (WHERE e.type = 'engagement') AS engagements,
  COUNT(t.id) FILTER (WHERE t.type = 'purchase') AS purchases,
  SUM(t.amount) FILTER (WHERE t.type = 'purchase') AS revenue,
  MAX(t.created_at) AS last_purchase_at
FROM campaigns c
LEFT JOIN engagements e ON e.campaign_id = c.id
LEFT JOIN transactions t ON t.campaign_id = c.id
GROUP BY c.id;
```

2) Program → Campaign nesting compatible with Supabase `select()`

```sql
CREATE VIEW public.vw_programs_with_campaigns AS
SELECT p.*, json_agg(c_row) FILTER (WHERE c_row IS NOT NULL) AS campaigns
FROM programs p
LEFT JOIN (
  SELECT c.*, (
    SELECT row_to_json(s) FROM (
      SELECT engagements, purchases, revenue FROM vw_campaign_stats s WHERE s.campaign_id = c.id
    ) s
  ) as stats
  FROM campaigns c
) c_row ON c_row.program_id = p.id
GROUP BY p.id;
```

This view structure plays nicely with Supabase's nested selection patterns and keeps program records free of aggregated metrics.

RPC examples (create/validate campaigns):

```sql
CREATE OR REPLACE FUNCTION public.rpc_create_campaign(
  p_name text,
  p_program_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS campaigns AS $$
DECLARE
  new_row campaigns%ROWTYPE;
  canonical_base text := 'https://sqooli.app/c/'; -- change to your canonical domain
BEGIN
  -- Validate program exists & is active
  PERFORM 1 FROM programs WHERE id = p_program_id AND revoked = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program not found or not active';
  END IF;

  -- Insert campaign (partner_id is derived from auth.uid()) and return full row
  INSERT INTO campaigns (name, program_id, partner_id, metadata)
  VALUES (p_name, p_program_id, auth.uid(), p_metadata)
  RETURNING * INTO new_row;

  -- Deterministic canonical link generation based on campaign id
  -- Use a canonical path that includes the UUID; this is deterministic and reproducible.
  UPDATE campaigns
  SET link_url = canonical_base || new_row.id::text
  WHERE id = new_row.id;

  -- Re-read and ensure link exists; fail the transaction if link missing
  SELECT * INTO new_row FROM campaigns WHERE id = new_row.id;
  IF new_row.link_url IS NULL OR length(trim(new_row.link_url)) = 0 THEN
    RAISE EXCEPTION 'Failed to generate campaign link';
  END IF;

  RETURN new_row;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

Notes: `SECURITY DEFINER` allows controlled inserts while the function checks program validity. Use only if RLS prevents direct inserts or if you want centralized validation.

---

# Security & RLS Considerations (High-Level)

Principles (keep simple):
- Programs: `UPDATE/INSERT/DELETE` restricted to `super_admin` only.
- Campaigns: `INSERT` allowed when `campaign.partner_id = auth.uid()`; `SELECT` allowed if `campaign.partner_id = auth.uid()` or user is `super_admin`. `UPDATE` restricted to owner or admin. `DELETE` disallowed except admin.
- Public campaigns: Public users may `SELECT` only campaigns with `revoked = false AND active = true` and limited columns.

Example RLS rules (pseudocode):

- Programs (write-lock to admins):
  - ENABLE RLS ON programs;
  - CREATE POLICY "admins_manage_programs" FOR ALL USING (auth.role = 'super_admin');

- Campaigns (owner-only writes, admin override):
  - ENABLE RLS ON campaigns;
  - CREATE POLICY "partner_insert_own_campaigns" FOR INSERT WITH CHECK (partner_id = auth.uid());
  - CREATE POLICY "partner_select_own_campaigns" FOR SELECT USING (partner_id = auth.uid() OR auth.role = 'super_admin');
  - CREATE POLICY "partner_update_own_campaigns" FOR UPDATE USING (partner_id = auth.uid() OR auth.role = 'super_admin') WITH CHECK (partner_id = auth.uid());
  - CREATE POLICY "no_delete_for_partners" FOR DELETE USING (auth.role = 'super_admin');

Keep policies minimal and test with the `Sqooli Launch` program and a test `media_manager` user.

---

# Incremental Implementation Plan

Phase 1 — Validation (low-risk, read-only)
- Step 1.1: Validate `programs` records and confirm `Sqooli Launch` exists.
- Step 1.2: Create `vw_programs_public` and `vw_campaign_stats` as read-only views.
- Step 1.3: Update frontend / API to use views for program/campaign lists; test with a media partner account.

Phase 2 — Read-only enhancements
- Step 2.1: Expose `vw_programs_with_campaigns` for nested selects used by dashboard pages.
- Step 2.2: Add docs and example Supabase `select()` calls for frontend teams.

Phase 3 — Write-path enforcement (minimal disruption)
- Step 3.1: If RLS already permits correct behavior, skip; else add targeted `campaigns` RLS policies allowing partner inserts only for own `partner_id` and restricting `programs` writes to `super_admin`.
- Step 3.2: Optionally create `rpc_create_campaign()` as `SECURITY DEFINER` to centralize validations.
- Step 3.3: Run end-to-end tests with a `media_manager` test account.

Phase 4 — Optional optimizations
- Step 4.1: Add materialized views for heavy-reporting endpoints if performance dictates.
- Step 4.2: Implement lightweight caching strategies in backend if needed.

Rollback: Each phase introduces read-only components first; RLS changes are reversible and should be rolled back by removing policies.

---

# Cost & Risk Considerations

Cost-minimizing choices:
- Views and RPCs run inside the database and incur negligible Supabase function costs compared to Edge Functions.
- No new tables means no data migration cost.
- Materialized views only if actual performance tests indicate need.

Risks & Mitigations:
- Incorrect RLS can block valid flows — mitigate by testing with a `media_manager` test account and the `Sqooli Launch` program in a staging environment first.
- Performance impact of complex aggregation views — mitigate by measuring query times and switching to materialized views for slow endpoints.

---

# Appendix: Example frontend `select()` patterns

- Program with nested campaigns and campaign stats (using `vw_programs_with_campaigns`):

```js
const { data } = await supabase
  .from('vw_programs_with_campaigns')
  .select('*, campaigns(*)')
  .eq('slug', 'sqooli-launch');
```

- Campaign list for current partner (client-side):

```js
const { data } = await supabase
  .from('campaigns')
  .select('id,name,program_id')
  .eq('partner_id', supabase.auth.getUser().id);
```

---

# Conclusion

This proposal preserves the canonical Program→Campaign ownership model using existing tables and relationships. It favors SQL views and RPCs for low-cost, maintainable integrations while keeping RLS rules minimal and focused. Follow the incremental plan (validation → read-only views → RLS enforcement) and use `Sqooli Launch` as the test program for all verifications.

If you want, I can now:
- Create the SQL view and RPC migration files under `supabase/migrations/` (low-cost changes), or
- Produce example RLS policy SQL snippets ready for staging testing.

Which of those should I do next?