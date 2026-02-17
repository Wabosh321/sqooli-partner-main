# Phase 3 Quick Reference Guide

## 🎯 Common Operations

### Record an Earning Transaction

```typescript
import { walletService } from "@/infrastructure/wallet/wallet.service";

const result = await walletService.recordTransaction({
  walletId: "wallet-uuid",
  partnerId: "partner-uuid",
  userId: "user-uuid",
  transactionType: "earnings",
  amount: 2500,
  campaignId: "campaign-uuid",
  description: "Commission from campaign X",
  referenceNumber: "BATCH-001-2025-01-29",
});

if (result.success) {
  console.log(`Transaction created: ${result.transactionId}`);
  console.log(`New balance: KES ${result.newBalance}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Request a Withdrawal

```typescript
const result = await walletService.requestWithdrawal({
  walletId: "wallet-uuid",
  partnerId: "partner-uuid",
  userId: "user-uuid",
  amount: 50000,
  method: "mpesa",
  details: {
    phone_number: "254712345678",
  },
});

if (result.success) {
  console.log(`Withdrawal requested: ${result.withdrawalId}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Approve a Withdrawal (Finance Admin)

```typescript
const result = await walletService.processWithdrawal(
  "withdrawal-uuid",
  "approved",
  "Approved by Finance Admin",
  null, // Optional M-Pesa reference
);

if (result.success) {
  console.log(`Withdrawal approved. Processing...`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Subscribe to Real-time Balance Changes

```typescript
import { walletService } from "@/infrastructure/wallet/wallet.service";

useEffect(() => {
  const unsubscribe = walletService.subscribeToWalletChanges(
    partnerId,
    (walletData) => {
      console.log("Wallet updated:", walletData);
      setWallet(walletData);
    },
  );

  return () => unsubscribe(); // Cleanup on unmount
}, [partnerId]);
```

### Subscribe to Transaction Inserts

```typescript
useEffect(() => {
  const unsubscribe = walletService.subscribeToTransactions(
    partnerId,
    (transaction) => {
      console.log("New transaction:", transaction);
      setTransactions((prev) => [transaction, ...prev]);
    },
  );

  return () => unsubscribe();
}, [partnerId]);
```

---

## 📊 Database Queries

### Get Wallet Balance

```sql
SELECT balance, pending_withdrawals,
       (balance - pending_withdrawals) AS available
FROM wallets
WHERE partner_id = $1;
```

### Get Recent Transactions

```sql
SELECT id, transaction_type, amount, status, created_at
FROM transactions
WHERE partner_id = $1
ORDER BY created_at DESC
LIMIT 20;
```

### Get Pending Withdrawals

```sql
SELECT id, amount, withdrawal_method, status, created_at
FROM withdrawals
WHERE partner_id = $1 AND status IN ('pending', 'approved', 'processing')
ORDER BY created_at DESC;
```

### Get Wallet Audit Trail

```sql
SELECT action, change_amount, new_balance, actor_id, created_at
FROM wallet_history
WHERE wallet_id = $1
ORDER BY created_at DESC
LIMIT 100;
```

### Get Transaction Summary by Type

```sql
SELECT
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total,
  AVG(amount) as average
FROM transactions
WHERE partner_id = $1
GROUP BY transaction_type;
```

---

## 🔐 RLS Policy Testing

### Check If User Can Access Wallet

```sql
-- As authenticated user, this should return results
SELECT * FROM wallets WHERE user_id = auth.uid();

-- This will return no results if not authorized
SELECT * FROM wallets WHERE partner_id = 'other-partner-uuid';
```

### Check Transaction Visibility

```sql
-- Your own transactions
SELECT * FROM transactions WHERE user_id = auth.uid();

-- Partner's transactions (if partner admin)
SELECT * FROM transactions WHERE partner_id = get_user_partner_id(auth.uid());

