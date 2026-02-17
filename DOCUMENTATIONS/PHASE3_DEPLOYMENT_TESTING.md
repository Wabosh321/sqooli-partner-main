# Phase 3 Deployment & Testing Guide

**Last Updated:** January 29, 2025  
**Status:** Ready for Deployment  
**Estimated Time:** 30-45 minutes

---

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] Supabase project created and active
- [ ] `VITE_SUPABASE_URL` environment variable set
- [ ] `VITE_SUPABASE_ANON_KEY` environment variable set
- [ ] Node.js and npm/pnpm installed
- [ ] Access to Supabase SQL editor
- [ ] Backup of existing database (if applicable)
- [ ] Team notification sent

### Code Readiness

- [ ] All Phase 3 migration files present in `supabase/migrations/`
- [ ] Wallet service updated with Phase 3 methods
- [ ] Seed scripts present in `scripts/`
- [ ] Documentation files created
- [ ] No uncommitted changes in Git

---

## 🚀 Deployment Steps

### Step 1: Execute SQL Migrations (10 minutes)

Execute these migrations in order via Supabase SQL editor:

**1. Execute 005_phase3_tables.sql**

```bash
cat supabase/migrations/005_phase3_tables.sql
# Copy entire content and paste into Supabase SQL editor
# Run the query
```

Expected output:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
```

**Verification:**

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history');
```

Should return 4 rows.

---

**2. Execute 006_phase3_functions.sql**

```bash
cat supabase/migrations/006_phase3_functions.sql
# Copy entire content and paste into Supabase SQL editor
# Run the query
```

Expected output:

```
CREATE FUNCTION (for rpc_record_transaction)
CREATE FUNCTION (for rpc_request_withdrawal)
CREATE FUNCTION (for rpc_process_withdrawal)
CREATE FUNCTION (for trigger functions)
...
```

**Verification:**

```sql
SELECT proname FROM pg_proc
WHERE proname LIKE 'rpc_%' OR proname LIKE 'on_wallets_%';
```

Should return 9+ rows.

---

**3. Execute 007_phase3_policies.sql**

```bash
cat supabase/migrations/007_phase3_policies.sql
# Copy entire content and paste into Supabase SQL editor
# Run the query
```

Expected output:

```
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY
CREATE POLICY...
CREATE POLICY...
...
```

**Verification:**

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history');

SELECT tablename, count(*) as policy_count FROM pg_policies
WHERE tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history')
GROUP BY tablename;
```

Should return 15+ policies.

---

**4. Execute 008_phase3_indexes.sql**

```bash
cat supabase/migrations/008_phase3_indexes.sql
# Copy entire content and paste into Supabase SQL editor
# Run the query
```

Expected output:

```
CREATE INDEX
CREATE INDEX
...
(20+ indexes)
```

**Verification:**

```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history')
ORDER BY indexname;
```

Should return 20+ indexes.

---

### Step 2: Verify Migrations (5 minutes)

Run this comprehensive verification:

```sql
-- Verify all 4 tables created with correct columns
SELECT
  schemaname, tablename,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history')
ORDER BY tablename;

-- Expected results:
-- public | wallet_history        | 9
-- public | wallets               | 10
-- public | transactions          | 13
-- public | withdrawals           | 12

-- Verify RPC functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('rpc_record_transaction', 'rpc_request_withdrawal', 'rpc_process_withdrawal')
ORDER BY proname;

-- Verify RLS is enabled
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('wallets', 'transactions', 'withdrawals', 'wallet_history')
AND rowsecurity = true
ORDER BY tablename;

-- All 4 should return with rowsecurity = true
```

---

### Step 3: Seed Data (Optional, 10 minutes)

Run seed scripts to populate with test data:

**3a. Seed Wallets**

```bash
cd /path/to/project
npx tsx scripts/seed_wallets_from_json.ts
```

Expected output:

```
📊 Starting wallet migration: 15 records to process
✅ Batch inserted (records 0-10)
✅ Batch inserted (records 10-15)

📋 MIGRATION SUMMARY
==================================================
✅ Successfully created: 15
❌ Failed to create:     0
📊 Total processed:      15
✨ Status: SUCCESS
```

**Verification:**

```sql
SELECT COUNT(*) as wallet_count FROM wallets;
SELECT AVG(balance) as avg_balance, SUM(balance) as total_balance FROM wallets;
```

---

**3b. Seed Transactions**

```bash
npx tsx scripts/seed_transactions_from_json.ts
```

Expected output:

```
📊 Starting transaction migration: 50 records to process
🔍 Building wallet lookup map...
✅ Wallet map built: 15 wallets found
📤 Inserting 47 validated transactions in batches of 25...
✅ Batch inserted (records 0-25)
✅ Batch inserted (records 25-47)

