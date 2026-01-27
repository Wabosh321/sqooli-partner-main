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
}

export const walletService = new WalletService();
