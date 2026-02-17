# Phase 3: Wallets, Transactions, and Withdrawals

## Overview

Phase 3 adds comprehensive wallet management with real-time balance tracking, transaction recording, and withdrawal processing. All operations enforce RLS policies and maintain audit trails.

## Backend Structure

### Tables (005_phase3_tables.sql)

| Table          | Purpose                    | Key Fields                                                   |
| -------------- | -------------------------- | ------------------------------------------------------------ |
| wallets        | User wallet accounts       | balance, pending_withdrawals, total_earnings                 |
| transactions   | All financial transactions | type (earnings, bonus, referral, adjustment), amount, status |
| withdrawals    | Withdrawal requests        | status (pending, approved, processing, completed, failed)    |
| wallet_history | Audit trail                | action, change_amount, new_balance                           |

### RPC Functions (006_phase3_functions.sql)

- `rpc_record_transaction()` - Record earnings, bonuses, referrals, adjustments
- `rpc_request_withdrawal()` - User requests withdrawal
- `rpc_process_withdrawal()` - Admin approves/rejects/completes withdrawals

### RLS Policies (007_phase3_policies.sql)

- **Wallets**: Users view own, admins view partner wallets
- **Transactions**: Users view own, partners view all partner transactions
- **Withdrawals**: Users view own, admins can approve/reject
- **Wallet History**: Immutable audit trail

### Indexes (008_phase3_indexes.sql)

- Foreign key indexes for performance
- Composite indexes for efficient filtering
- Date-based indexes for time range queries

## Frontend Integration

### Services (wallet.service.ts)

- `fetchCampaigns()` - Get partner campaigns
- `fetchTransactions()` - Get partner transactions with filtering
- `fetchWithdrawals()` - Get partner withdrawals
- `fetchWalletBalance()` - Get current balance and pending
- `recordTransaction()` - Call RPC to record new transaction
- `requestWithdrawal()` - Create withdrawal request
- `processWithdrawal()` - Approve/reject/complete withdrawals
- Real-time subscriptions for live updates

### Components

- **LineChart.tsx**: Real-time earnings, withdrawals, engagement charts
- **RecentActivity.tsx**: Activity feed with transaction logs
- **WalletBalanceCard.tsx**: Current balance display
- **WalletSection.tsx**: Full wallet management interface

### Real-Time Features

- Subscribe to wallet changes
- Subscribe to transaction inserts
- Subscribe to withdrawal status updates
- Auto-refresh when data changes

## Security & RLS

### Role-Based Access

| Role          | Wallet       | Transactions     | Withdrawals     |
| ------------- | ------------ | ---------------- | --------------- |
| Super Admin   | View all     | View all         | Approve all     |
| Partner Admin | View partner | View partner     | Approve partner |
| Finance Admin | View own     | View own + admin | Request own     |
| User          | View own     | View own         | Request own     |

### Data Validation

- Wallet balance verification before withdrawal
- Transaction type validation
- Status transition validation
- Amount > 0 checks

## Seed Scripts

### seed_wallets_from_json.ts

- Migrates wallet records from JSON
- Validates partner_id and user_id references
- Batch inserts with error handling

### seed_transactions_from_json.ts

- Migrates transactions from JSON
- Maps to correct wallet_id via partner_id + user_id
- Preserves transaction types and amounts

## Integration Points

### With Phase 1-2

- Uses profiles table for user info
- Uses partners table for partner context
- Uses campaigns table for campaign references
- Uses is_partner_admin() and is_super_admin() functions

### Data Flow

```
Transaction Record
    ↓
RPC: rpc_record_transaction()
    ├→ INSERT transaction
    ├→ UPDATE wallet (balance + total_earnings)
    ├→ INSERT wallet_history
    ├→ UPDATE user_performance_metrics
    └→ INSERT audit_log

Withdrawal Request
    ↓
RPC: rpc_request_withdrawal()
    ├→ Verify balance
    ├→ INSERT withdrawal (status=pending)
    ├→ UPDATE wallet (pending_withdrawals)
    └→ INSERT audit_log

Withdrawal Approval
    ↓
RPC: rpc_process_withdrawal()
    ├→ UPDATE withdrawal (status=approved/rejected/completed)
    ├→ UPDATE wallet (balance, pending_withdrawals)
    ├→ INSERT wallet_history
    └→ INSERT audit_log
```

## Testing Checklist

- [ ] Migrations run without errors
- [ ] Wallet balances update after transactions
- [ ] Withdrawals can be requested and processed
- [ ] RLS blocks unauthorized access
- [ ] Real-time subscriptions update components
- [ ] Seed scripts migrate JSON data correctly
- [ ] Audit trail records all actions
- [ ] Role-based access works correctly

## Performance Optimizations

- Composite indexes on (wallet_id, status)
- Indexes on created_at for time-based filtering
- Efficient wallet lookup by partner_id + user_id
- Batch insertion for seed scripts
- Real-time updates via PostgreSQL pub/sub
