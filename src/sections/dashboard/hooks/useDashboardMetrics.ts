// src/sections/dashboard/hooks/useDashboardMetrics.ts
import type { DashboardMetrics } from "../types/metrics.types";
import type { DashboardCampaign } from "../../../types/global.types";
import type { CampaignEarningsData } from "../types/campaign.types";

export function useDashboardMetrics(
  campaigns: DashboardCampaign[] | undefined,
  campaignEarnings: CampaignEarningsData[] | undefined
): DashboardMetrics {
  const metrics: DashboardMetrics = {
    totalCampaigns: campaigns?.length ?? 0,
    ongoingCampaigns:
      campaigns?.filter((c: DashboardCampaign) => c.status === "active").length ?? 0,
    totalSignups:
      campaignEarnings?.reduce(
        (sum: number, c: CampaignEarningsData) => sum + c.enrollments,
        0
      ) ?? 0,
    totalEarnings:
      campaignEarnings?.reduce(
        (sum: number, c: CampaignEarningsData) => sum + c.partner_earnings,
        0
      ) ?? 0,
  };

  return metrics;
}
