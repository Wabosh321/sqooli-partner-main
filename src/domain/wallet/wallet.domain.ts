/**
 * Domain Layer: Business Rules & Invariants
 * Pure functions for wallet domain logic
 */

import type { Transaction, Withdrawal } from "./types";

/**
 * Checks if a transaction is verified/completed
 */
export function isTransactionVerified(tx: Transaction): boolean {
  return tx.status === "verified" || tx.status === "completed";
}

/**
 * Searches transactions by multiple fields
 */
export function searchTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  if (!query) return transactions;

  const q = query.toLowerCase();

  return transactions.filter(
    (tx) =>
      tx.student_name.toLowerCase().includes(q) ||
      tx.phone_number.includes(q) ||
      tx.mpesa_code.toLowerCase().includes(q) ||
      tx.campaign_code.toLowerCase().includes(q)
  );
}

/**
 * Searches withdrawals by multiple fields
 */
export function searchWithdrawals(
  withdrawals: Withdrawal[],
  query: string
): Withdrawal[] {
  if (!query) return withdrawals;

  const q = query.toLowerCase();

  return withdrawals.filter(
    (w) =>
      w.reference_number.toLowerCase().includes(q) ||
      w.destination_details.account_number.includes(q) ||
      w.amount.toString().includes(q)
  );
}