📋 MIGRATION SUMMARY
==================================================
✅ Successfully created: 47
❌ Failed to create:     3
📊 Total processed:      50
✨ Status: PARTIAL_FAILURE
```

**Note:** Some transactions may fail if wallets don't exist (expected behavior)

**Verification:**

```sql
SELECT COUNT(*) as transaction_count FROM transactions;
SELECT COUNT(DISTINCT wallet_id) as wallets_with_transactions FROM transactions;
SELECT transaction_type, COUNT(*) FROM transactions GROUP BY transaction_type;
```

---

### Step 4: Test RPC Functions (5 minutes)

Test each RPC function in Supabase SQL editor:

**Test rpc_record_transaction**

```sql
-- Get a wallet ID first
SELECT id FROM wallets LIMIT 1;

-- Test recording a transaction (replace wallet_id, partner_id, user_id)
SELECT rpc_record_transaction(
  'WALLET_UUID_HERE',           -- p_wallet_id
  'PARTNER_UUID_HERE',          -- p_partner_id
  'USER_UUID_HERE',             -- p_user_id
  NULL,                         -- p_campaign_id
  'earnings',                   -- p_transaction_type
  1000,                         -- p_amount
  'Test transaction',           -- p_description
  'TEST-001-' || now()::text,   -- p_reference_number
  NULL                          -- p_metadata
);
```

Expected response:

```json
{
  "success": true,
  "transaction_id": "uuid",
  "new_balance": 126750.5,
  "message": "Transaction recorded successfully"
}
```

**Test rpc_request_withdrawal**

```sql
SELECT rpc_request_withdrawal(
  'WALLET_UUID_HERE',           -- p_wallet_id
  'PARTNER_UUID_HERE',          -- p_partner_id
  'USER_UUID_HERE',             -- p_user_id
  5000,                         -- p_amount
  'mpesa',                      -- p_method
  jsonb_build_object('phone_number', '254712345678')  -- p_details
);
```

Expected response:

```json
{
  "success": true,
  "withdrawal_id": "uuid",
  "available_balance": 121750.5
}
```

**Test rpc_process_withdrawal**

```sql
-- Get a withdrawal ID first
SELECT id FROM withdrawals WHERE status = 'pending' LIMIT 1;

-- Process it (replace withdrawal_id)
SELECT rpc_process_withdrawal(
  'WITHDRAWAL_UUID_HERE',    -- p_withdrawal_id
  'approved',                -- p_status
  'Approved by finance',     -- p_notes
  NULL                       -- p_mpesa_ref
);
```

Expected response:

```json
{
  "success": true,
  "withdrawal_status": "approved"
}
```

---

## 🧪 Testing

### Unit Tests

Create `src/__tests__/wallet.service.test.ts`:

```typescript
import { walletService } from "@/infrastructure/wallet/wallet.service";
import { supabase } from "@/lib/supabase";

