# Backend Integration Summary

## What's Been Set Up

You now have **four new files** ready to connect your frontend to Supabase:

### 1. **DB Migration Files** (need to run these in Supabase)
- `scripts/004_add_channels_and_campaign_fields.sql` - Adds missing table/columns
- `scripts/005_create_campaign_rpc_and_rls.sql` - Creates secure RPC function and RLS policies

### 2. **Backend Helper** (ready to use)
- `src/lib/campaignRPC.ts` - TypeScript function to safely call the RPC from your backend

### 3. **Setup Instructions** (step-by-step guide)
- `DB_MIGRATION_SETUP_GUIDE.md` - Complete walkthrough with commands and troubleshooting

---

## Quick Start (3 Steps)

### Step 1: Run the Migrations
Open Supabase SQL editor and run both SQL files in order:
1. First: `scripts/004_add_channels_and_campaign_fields.sql`
2. Then: `scripts/005_create_campaign_rpc_and_rls.sql`

**Time to execute**: ~1-2 seconds total

### Step 2: Create a Backend API Endpoint
Create a new file `app/api/campaigns/create.ts` (or similar) that:
- Imports `createCampaignRPC` from `src/lib/campaignRPC.ts`
- Uses the Supabase service role key (backend only)
- Calls the RPC function with validated parameters
- Returns the created campaign to the frontend

**Example in the guide** shows exactly how to do this.

### Step 3: Update CreateCampaign Component
Change from:
```typescript
await supabase.from('campaigns').insert({...})
```

To:
```typescript
await fetch('/api/campaigns/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...campaign data...})
})
```

---

## What This Provides

| Item | Purpose |
|------|---------|
| `channels` table | Stores marketing channels (Facebook, Instagram, etc.) |
| `programs.pricing` field | Stores pricing information for programs |
| `campaigns.program_id`, `.channel_id`, `.subchannel`, `.target_signups`, `.duration_start`, `.duration_end` | Campaign-specific data your frontend expects |
| `create_campaign()` RPC | Server-side validation + creation (prevents bad data) |
| RLS policies | Blocks direct client inserts; forces use of RPC |
| `createCampaignRPC()` helper | Typed function to call RPC from backend |

---

## Security Model

**Before**: Frontend could insert any campaign directly (security risk).

**After**:
1. Frontend sends campaign data to **backend endpoint** (not directly to DB).
2. Backend endpoint uses **service role key** (never exposed to client).
3. Backend calls **RPC function** which validates:
   - Partner exists
   - User has permission
   - Name/description not empty
   - Target signups > 0
   - Dates are valid (start < end)
   - Program/channel belong to the partner
4. RLS policies **block direct inserts** to campaigns table (only RPC can insert).
5. Users can only **read/update/delete their own partner's campaigns** (RLS enforces this).

**Result**: Secure, validated campaign creation with partner data isolation.

---

## Files Modified/Created in This Session

### Modified:
- `src/components/layout/Header.tsx` - Always show notification bell
- `src/components/common/NotificationDropDown.tsx` - Made partnerId optional
- `src/lib/modules/notificationsCRUD.ts` - Changed queries to use `partner_id`
- `src/components/common/CreateCampaign.tsx` - Normalize programs/channels naming
- `src/components/CreateCampaign.tsx` - Same normalization
- `src/lib/supabaseClient.ts` - Added `listChannels()` helper

### Created:
- `scripts/004_add_channels_and_campaign_fields.sql` - Schema migration
- `scripts/005_create_campaign_rpc_and_rls.sql` - RPC + RLS setup
- `src/lib/campaignRPC.ts` - TypeScript RPC helper
- `DB_MIGRATION_SETUP_GUIDE.md` - Setup instructions (this file)

---

## Next Actions

1. **Execute migrations** (5 min)
   - Run both SQL files in Supabase SQL editor
   - Verify no errors

2. **Create backend endpoint** (15 min)
   - Copy example from guide
   - Add to your API routes

3. **Update CreateCampaign** (10 min)
   - Change insert call to fetch endpoint
   - Test campaign creation

4. **Verify security** (5 min)
   - Try direct insert (should fail with RLS error)
   - Try via RPC (should succeed)

5. **Cleanup** (1 min)
   - Drop temp_migrator role in Supabase

**Total time**: ~45 minutes

---

## Support

If you hit any issues:
- Check the **Troubleshooting** section in `DB_MIGRATION_SETUP_GUIDE.md`
- Verify migrations ran successfully (check the channels table exists)
- Test the RPC function manually (steps in guide)
- Check browser console and backend logs for errors

---

## Your Temp DB User

Connection string (for running migrations):
```
postgresql://temp_migrator:STRONG_TEMP_PASSWORD@db.heqsfgmrosuupxahdtda.supabase.co:5432/postgres
```

**Important**: This user should be **dropped after migrations are verified** (step 6 in guide).

---

## Questions Before You Start?

The setup is complete and ready. You have:
- ✅ Migration files (004, 005)
- ✅ TypeScript helper (campaignRPC.ts)
- ✅ Temp DB user with minimal privileges
- ✅ Step-by-step guide with examples

You're ready to execute the migrations now.
