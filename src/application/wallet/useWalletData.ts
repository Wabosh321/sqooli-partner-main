/**
 * Application Layer: useWalletData Hook
 * Orchestrates data fetching from WalletService
 */

import { useEffect, useState } from "react";
import type { WalletDataState, Campaign, Transaction, Withdrawal } from "../../domain/wallet";
import { walletService } from "../../infrastructure/wallet";

/**
 * Custom hook for fetching wallet data (campaigns, transactions, withdrawals)
 * Handles loading state, error handling, and cleanup
 */
export function useWalletData(partnerId: string | undefined): WalletDataState {
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!partnerId) {
      setCampaigns(undefined);
      setTransactions(undefined);
      setWithdrawals(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [campaignData, transactionData, withdrawalData] = await Promise.all([
          walletService.fetchCampaigns(partnerId),
          walletService.fetchTransactions(partnerId),
          walletService.fetchWithdrawals(partnerId),
        ]);

        if (mounted) {
          setCampaigns(campaignData);
          setTransactions(transactionData);
          setWithdrawals(withdrawalData);
          setIsLoading(false);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error fetching wallet data");
        if (mounted) {
          setError(error);
          setCampaigns([]);
          setTransactions([]);
          setWithdrawals([]);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [partnerId]);

  return {
    campaigns,
    transactions,
    withdrawals,
    isLoading,
    error,
  };
}
