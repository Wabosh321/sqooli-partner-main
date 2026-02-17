/**
 * PHASE 4: Campaign Service Layer - Enhanced
 * Handles campaign operations via RPC functions and real-time subscriptions
 */

import { supabase } from "../../lib/supabase";
import type { Campaign } from "../../domain/campaign/types";

export interface CreateCampaignInput {
  partnerId: string;
  createdByUserId: string;
  campaignName: string;
  description?: string;
  durationStart: string;
  durationEnd: string;
  programId?: string;
  channels?: string[];
  budget?: number;
  metadata?: Record<string, any>;
}

export interface UpdateCampaignInput {
  campaignId: string;
  campaignName?: string;
  description?: string;
  status?:
    | "draft"
    | "active"
    | "pending"
    | "approved"
    | "declined"
    | "completed"
    | "expired";
  budget?: number;
  metadata?: Record<string, any>;
}

export const CampaignService = {
  // PHASE 4: Legacy method - kept for backward compatibility
  async fetchByPartner(partnerId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("partner_id", partnerId);

    if (error) throw error;
    return (data as any[]) || [];
  },

  // ============================================================================
  // PHASE 4: New RPC-based methods
  // ============================================================================

  /**
   * PHASE 4: Create campaign via RPC function
   * Executes atomic transaction with activity logging
   */
  async createCampaign(input: CreateCampaignInput): Promise<{
    success: boolean;
    campaignId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_create_campaign", {
        p_partner_id: input.partnerId,
        p_created_by_user_id: input.createdByUserId,
        p_campaign_name: input.campaignName,
        p_description: input.description,
        p_duration_start: input.durationStart,
        p_duration_end: input.durationEnd,
        p_program_id: input.programId,
        p_channels: JSON.stringify(input.channels || []),
        p_budget: input.budget,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error creating campaign:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        campaignId: data?.campaign_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error creating campaign:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Update campaign via RPC function
   * Logs changes to activity log
   */
  async updateCampaign(input: UpdateCampaignInput): Promise<{
    success: boolean;
    campaignId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_update_campaign", {
        p_campaign_id: input.campaignId,
        p_campaign_name: input.campaignName,
        p_description: input.description,
        p_status: input.status,
        p_budget: input.budget,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error updating campaign:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        campaignId: data?.campaign_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error updating campaign:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Delete campaign via RPC function
   * Cascades delete related tasks
   */
  async deleteCampaign(campaignId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_delete_campaign", {
        p_campaign_id: campaignId,
      });

      if (error) {
        console.error("Error deleting campaign:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error deleting campaign:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Fetch single campaign
   */
  async fetchCampaign(campaignId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) {
        console.error("Error fetching campaign:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error fetching campaign:", err);
      return null;
    }
  },

  /**
   * PHASE 4: Subscribe to real-time campaign changes
   * Triggers on INSERT, UPDATE, DELETE
   */
  subscribeToCampaignChanges(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`campaigns:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaigns",
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
  },

  /**
   * PHASE 4: Subscribe to campaign inserts (new campaigns)
   */
  subscribeToCampaignInserts(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`campaigns_insert:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campaigns",
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
  },
};