-- All transactions (if super admin)
SELECT * FROM transactions;
```

---

## 🐛 Troubleshooting

### "RLS policy violation" Error

**Cause:** User doesn't have permission to access data

**Solution:**

1. Verify user's role: `SELECT role FROM users WHERE id = auth.uid();`
2. Check partner assignment: `SELECT partner_id FROM partners WHERE admin_id = auth.uid();`
3. Verify RLS policy logic in 007_phase3_policies.sql

### "No wallet found for partner:user" in Seed

**Cause:** Wallet doesn't exist for the transaction's partner:user combination

**Solution:**

1. Run `seed_wallets_from_json.ts` first
2. Verify wallet records exist: `SELECT COUNT(*) FROM wallets;`
3. Check transaction JSON has correct partner_id/user_id

### Real-time Subscription Not Triggering

**Cause:** Postgres changes event not firing or policy blocks it

**Solution:**

1. Verify RLS SELECT policy allows user
2. Check subscription filter matches data
3. Try direct INSERT: `INSERT INTO transactions (...) VALUES (...);` and watch for event
4. Check browser console for subscription errors

---

## 📋 Transaction Type Reference

| Type           | Usage               | Example                               |
| -------------- | ------------------- | ------------------------------------- |
| **earnings**   | Campaign payouts    | Partner earns 2,500 KES from campaign |
| **bonus**      | Promotional bonuses | Sign-up bonus of 1,000 KES            |
| **referral**   | Referral rewards    | 500 KES for referring user            |
| **adjustment** | Manual corrections  | Admin corrects balance                |

---

## 🔄 Withdrawal Status Flow

```
┌─────────────────────────────────────────────┐
│ pending                                      │
│ (Initial request from partner)               │
└──────────────┬──────────────────────────────┘
               │
      ┌────────▼────────┐
      │ approved        │
      │ (Finance admin) │
      └────────┬────────┘
               │
      ┌────────▼──────────┐
      │ processing        │
      │ (Payment in prog) │
      └────────┬──────────┘
               │
┌──────────────┴──────────────┐
│                             │
▼                             ▼
completed                  failed
(Success)              (Timeout/Error)
```

**Approval Required:** Yes, unless using automated processing  
**Status Transition:** Only forward (pending → approved → processing → completed)  
**Rollback:** Use 'failed' status, doesn't refund wallet

---

## 📱 M-Pesa Integration

### Withdrawal Detail Structure

```typescript
{
  phone_number: "254712345678",     // Recipient phone
  mpesa_reference: "LHG31ACJFH4",   // Optional: existing M-Pesa ref
  // Optional additional fields:
  account_name: "John Doe",
  description: "Monthly earnings payout"
}
```

### Processing M-Pesa Withdrawal

```typescript
const result = await walletService.processWithdrawal(
  "withdrawal-id",
  "completed",
  "M-Pesa processed successfully",
  "LHG31ACJFH4", // M-Pesa confirmation reference
);
```

---

## 📞 Emergency Operations

### Prevent Duplicate Transaction (if error occurred)

```sql
-- Check if transaction already exists
SELECT * FROM transactions WHERE reference_number = 'BATCH-001-2025-01-29';

-- If exists, don't re-submit. Use idempotency via reference_number
```

### Manual Wallet Balance Correction

```typescript
const result = await walletService.recordTransaction({
  walletId,
  partnerId,
  userId,
  transactionType: "adjustment",
  amount: -500, // Negative to deduct
  description: "Manual correction: Overpayment refund",
  referenceNumber: "ADJ-2025-01-29-001",
});
```

### Reverse a Completed Withdrawal

```typescript
// Create adjustment transaction to refund
const result = await walletService.recordTransaction({
  walletId,
  partnerId,
  userId,
  transactionType: "adjustment",
  amount: 50000, // Refund amount
  description: "Reversal of withdrawal WD-001 due to failed M-Pesa",
  referenceNumber: "REV-WD-001-2025-01-29",
});
```

---

## ✅ Verification Commands

### Verify All Phase 3 Components Deployed

```bash
# Check migrations executed
curl -X POST https://your-supabase.com/rest/v1/rpc/public.rpc_record_transaction \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check tables exist
curl https://your-supabase.com/rest/v1/wallets?limit=1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check indexes
curl https://your-supabase.com/rest/v1/transactions?limit=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Local Testing

```bash
# Build and test
npm run build
npm run test

# Run seed scripts
npx tsx scripts/seed_wallets_from_json.ts
npx tsx scripts/seed_transactions_from_json.ts

# Test RPC functions manually in Supabase console
```

---

## 📚 Related Documentation

- [PHASE3_IMPLEMENTATION.md](./PHASE3_IMPLEMENTATION.md) - Full technical documentation
- [PHASE3_COMPLETION_SUMMARY.md](./PHASE3_COMPLETION_SUMMARY.md) - Implementation status
- [supabase/migrations/005_phase3_tables.sql](./supabase/migrations/005_phase3_tables.sql) - Table definitions
- [supabase/migrations/006_phase3_functions.sql](./supabase/migrations/006_phase3_functions.sql) - RPC functions
- [supabase/migrations/007_phase3_policies.sql](./supabase/migrations/007_phase3_policies.sql) - RLS policies

---

**Last Updated:** January 29, 2025  
**Maintained By:** Development Team
