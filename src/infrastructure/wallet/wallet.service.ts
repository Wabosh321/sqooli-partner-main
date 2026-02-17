/**
 * Infrastructure Layer: Wallet Data Access Service
 * Encapsulates Supabase queries and error handling
 */

import { supabase } from "../../lib/supabase";
import type { Campaign, Transaction, Withdrawal } from "../../domain/wallet";

export interface IWalletService {
  fetchCampaigns(partnerId: string): Promise<Campaign[]>;
  fetchTransactions(partnerId: string): Promise<Transaction[]>;
  fetchWithdrawals(partnerId: string): Promise<Withdrawal[]>;
  fetchWalletBalance(partnerId: string): Promise<number>;
  countTransactions(partnerId: string): Promise<number>;
  fetchDashboardMetrics(
    partnerId: string,
    days: number,
  ): Promise<
    Array<{
      date: string;
      earnings: number;
      withdrawals: number;
      engagements: number;
    }>
  >;
}

export class WalletService implements IWalletService {
  /**
   * Fetch all campaigns for a partner
   */
  async fetchCampaigns(partnerId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("partner_id", partnerId);

      if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }

      return (data as Campaign[]) || [];
    } catch (err) {
      console.error("Unexpected error fetching campaigns:", err);
      return [];
    }
  }

  /**
   * Fetch all transactions for a partner, ordered by creation date (newest first)
   */
  async fetchTransactions(partnerId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return [];
      }

      return (data as Transaction[]) || [];
    } catch (err) {
      console.error("Unexpected error fetching transactions:", err);
      return [];
    }
  }

  /**
   * Fetch all withdrawals for a partner (gracefully handles missing table)
   */
  async fetchWithdrawals(partnerId: string): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching withdrawals:", error);
        return [];
      }

      return (data as Withdrawal[]) || [];
    } catch (err) {
      // Withdrawals table may not exist in MVP
      console.debug("Withdrawals table not available or error:", err);
      return [];
    }
  }

  /**
   * Fetch wallet balance for a partner
   * Aggregates sum of all earnings minus withdrawals
   */
  async fetchWalletBalance(partnerId: string): Promise<number> {
    try {
      const { data: earnings, error: earningsError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("partner_id", partnerId)
        .eq("transaction_type", "earnings");

      if (earningsError) {
        console.error("Error fetching earnings:", earningsError);
        return 0;
      }

      const totalEarnings = ((earnings || []) as any[]).reduce(
        (sum, tx) => sum + (Number(tx.amount) || 0),
        0,
      );

      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("partner_id", partnerId)
        .eq("transaction_type", "withdrawal");

      if (withdrawalsError) {
        console.error("Error fetching withdrawals:", withdrawalsError);
        return totalEarnings;
      }

      const totalWithdrawals = ((withdrawals || []) as any[]).reduce(
        (sum, tx) => sum + (Number(tx.amount) || 0),
        0,
      );

      return totalEarnings - totalWithdrawals;
    } catch (err) {
      console.error("Unexpected error fetching wallet balance:", err);
      return 0;
    }
  }

  /**
   * Count transactions for a partner
   */
  async countTransactions(partnerId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId);

      if (error) {
        console.error("Error counting transactions:", error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error("Unexpected error counting transactions:", err);
      return 0;
    }
  }

  /**
   * Fetch dashboard metrics (30-day aggregates)
   * Returns daily aggregates by transaction type
   */
  async fetchDashboardMetrics(
    partnerId: string,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      earnings: number;
      withdrawals: number;
      engagements: number;
    }>
  > {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, transaction_type, created_at")
        .eq("partner_id", partnerId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching dashboard metrics:", error);
        return [];
      }

      // Generate date buckets
      const dayBuckets: Record<
        string,
        {
          date: string;
          earnings: number;
          withdrawals: number;
          engagements: number;
        }
      > = {};

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

      // Aggregate transactions
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
      console.error("Unexpected error fetching dashboard metrics:", err);
      return [];
    }
  }
}

export const walletService = new WalletService();
