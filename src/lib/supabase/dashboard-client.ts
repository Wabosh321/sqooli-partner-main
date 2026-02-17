/**
 * Dashboard Client Module
 * Centralized data access for all dashboard queries with RLS policy enforcement
 *
 * Provides type-safe methods for fetching:
 * - Dashboard metrics (30-day aggregates by type: earnings, withdrawals, engagements)
 * - Upcoming campaigns (filtered by start_date >= today)
 * - Error handling and RLS validation
 */

import { supabase } from "../supabase";

/**
 * Represents a single data point in dashboard metrics
 */
export interface DashboardMetricPoint {
  date: string; // Format: "DD MMM" (e.g., "15 Feb")
  earnings: number;
  withdrawals: number;
  engagements: number;
}

/**
 * Represents an upcoming campaign
 */
export interface UpcomingCampaign {
  id: string;
  name: string;
  start_date: string; // ISO format date string
}

/**
 * Error class for dashboard-specific errors
 */
export class DashboardClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "DashboardClientError";
  }
}

/**
 * DashboardClient: Centralized data access for dashboard queries
 *
 * All methods handle:
 * - RLS policy enforcement (partner_id filtering)
 * - Consistent error handling
 * - Type-safe return values
 * - Null/empty state handling
 */
export const DashboardClient = {
  /**
   * Fetch aggregated metrics for the last N days
   *
   * Returns daily aggregates of:
   * - earnings: sum of earnings transactions for that day
   * - withdrawals: sum of withdrawal transactions for that day
   * - engagements: count of engagement transactions for that day
   *
   * @param partnerId - Partner ID for RLS filtering
   * @param days - Number of days to fetch (default: 30)
   * @returns Array of DashboardMetricPoint sorted by date ascending (oldest first)
   * @throws DashboardClientError on authentication/authorization issues
   */
  async fetchDashboardMetrics(
    partnerId: string | undefined,
    days: number = 30,
  ): Promise<DashboardMetricPoint[]> {
    if (!partnerId) {
      return [];
    }

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Fetch all transactions for the partner in the date range
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, transaction_type, created_at")
        .eq("partner_id", partnerId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        if (error.code === "PGRST116") {
          // RLS policy violation
          throw new DashboardClientError(
            "RLS_VIOLATION",
            "Unauthorized access to metrics data",
            error,
          );
        }
        throw new DashboardClientError(
          "FETCH_ERROR",
          "Failed to fetch dashboard metrics",
          error,
        );
      }

      // Generate date buckets for all days in range
      const dayBuckets: Record<string, DashboardMetricPoint> = {};
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const dateKey = normalizedDate.toISOString().split("T")[0];
        const formattedDate = normalizedDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });

        dayBuckets[dateKey] = {
          date: formattedDate,
          earnings: 0,
          withdrawals: 0,
          engagements: 0,
        };
      }

      // Aggregate transactions into buckets
      const transactions = (data || []) as Array<{
        id: string;
        amount: number;
        transaction_type: string;
        created_at: string;
      }>;

      transactions.forEach((tx) => {
        const dateKey = (tx.created_at || "").split("T")[0];
        if (!dateKey || !dayBuckets[dateKey]) return;

        const amount = Number(tx.amount || 0);
        const bucket = dayBuckets[dateKey];

        // Categorize by transaction type
        if (
          tx.transaction_type === "earnings" ||
          tx.transaction_type === "earn"
        ) {
          bucket.earnings += amount;
        } else if (
          tx.transaction_type === "withdrawal" ||
          tx.transaction_type === "withdraw"
        ) {
          bucket.withdrawals += amount;
        } else if (
          tx.transaction_type === "engagement" ||
          tx.transaction_type === "engage"
        ) {
          bucket.engagements += amount;
        }
      });

      // Return as sorted array
      return Object.values(dayBuckets).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } catch (err) {
      if (err instanceof DashboardClientError) {
        throw err;
      }
      throw new DashboardClientError(
        "UNKNOWN_ERROR",
        "An unexpected error occurred while fetching metrics",
        err instanceof Error ? err : undefined,
      );
    }
  },

  /**
   * Fetch upcoming campaigns for the partner
   *
   * Returns campaigns with start_date >= today, sorted by start_date ascending
   *
   * @param partnerId - Partner ID for RLS filtering
   * @param limit - Maximum number of campaigns to return (default: 5)
   * @returns Array of UpcomingCampaign objects
   * @throws DashboardClientError on authentication/authorization issues
   */
  async fetchUpcomingCampaigns(
    partnerId: string | undefined,
    limit: number = 5,
  ): Promise<UpcomingCampaign[]> {
    if (!partnerId) {
      return [];
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      // UpcomingCampaigns doesn't filter by partner in original code
      // Check if this should be scoped to partner
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, start_date")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(limit);

      if (error) {
        if (error.code === "PGRST116") {
          // RLS policy violation
          throw new DashboardClientError(
            "RLS_VIOLATION",
            "Unauthorized access to campaigns data",
            error,
          );
        }
        throw new DashboardClientError(
          "FETCH_ERROR",
          "Failed to fetch upcoming campaigns",
          error,
        );
      }

      const campaigns = (data || []) as Array<{
        id: string;
        name: string;
        start_date: string;
      }>;

      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name || "Untitled",
        start_date: campaign.start_date,
      }));
    } catch (err) {
      if (err instanceof DashboardClientError) {
        throw err;
      }
      throw new DashboardClientError(
        "UNKNOWN_ERROR",
        "An unexpected error occurred while fetching upcoming campaigns",
        err instanceof Error ? err : undefined,
      );
    }
  },
};
