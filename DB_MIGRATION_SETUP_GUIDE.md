# Database Migration & RPC Setup Instructions

## Summary
You have created a temporary `temp_migrator` user with necessary DB privileges. Follow these steps to:
1. Run the migration SQL to add `channels` table and campaign columns.
2. Create the `create_campaign` RPC function and RLS policies.
3. Test the integration.
4. Revoke temporary access.

---

## Step 1: Run Migration SQL (004)

Run the migration to add `pricing` to `programs`, create `channels` table, and add campaign columns.

### Option A: Supabase SQL Editor (easiest)
- Open Supabase Dashboard > SQL > New query
- Copy the contents of `scripts/004_add_channels_and_campaign_fields.sql`
- Paste and click "Run"
- Verify success: "No rows returned" is expected for DDL statements.

### Option B: psql CLI
```bash
psql "postgresql://temp_migrator:STRONG_TEMP_PASSWORD@db.heqsfgmrosuupxahdtda.supabase.co:5432/postgres" \
  -f scripts/004_add_channels_and_campaign_fields.sql
```

Expected output: No errors, no rows returned.

---

## Step 2: Create RPC Function & RLS Policies (005)

Run the RPC function and RLS setup.

### Option A: Supabase SQL Editor (easiest)
- Open Supabase Dashboard > SQL > New query
- Copy the contents of `scripts/005_create_campaign_rpc_and_rls.sql`
- Paste and click "Run"
- Verify success: no errors.

### Option B: psql CLI
```bash
psql "postgresql://temp_migrator:STRONG_TEMP_PASSWORD@db.heqsfgmrosuupxahdtda.supabase.co:5432/postgres" \
  -f scripts/005_create_campaign_rpc_and_rls.sql
```

Expected output: No errors, no rows returned.

What this creates:
- `public.create_campaign()` RPC function with full validation.
- RLS policies to prevent direct client inserts.
- RLS policies allowing authenticated users to read/update/delete their own campaigns.

---

## Step 3: Test the RPC

### Verify the function exists:
```sql
-- Run in Supabase SQL editor or psql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'create_campaign';
```
Expected: One row with `create_campaign`.

### Insert a test channel (if needed):
```sql
INSERT INTO channels (partner_id, name, subchannels, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Replace with a real partner_id from your DB
  'Test Channel',
  '["Facebook", "Instagram"]'::jsonb,
  now(),
  now()
);
```

### Call the RPC via psql:
```bash
psql "postgresql://temp_migrator:STRONG_TEMP_PASSWORD@db.heqsfgmrosuupxahdtda.supabase.co:5432/postgres" \
  -c "SELECT * FROM create_campaign(
    '00000000-0000-0000-0000-000000000001'::uuid,  -- partner_id
    '00000000-0000-0000-0000-000000000002'::uuid,  -- user_id (optional)
    NULL::uuid,                                      -- program_id (optional)
    NULL::uuid,                                      -- channel_id (optional)
    'Facebook'::text,                               -- subchannel (optional)
    'Test Campaign'::text,                          -- name
    'Test campaign description'::text,             -- description
    1000::integer,                                  -- target_signups
    '2026-02-01'::date,                             -- duration_start
    '2026-02-28'::date                              -- duration_end
  );"
```

Expected: One row with the created campaign.

---

## Step 4: Update Frontend to Use RPC

The CreateCampaign component currently inserts directly. Update it to call the RPC via a backend endpoint.

### Option A: Use the provided TypeScript helper
File: `src/lib/campaignRPC.ts` provides `createCampaignRPC()`.

Example usage in a backend API route (e.g., `app/api/campaigns/create.ts`):
```typescript
import { createClient } from "@supabase/supabase-js";
import { createCampaignRPC } from "@/lib/campaignRPC";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key, backend only
);

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const campaign = await createCampaignRPC(supabase, {
      partnerId: body.partnerId,
      userId: body.userId,
      programId: body.programId,
      channelId: body.channelId,
      subchannel: body.subchannel,
      name: body.name,
      description: body.description,
      targetSignups: body.targetSignups,
      durationStart: body.durationStart,
      durationEnd: body.durationEnd,
    });

    return Response.json({ success: true, campaign }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: msg }, { status: 400 });
  }
}
```

Then update CreateCampaign component to POST to this endpoint instead of calling `supabase.from('campaigns').insert()`.

### Option B: Call RPC directly from client (less secure, not recommended)
If you must call from client, ensure:
- You have a specific RLS policy allowing authenticated users to call the RPC.
- You pass the authenticated user's JWT (automatic with Supabase client initialized with anon key).
- You validate inputs client-side (already done in CreateCampaign).

---

## Step 5: Verify RLS is working

### Test 1: Prevent direct insert from client
```typescript
// This should FAIL with "new row violates row-level security policy"
const { error } = await supabase
  .from('campaigns')
  .insert({
    partner_id: 'some-uuid',
    name: 'Test',
    description: 'Test',
    target_signups: 100,
    duration_start: '2026-02-01',
    duration_end: '2026-02-28',
  });

console.log(error); // Should show RLS policy error
```

### Test 2: Verify RPC works from backend
Use the test in Step 3 above.

---

## Step 6: Revoke Temporary Access

After you confirm everything works, revoke the `temp_migrator` user to secure your DB.

```sql
-- Run as postgres superuser (in Supabase SQL editor or psql with main user)
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM temp_migrator;
REVOKE USAGE ON SCHEMA public FROM temp_migrator;
REVOKE CONNECT ON DATABASE postgres FROM temp_migrator;
DROP ROLE IF EXISTS temp_migrator;
```

Then verify it's gone:
```sql
SELECT * FROM pg_user WHERE usename = 'temp_migrator';
-- Should return 0 rows
```

---

## Troubleshooting

### Error: "function create_campaign(...) does not exist"
- Ensure Step 2 completed successfully (check the SQL editor output).
- Verify the function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'create_campaign';`

### Error: "new row violates row-level security policy"
- You're trying to insert directly into `campaigns`. This is expected; use the RPC instead (Step 4).

### Error: "permission denied for schema public"
- The `temp_migrator` user doesn't have USAGE on public schema.
- Grant it: `GRANT USAGE ON SCHEMA public TO temp_migrator;`

### Error: "relation channels does not exist"
- Step 1 (migration 004) didn't run successfully.
- Re-run the migration and check for errors.

---

## Next Steps

1. Run migrations 004 and 005 using Supabase SQL editor or psql.
2. Test the RPC as shown in Step 3.
3. Create a backend API endpoint that calls `createCampaignRPC()`.
4. Update CreateCampaign component to call the backend endpoint instead of direct insert.
5. Revoke temporary access when confirmed working.
6. (Optional) Monitor audit logs to confirm campaigns are being created correctly.

---

## Questions?

- For RPC details, see `scripts/005_create_campaign_rpc_and_rls.sql` and `src/lib/campaignRPC.ts`.
- For RLS policy details, see the same SQL file.
- For CreateCampaign component updates, refer to the component file and the API endpoint example above.
