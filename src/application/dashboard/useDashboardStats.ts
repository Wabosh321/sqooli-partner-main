/**
 * Dashboard Stats Hook
 *
 * Consolidates dashboard statistics for SmallCardsGrid:
 * - Total campaigns
 * - Ongoing/active campaigns
 * - Engagement and purchase counts
 * - Wallet balance
 *
 * Provides loading states, error handling, and refetch capability.
 */

import { useEffect, useState, useCallback } from "react";
import { CampaignService } from "../../infrastructure/campaign/campaign.service";
import { walletService } from "../../infrastructure/wallet/wallet.service";
import { supabase } from "../../lib/supabase";

/**
 * Dashboard stats data structure
 */
export interface DashboardStats {
  totalCampaigns: number;
  ongoingCampaigns: number;
  engagements: number;
  purchases: number;
  walletBalance: number;
  balanceChange: number;
}

/**
 * Return type for useDashboardStats hook
 */
export interface UseDashboardStatsReturn {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useDashboardStats: Centralized stats fetching for dashboard
 *
 * Aggregates campaign counts, transaction counts, and wallet balance.
 * Handles:
 * - Loading state during fetch
 * - Error state with appropriate messaging
 * - Auto-refetch when partnerId changes
 * - Cleanup on unmount
 * - Type-safe return values
 *
 * @param partnerId - Partner ID to fetch stats for (can be undefined)
 * @returns Object with stats, isLoading, error, and refetch function
 *
 * @example
 * ```tsx
 * const { stats, isLoading, error } = useDashboardStats(partnerId);
 *
 * if (isLoading) return <StatsLoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <SmallCardsGrid
 *     totalCampaigns={stats.totalCampaigns}
 *     ongoingCampaigns={stats.ongoingCampaigns}
 *     engagements={stats.engagements}
 *     purchases={stats.purchases}
 *     walletBalance={stats.walletBalance}
 *   />
 * );
 * ```
 */
export function useDashboardStats(
  partnerId: string | undefined,
): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized refetch function for manual data refresh
  const refetch = useCallback(async () => {
    if (!partnerId) {
      setStats(undefined);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all stats in parallel
      const [
        totalCampaigns,
        ongoingCampaigns,
        walletBalance,
        engagementData,
        purchaseData,
      ] = await Promise.all([
        CampaignService.countByPartner(partnerId),
        CampaignService.countByStatus(partnerId, "active"),
        walletService.fetchWalletBalance(partnerId),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("transaction_type", "engagement"),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("transaction_type", "purchase"),
      ]);

      const engagements = engagementData.count || 0;
      const purchases = purchaseData.count || 0;

      setStats({
        totalCampaigns,
        ongoingCampaigns,
        engagements,
        purchases,
        walletBalance,
        balanceChange: 0, // Placeholder for future implementation
      });
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Unknown error fetching dashboard stats");
      setError(error);
      setStats(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  // Auto-fetch on mount and when partnerId changes
  useEffect(() => {
    if (!partnerId) {
      setStats(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all stats in parallel
        const [
          totalCampaigns,
          ongoingCampaigns,
          walletBalance,
          engagementData,
          purchaseData,
        ] = await Promise.all([
          CampaignService.countByPartner(partnerId),
          CampaignService.countByStatus(partnerId, "active"),
          walletService.fetchWalletBalance(partnerId),
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .eq("transaction_type", "engagement"),
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .eq("transaction_type", "purchase"),
        ]);

        if (mounted) {
          const engagements = engagementData.count || 0;
          const purchases = purchaseData.count || 0;

          setStats({
            totalCampaigns,
            ongoingCampaigns,
            engagements,
            purchases,
            walletBalance,
            balanceChange: 0,
          });
        }
      } catch (err) {
        if (mounted) {
          const error =
            err instanceof Error
              ? err
              : new Error("Unknown error fetching dashboard stats");
          setError(error);
          setStats(undefined);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [partnerId, refetch]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
