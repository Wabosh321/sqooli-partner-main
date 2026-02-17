/**
 * useRecentActivity Hook
 *
 * Provides consolidated recent activity data with optimized RPC access.
 * Eliminates N+1 query problem by using get_recent_activity RPC or fallback queries with parallel user lookup.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DashboardRPCService,
  RecentActivityItem,
} from "@/lib/supabase/dashboard-rpc.service";

export interface UseRecentActivityReturn {
  activities: RecentActivityItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching recent activity with user information
 *
 * @param partnerId - Partner ID to fetch activity for
 * @param limit - Maximum number of activities to fetch (default: 10)
 * @returns Object containing activities, loading state, error, and refetch function
 */
export function useRecentActivity(
  partnerId: string | undefined,
  limit: number = 10,
): UseRecentActivityReturn {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!partnerId) {
      setActivities([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await DashboardRPCService.fetchRecentActivity(
        partnerId,
        limit,
      );
      setActivities(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, limit]);

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      if (!partnerId) {
        if (mounted) {
          setActivities([]);
        }
        return;
      }

      try {
        if (mounted) setIsLoading(true);
        const data = await DashboardRPCService.fetchRecentActivity(
          partnerId,
          limit,
        );
        if (mounted) {
          setActivities(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setActivities([]);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetch();

    return () => {
      mounted = false;
    };
  }, [partnerId, limit]);

  return { activities, isLoading, error, refetch };
}
