/**
 * Infrastructure Layer: Wallet Data Access Service
 * Encapsulates Supabase queries, RPC calls, and real-time subscriptions
 * Phase 3: Enhanced with transaction recording, withdrawal processing, and real-time updates
 */

import { supabase } from "../../lib/supabase";
import type { Campaign, Transaction, Withdrawal } from "../../domain/wallet";

export interface IWalletService {
  fetchCampaigns(partnerId: string): Promise<Campaign[]>;
  fetchTransactions(partnerId: string): Promise<Transaction[]>;
  fetchWithdrawals(partnerId: string): Promise<Withdrawal[]>;
  fetchWalletBalance(
    partnerId: string,
  ): Promise<{ balance: number; pending: number } | null>;
  recordTransaction(input: {
    walletId: string;
    partnerId: string;
    userId: string;
    campaignId?: string;
    transactionType: "earnings" | "bonus" | "referral" | "adjustment";
    amount: number;
    description?: string;
    referenceNumber?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    newBalance?: number;
    error?: string;
  }>;
  requestWithdrawal(input: {
    walletId: string;
    partnerId: string;
    userId: string;
    amount: number;
    method: "mpesa" | "bank_transfer" | "paybill";
    details: Record<string, any>;
  }): Promise<{ success: boolean; withdrawalId?: string; error?: string }>;
  processWithdrawal(
    withdrawalId: string,
    status: "approved" | "rejected" | "processing" | "completed" | "failed",
    notes?: string,
    mpesaRef?: string,
  ): Promise<{ success: boolean; newBalance?: number; error?: string }>;
  subscribeToWalletChanges(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void;
  subscribeToTransactions(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void;
  subscribeToWithdrawals(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void;
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
   * Fetch wallet balance and pending withdrawals for a partner
   */
  async fetchWalletBalance(
    partnerId: string,
  ): Promise<{ balance: number; pending: number } | null> {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance, pending_withdrawals")
        .eq("partner_id", partnerId)
        .single();

      if (error) {
        console.error("Error fetching wallet balance:", error);
        return null;
      }

      return {
        balance: data?.balance || 0,
        pending: data?.pending_withdrawals || 0,
      };
    } catch (err) {
      console.error("Unexpected error fetching wallet balance:", err);
      return null;
    }
  }

  /**
   * Record a transaction using RPC function
   * Supports: earnings, bonuses, referrals, adjustments
   */
  async recordTransaction(input: {
    walletId: string;
    partnerId: string;
    userId: string;
    campaignId?: string;
    transactionType: "earnings" | "bonus" | "referral" | "adjustment";
    amount: number;
    description?: string;
    referenceNumber?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    newBalance?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_record_transaction", {
        p_wallet_id: input.walletId,
        p_partner_id: input.partnerId,
        p_user_id: input.userId,
        p_campaign_id: input.campaignId,
        p_transaction_type: input.transactionType,
        p_amount: input.amount,
        p_description: input.description,
        p_reference_number: input.referenceNumber,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error recording transaction:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        transactionId: data?.transaction_id,
        newBalance: data?.new_balance,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error recording transaction:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Request a withdrawal using RPC function
   */
  async requestWithdrawal(input: {
    walletId: string;
    partnerId: string;
    userId: string;
    amount: number;
    method: "mpesa" | "bank_transfer" | "paybill";
    details: Record<string, any>;
  }): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("rpc_request_withdrawal", {
        p_wallet_id: input.walletId,
        p_partner_id: input.partnerId,
        p_user_id: input.userId,
        p_amount: input.amount,
        p_method: input.method,
        p_details: input.details,
      });

      if (error) {
        console.error("Error requesting withdrawal:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        withdrawalId: data?.withdrawal_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error requesting withdrawal:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Process a withdrawal (approve/reject/complete) using RPC function
   */
  async processWithdrawal(
    withdrawalId: string,
    status: "approved" | "rejected" | "processing" | "completed" | "failed",
    notes?: string,
    mpesaRef?: string,
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("rpc_process_withdrawal", {
        p_withdrawal_id: withdrawalId,
        p_status: status,
        p_notes: notes,
        p_mpesa_ref: mpesaRef,
      });

      if (error) {
        console.error("Error processing withdrawal:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        newBalance: data?.new_balance,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error processing withdrawal:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Subscribe to real-time wallet balance changes
   */
  subscribeToWalletChanges(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`wallets:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(payload.new || payload.old);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribe to real-time transaction inserts
   */
  subscribeToTransactions(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`transactions:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribe to real-time withdrawal status changes
   */
  subscribeToWithdrawals(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`withdrawals:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawals",
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(payload.new || payload.old);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

export const walletService = new WalletService();
