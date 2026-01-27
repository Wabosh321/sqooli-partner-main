/**
 * Application Layer: useWalletFiltering Hook
 * Orchestrates filtering logic using domain functions
 */

import { useMemo } from "react";
import type { FilteredResults, WalletDataState } from "../../domain/wallet";
import { searchTransactions, searchWithdrawals } from "../../domain/wallet";

/**
 * Custom hook for filtering wallet data based on search query
 */
export function useWalletFiltering(
  data: WalletDataState,
  searchQuery: string
): FilteredResults {
  const filtered = useMemo(() => {
    const transactions = data.transactions
      ? searchTransactions(data.transactions, searchQuery)
      : [];

    const withdrawals = data.withdrawals
      ? searchWithdrawals(data.withdrawals, searchQuery)
      : [];

    return {
      transactions,
      withdrawals,
    };
  }, [data.transactions, data.withdrawals, searchQuery]);

  return filtered;
}
