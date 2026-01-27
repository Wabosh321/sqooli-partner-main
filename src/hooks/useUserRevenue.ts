import { useUserCampaigns } from "./useUserCampaigns";
import { useEffect, useState } from "react";
import revenueData from "../auth/data/revenue.json";

export function useUserRevenue() {
  const { campaigns, loading: campaignsLoading } = useUserCampaigns();
  const [revenue, setRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignsLoading) return;

    const campaignIds = campaigns.map((c) => c.id);

    // Filter revenue for campaigns created by user
    const userRevenue = revenueData.partner_revenue.filter((rev: any) =>
      campaignIds.includes(rev.campaign_id),
    );

    setRevenue(userRevenue);
    setLoading(false);
  }, [campaigns, campaignsLoading]);

  return {
    revenue,
    loading,
  };
}
