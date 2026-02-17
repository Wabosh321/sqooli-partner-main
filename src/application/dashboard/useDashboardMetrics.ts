/**
 * Dashboard Metrics Hook
 *
 * Consolidates metrics data fetching for:
 * - LineChart.tsx (30-day earnings data)
 * - TabbedMetricsChart.tsx (30-day metrics across tabs)
 *
 * Provides time series data aggregated by day with proper error handling,
 * loading states, and refetch capability.
 */

import { useEffect, useState, useCallback } from "react";
import {
  DashboardClient,
  DashboardMetricPoint,
  DashboardClientError,
} from "../../lib/supabase/dashboard-client";

/**
 * Return type for useDashboardMetrics hook
 */
export interface UseDashboardMetricsReturn {
  /** Array of metric points sorted by date (oldest to newest) */
  data: DashboardMetricPoint[] | undefined;
  /** True while fetching metrics */
  isLoading: boolean;
  /** Error object if fetch failed; null otherwise */
  error: Error | null;
  /** Manually refetch metrics after initial load */
  refetch: () => Promise<void>;
}

/**
 * useDashboardMetrics: Centralized metrics fetching for dashboard charts
 *
 * Fetches aggregated transaction data for a partner over the last N days.
 * Handles:
 * - Loading state during fetch
 * - Error state with RLS policy validation
 * - Auto-refetch when partnerId changes
 * - Cleanup on unmount
 * - Type-safe return values
 *
 * @param partnerId - Partner ID to fetch metrics for (can be undefined)
 * @param days - Number of days to aggregate (default: 30)
 * @returns Object with data, isLoading, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data: metrics, isLoading, error } = useDashboardMetrics(partnerId, 30);
 *
 * if (isLoading) return <MetricsLoadingSkeleton />;
 * if (error) return <ErrorBoundary error={error} />;
 *
 * return (
 *   <LineChart
 *     data={metrics}
 *     title="30-Day Earnings"
 *   />
 * );
 * ```
 */
export function useDashboardMetrics(
  partnerId: string | undefined,
  days: number = 30,
): UseDashboardMetricsReturn {
  const [data, setData] = useState<DashboardMetricPoint[] | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized refetch function for manual data refresh
  const refetch = useCallback(async () => {
    if (!partnerId) {
      setData([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const metrics = await DashboardClient.fetchDashboardMetrics(
        partnerId,
        days,
      );
      setData(metrics);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Unknown error fetching dashboard metrics");
      setError(error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId, days]);

  // Auto-fetch on mount and when partnerId/days changes
  useEffect(() => {
    if (!partnerId) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const metrics = await DashboardClient.fetchDashboardMetrics(
          partnerId,
          days,
        );
        if (mounted) {
          setData(metrics);
        }
      } catch (err) {
        if (mounted) {
          const error =
            err instanceof Error
              ? err
              : new Error("Unknown error fetching dashboard metrics");
          setError(error);
          setData([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      mounted = false;
    };
  }, [partnerId, days, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
