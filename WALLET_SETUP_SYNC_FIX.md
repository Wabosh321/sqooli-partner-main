# Wallet Setup Completion Sync Fix

## Problem
When a user successfully created a wallet in the `wallets` table, the `partners.wallet_setup_completed` flag was **NOT** being automatically updated to `true`. This caused the onboarding UI to not show Step 1 (Setup Wallet) as completed, even though a wallet record existed in the database.

**Example:**
- Wallet created: `wallets` table has new record with `partner_id = '8d2546a1-13ec-4afe-9dd3-48da2b8c6cf6'`
- Partner record: Still shows `wallet_setup_completed = false` (not synced)
- Result: Frontend onboarding form doesn't tick Step 1 as complete

## Solution: Three-Part Fix

### 1. PostgreSQL Trigger (Automatic Database Sync)
**File:** `supabase/migrations/20260101_auto_update_wallet_setup_flag.sql`

Creates an `AFTER INSERT` trigger on the `wallets` table that:
- Automatically sets `partners.wallet_setup_completed = true` when a wallet is created
- Sets `wallet_setup_completed_at` timestamp
- Backsups all existing wallets (sets flag for partners that have wallets)

**Benefit:** Database-level automation ensures sync happens immediately, without frontend intervention.

### 2. Callback in Wallet Setup Dialog
**File:** `src/components/common/WalletSetUp.tsx` and `src/components/WalletSetUp.tsx`

Added optional `onWalletCreated` callback that:
- Triggers after wallet creation succeeds
- Waits 500ms for database trigger to execute
- Calls parent component's refetch logic to pull updated partner data
- Ensures frontend state reflects the database update

**Changes:**
```typescript
interface WalletSetupDialogProps {
  // ... existing props
  onWalletCreated?: () => void | Promise<void>; // NEW
}
```

After wallet creation:
```typescript
// Wait for database trigger to execute
await new Promise(resolve => setTimeout(resolve, 500));

// Call refetch callback
if (onWalletCreated) {
  await onWalletCreated();
}
```

### 3. Parent Component Integration
**File:** `src/pages/Onboarding.tsx`

Added `handleWalletCreated` function that:
- Refetches local wallet/campaign data
- Refetches auth context to update partner state
- Ensures UI reflects the synced `wallet_setup_completed` flag

**Changes:**
```typescript
const handleWalletCreated = async () => {
  console.log("💰 Wallet created successfully, refetching data...");
  await fetchData();
  if (refetch) {
    await refetch();
  }
};
```

Passed callback to dialog:
```typescript
<WalletSetupDialog
  // ... other props
  onWalletCreated={handleWalletCreated}
/>
```

## Implementation Sequence

When user completes wallet setup:

```
1. User fills out wallet form and clicks "Save"
   ↓
2. Frontend creates wallet in wallets table
   ↓
3. PostgreSQL trigger fires automatically
   → Sets partners.wallet_setup_completed = true
   → Sets wallet_setup_completed_at timestamp
   ↓
4. Frontend waits 500ms for trigger execution
   ↓
5. Frontend calls onWalletCreated callback
   ↓
6. Parent component refetches partner data
   → Gets updated wallet_setup_completed = true
   ↓
7. UI re-renders
   → Step 1 now shows green checkmark ✓
   → Step 2 becomes active (blue circle)
```

## Database Schema
- **wallets.partner_id** → Foreign key to **partners.id**
- **partners.wallet_setup_completed** → Boolean (default: false)
- **partners.wallet_setup_completed_at** → Timestamp (nullable)

## Testing Checklist

- [ ] Apply migration: `supabase/migrations/20260101_auto_update_wallet_setup_flag.sql`
- [ ] Create a new partner/user
- [ ] Complete wallet setup in onboarding form
- [ ] Verify in database that `partners.wallet_setup_completed = true` (trigger executed)
- [ ] Verify frontend shows Step 1 with green checkmark ✓
- [ ] Verify Step 2 becomes active (blue circle with "2")
- [ ] Check browser console for "💰 Wallet created successfully, refetching data..." log

## Related Migrations

This is part of a series of sync migrations:
- **20260101_sync_partner_to_user.sql** - Auto-syncs `users.partner_id` when partner created
- **20260101_auto_update_wallet_setup_flag.sql** - Auto-syncs `partners.wallet_setup_completed` when wallet created
- Future: Campaign creation, two-factor, social media (same pattern)

## Key Points

1. **Database triggers handle sync** - No need to rely on frontend API calls
2. **Frontend confirmation layer** - Callback ensures UI is updated after DB sync
3. **Graceful timeout** - 500ms allows trigger execution on slower connections
4. **Backward compatible** - Works with existing wallet records via backfill query
5. **Extensible pattern** - Can be applied to other onboarding flags (campaign, 2FA, etc.)

## Potential Issues & Resolution

| Issue | Cause | Solution |
|-------|-------|----------|
| Step 1 still not checked after wallet creation | Trigger not applied to DB | Apply migration to Supabase |
| Timeout seems too long | Network is fast | Can reduce 500ms to 200ms if needed |
| Multiple wallets per partner | Design allows this | Trigger only fires on first insert, `wallet_setup_completed` stays true |
| Old wallets not marked as complete | Migration not run | Backfill query in migration handles this |

## Files Modified

1. **supabase/migrations/20260101_auto_update_wallet_setup_flag.sql** (NEW)
   - PostgreSQL trigger function and trigger definition
   - Backfill query for existing wallets

2. **src/components/common/WalletSetUp.tsx**
   - Added `onWalletCreated` prop
   - Added 500ms delay and callback invocation

3. **src/components/WalletSetUp.tsx**
   - Same changes as above (duplicate file)

4. **src/pages/Onboarding.tsx**
   - Added `handleWalletCreated` function
   - Passed callback to `WalletSetupDialog`

## Next Steps

1. Apply the migration to Supabase
2. Test wallet creation in onboarding flow
3. Apply same pattern to campaign creation (auto-set `campaign_created = true`)
4. Apply same pattern to two-factor and social media steps