describe("WalletService", () => {
  describe("recordTransaction", () => {
    it("should record transaction and update balance", async () => {
      const input = {
        walletId: "test-wallet-id",
        partnerId: "test-partner-id",
        userId: "test-user-id",
        transactionType: "earnings" as const,
        amount: 2500,
        description: "Test transaction",
      };

      const result = await walletService.recordTransaction(input);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.newBalance).toBeGreaterThan(0);
    });

    it("should reject negative amount", async () => {
      const input = {
        walletId: "test-wallet-id",
        partnerId: "test-partner-id",
        userId: "test-user-id",
        transactionType: "earnings" as const,
        amount: -1000,
        description: "Invalid transaction",
      };

      const result = await walletService.recordTransaction(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("fetchWalletBalance", () => {
    it("should return wallet balance", async () => {
      const balance = await walletService.fetchWalletBalance("test-partner-id");

      expect(balance).toBeDefined();
      expect(balance?.balance).toBeGreaterThanOrEqual(0);
      expect(balance?.pending).toBeGreaterThanOrEqual(0);
    });
  });

  describe("subscribeToWalletChanges", () => {
    it("should subscribe and unsubscribe", async () => {
      const callback = jest.fn();
      const unsubscribe = walletService.subscribeToWalletChanges(
        "test-partner-id",
        callback,
      );

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();
      // Verify no errors on unsubscribe
    });
  });
});
```

Run tests:

```bash
npm run test wallet.service.test.ts
```

---

### Integration Tests

Test complete workflows:

**Test 1: Complete Transaction Flow**

```typescript
// 1. Get initial balance
let wallet = await walletService.fetchWalletBalance(partnerId);
const initialBalance = wallet?.balance || 0;

// 2. Record transaction
const txResult = await walletService.recordTransaction({
  walletId,
  partnerId,
  userId,
  transactionType: "earnings",
  amount: 1000,
  description: "Integration test",
});

// 3. Verify balance increased
wallet = await walletService.fetchWalletBalance(partnerId);
const newBalance = wallet?.balance || 0;

expect(newBalance).toBe(initialBalance + 1000);
expect(txResult.success).toBe(true);
```

**Test 2: Withdrawal Workflow**

```typescript
// 1. Request withdrawal
const withdrawResult = await walletService.requestWithdrawal({
  walletId,
  partnerId,
  userId,
  amount: 5000,
  method: "mpesa",
  details: { phone_number: "254712345678" },
});

expect(withdrawResult.success).toBe(true);
const withdrawalId = withdrawResult.withdrawalId;

// 2. Verify pending_withdrawals increased
let wallet = await walletService.fetchWalletBalance(partnerId);
expect(wallet?.pending).toBeGreaterThan(0);

// 3. Process withdrawal
const processResult = await walletService.processWithdrawal(
  withdrawalId,
  "approved",
  "Approved",
);

expect(processResult.success).toBe(true);
```

**Test 3: Real-time Subscription**

```typescript
const updates: any[] = [];

const unsubscribe = walletService.subscribeToWalletChanges(partnerId, (data) =>
  updates.push(data),
);

// Make a change
await walletService.recordTransaction({
  walletId,
  partnerId,
  userId,
  transactionType: "earnings",
  amount: 500,
  description: "Test",
});

// Wait for subscription update
await new Promise((resolve) => setTimeout(resolve, 1000));

expect(updates.length).toBeGreaterThan(0);
unsubscribe();
```

---

### Performance Tests

Test under load:

```bash
# Install load testing tool
npm install -D autocannon

# Create load test
npx autocannon http://localhost:5173/api/wallet-balance \
  -c 100 \
  -d 30 \
  -p 10

# Expected: < 100ms response time at 100 concurrent users
```

---

## ✅ Post-Deployment Verification

### Manual Testing Checklist

- [ ] Create new wallet via admin panel
- [ ] Record transaction and verify balance updates
- [ ] Request withdrawal and verify pending amount
- [ ] Approve withdrawal as finance admin
- [ ] Verify withdrawal status changes
- [ ] Check wallet_history audit trail
- [ ] Verify RLS prevents cross-partner access
- [ ] Test real-time subscription in browser DevTools
- [ ] Verify seed scripts complete without errors
- [ ] Check database size and query performance

### Monitor Logs

```bash
# Watch for errors
tail -f logs/supabase.log | grep -i "error\|warning"

# Monitor RPC function calls
SELECT
  proname, count(*) as calls,
  avg(mean_exec_time) as avg_time_ms
FROM pg_stat_user_functions
WHERE proname LIKE 'rpc_%'
GROUP BY proname;

# Check for RLS violations
SELECT * FROM pg_stat_statements
WHERE query LIKE '%permission%denied%'
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: "relation does not exist"

**Solution:**

1. Verify all 4 migration files executed
2. Check table names (should be lowercase)
3. Refresh Supabase connection

### Issue: "RPC function not found"

**Solution:**

1. Verify 006_phase3_functions.sql executed completely
2. Check function name is correct (with `rpc_` prefix)
3. Clear browser cache

### Issue: "RLS policy violation"

**Solution:**

1. User does not have SELECT permission on table
2. Check user role: `SELECT role FROM users WHERE id = ...`
3. Verify RLS policy conditions
4. Test with super admin first to isolate issue

### Issue: Seed script fails

**Solution:**

1. Check environment variables set: `echo $VITE_SUPABASE_URL`
2. Verify JSON files are valid: `npm run build` (TypeScript compilation)
3. Check for constraint violations in error message
4. Run with verbose logging: `DEBUG=* npx tsx scripts/seed_wallets_from_json.ts`

### Issue: Real-time subscription not updating

**Solution:**

1. Verify RLS SELECT policy allows user
2. Check subscription channel name matches table
3. Verify user has real-time enabled in project settings
4. Test INSERT directly: `INSERT INTO wallets (...) VALUES (...)`
5. Check browser console for errors

---

## 📊 Performance Expectations

### After Deployment

| Metric                         | Expected | Threshold |
| ------------------------------ | -------- | --------- |
| Wallet fetch                   | < 1ms    | 10ms      |
| Transaction insert             | < 5ms    | 50ms      |
| Transaction query (1K records) | < 10ms   | 100ms     |
| Withdrawal approval            | < 10ms   | 100ms     |
| Real-time notification         | < 500ms  | 2000ms    |

---

## 🎯 Next Steps

1. **Immediate (Day 1):**
   - [ ] Run all migrations
   - [ ] Run verification queries
   - [ ] Execute seed scripts
   - [ ] Test RPC functions

2. **Day 2-3:**
   - [ ] Run integration tests
   - [ ] Test RLS enforcement
   - [ ] Load test endpoints
   - [ ] Document findings

3. **Day 4-5:**
   - [ ] Train support team
   - [ ] Update API documentation
   - [ ] Monitor production logs
   - [ ] Gather user feedback

4. **Week 2+:**
   - [ ] Optimize slow queries
   - [ ] Add advanced features
   - [ ] Plan Phase 4

---

**Deployment Status:** ✅ Ready  
**Estimated Completion:** 45 minutes  
**Support Contact:** Development Team

Questions? See [PHASE3_QUICK_REFERENCE.md](./PHASE3_QUICK_REFERENCE.md) or contact support.
