/**
 * Upcoming Campaigns Hook
 *
 * Fetches campaigns scheduled to start after today for:
 * - UpcomingCampaigns.tsx display component
 *
 * Provides loading states, error handling, and refetch capability.
 */

import { useEffect, useState, useCallback } from "react";
import {
  DashboardClient,
  UpcomingCampaign,
} from "../../lib/supabase/dashboard-client";

/**
 * Return type for useUpcomingCampaigns hook
 */
export interface UseUpcomingCampaignsReturn {
  /** Array of upcoming campaigns sorted by start_date */
  campaigns: UpcomingCampaign[] | undefined;
  /** True while fetching campaigns */
  isLoading: boolean;
  /** Error object if fetch failed; null otherwise */
  error: Error | null;
  /** Manually refetch campaigns after initial load */
  refetch: () => Promise<void>;
}

/**
 * useUpcomingCampaigns: Fetch campaigns scheduled to start after today
 *
 * Retrieves a list of upcoming campaigns for the partner, sorted by start date.
 * Handles:
 * - Loading state during fetch
 * - Error state with appropriate messaging
 * - Auto-refetch when partnerId changes
 * - Cleanup on unmount
 * - Type-safe return values
 *
 * @param partnerId - Partner ID to fetch campaigns for (can be undefined)
 * @param limit - Maximum number of campaigns to return (default: 5)
 * @returns Object with campaigns, isLoading, error, and refetch function
 *
 * @example
 * ```tsx
 * const { campaigns, isLoading, error } = useUpcomingCampaigns(partnerId, 5);
 *
 * if (isLoading) return <CampaignsLoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     {campaigns.length === 0 ? (
 *       <EmptyState>No upcoming campaigns</EmptyState>
 *     ) : (
 *       campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)
 *     )}
 *   </div>
 * );
 * ```
 */
export function useUpcomingCampaigns(
  partnerId: string | undefined,
  limit: number = 5,
): UseUpcomingCampaignsReturn {
  const [campaigns, setCampaigns] = useState<UpcomingCampaign[] | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized refetch function for manual data refresh
  const refetch = useCallback(async () => {
    if (!partnerId) {
      setCampaigns([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DashboardClient.fetchUpcomingCampaigns(
        partnerId,
        limit,
      );
      setCampaigns(data);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Unknown error fetching upcoming campaigns");
      setError(error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, limit]);

  // Auto-fetch on mount and when partnerId/limit changes
  useEffect(() => {
    if (!partnerId) {
      setCampaigns([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await DashboardClient.fetchUpcomingCampaigns(
          partnerId,
          limit,
        );
        if (mounted) {
          setCampaigns(data);
        }
      } catch (err) {
        if (mounted) {
          const error =
            err instanceof Error
              ? err
              : new Error("Unknown error fetching upcoming campaigns");
          setError(error);
          setCampaigns([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      mounted = false;
    };
  }, [partnerId, limit, refetch]);

  return {
    campaigns,
    isLoading,
    error,
    refetch,
  };
}
