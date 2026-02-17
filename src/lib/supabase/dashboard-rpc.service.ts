/**
 * Dashboard RPC Service
 *
 * Provides optimized data access via Postgres RPC functions.
 * Includes fallback to direct Supabase queries for RPC compatibility.
 */

import { supabase } from "../supabase";

export interface DashboardSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEarnings: number;
  walletBalance: number;
  totalTransactions: number;
  pendingWithdrawals: number;
  lastActivity: string | null;
}

export interface RecentActivityItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionType: string;
  entityType: string;
  createdAt: string;
}

export interface DashboardMetric {
  dateKey: string;
  dateFormatted: string;
  earnings: number;
  withdrawals: number;
  engagements: number;
  engagementCount: number;
}

/**
 * DashboardRPCService: Optimized dashboard data access via RPC
 */
export const DashboardRPCService = {
  /**
   * Fetch dashboard summary (consolidated metrics)
   * Attempts to use RPC; falls back to direct queries if RPC not available
   */
  async fetchDashboardSummary(partnerId: string): Promise<DashboardSummary> {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_summary", {
        p_partner_id: partnerId,
      });

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        const row = data[0];
        return {
          totalCampaigns: row.total_campaigns || 0,
          activeCampaigns: row.active_campaigns || 0,
          totalEarnings: row.total_earnings || 0,
          walletBalance: row.wallet_balance || 0,
          totalTransactions: row.total_transactions || 0,
          pendingWithdrawals: row.pending_withdrawals || 0,
          lastActivity: row.last_activity || null,
        };
      }

      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalEarnings: 0,
        walletBalance: 0,
        totalTransactions: 0,
        pendingWithdrawals: 0,
        lastActivity: null,
      };
    } catch (err) {
      // Fallback to direct queries if RPC not available
      return await DashboardRPCService._fetchDashboardSummaryFallback(
        partnerId,
      );
    }
  },

  /**
   * Fallback implementation: Direct queries for dashboard summary
   */
  async _fetchDashboardSummaryFallback(
    partnerId: string,
  ): Promise<DashboardSummary> {
    try {
      const [campaigns, activeCampaigns, wallet, transactions, withdrawals] =
        await Promise.all([
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .eq("status", "active"),
          supabase
            .from("wallets")
            .select("total_earnings, balance")
            .eq("partner_id", partnerId)
            .single(),
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId),
          supabase
            .from("withdrawals")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .in("status", ["pending", "approved"]),
        ]);

      return {
        totalCampaigns: campaigns.count || 0,
        activeCampaigns: activeCampaigns.count || 0,
        totalEarnings: (wallet.data?.total_earnings as number) || 0,
        walletBalance: (wallet.data?.balance as number) || 0,
        totalTransactions: transactions.count || 0,
        pendingWithdrawals: withdrawals.count || 0,
        lastActivity: null,
      };
    } catch (err) {
      console.error("Error fetching dashboard summary fallback:", err);
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalEarnings: 0,
        walletBalance: 0,
        totalTransactions: 0,
        pendingWithdrawals: 0,
        lastActivity: null,
      };
    }
  },

  /**
   * Fetch recent activity (consolidated audit logs)
   * Attempts to use RPC; falls back to direct queries if RPC not available
   */
  async fetchRecentActivity(
    partnerId: string,
    limit: number = 10,
  ): Promise<RecentActivityItem[]> {
    try {
      const { data, error } = await supabase.rpc("get_recent_activity", {
        p_partner_id: partnerId,
        p_limit: limit,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      return (data as any[]).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name || "System",
        action: row.action || "",
        actionType: row.action_type || "",
        entityType: row.entity_type || "",
        createdAt: row.created_at,
      }));
    } catch (err) {
      // Fallback to direct queries if RPC not available
      return await DashboardRPCService._fetchRecentActivityFallback(
        partnerId,
        limit,
      );
    }
  },

  /**
   * Fallback implementation: Direct queries for recent activity
   */
  async _fetchRecentActivityFallback(
    partnerId: string,
    limit: number,
  ): Promise<RecentActivityItem[]> {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, created_at, event_type, table_name")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !logs) {
        return [];
      }

      const userIds = Array.from(
        new Set((logs as any[]).map((l) => l.user_id).filter(Boolean)),
      );

      let usersMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds as any[]);

        if (users) {
          (users as any[]).forEach((u: any) => {
            usersMap[u.id] = u.full_name || u.email || "User";
          });
        }
      }

      return (logs as any[]).map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userName: usersMap[log.user_id] || "System",
        action: log.action || "",
        actionType: log.event_type || "",
        entityType: log.table_name || "",
        createdAt: log.created_at,
      }));
    } catch (err) {
      console.error("Error fetching recent activity fallback:", err);
      return [];
    }
  },

  /**
   * Fetch dashboard metrics (30-day aggregates)
   * Attempts to use RPC; falls back to client-side aggregation if RPC not available
   */
  async fetchDashboardMetrics(
    partnerId: string,
    days: number = 30,
  ): Promise<DashboardMetric[]> {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_metrics", {
        p_partner_id: partnerId,
        p_days: days,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      return (data as any[]).map((row: any) => ({
        dateKey: row.date_key,
        dateFormatted: row.date_formatted,
        earnings: row.earnings || 0,
        withdrawals: row.withdrawals || 0,
        engagements: row.engagements || 0,
        engagementCount: row.engagement_count || 0,
      }));
    } catch (err) {
      // RPC not available; use DashboardClient for client-side aggregation
      return [];
    }
  },
};
