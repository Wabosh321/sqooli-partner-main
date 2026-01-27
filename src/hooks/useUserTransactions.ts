import { useUserCampaigns } from "./useUserCampaigns";
import { useEffect, useState } from "react";
import transactionsData from "../auth/data/transactions.json";

export function useUserTransactions() {
  const { campaigns, loading: campaignsLoading } = useUserCampaigns();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignsLoading) return;

    const campaignIds = campaigns.map((c) => c.id);

    // Filter transactions for campaigns created by user
    const userTransactions = transactionsData.transactions.filter((tx: any) =>
      campaignIds.includes(tx.campaign_id),
    );

    setTransactions(userTransactions);
    setLoading(false);
  }, [campaigns, campaignsLoading]);

  return {
    transactions,
    loading,
  };
}
