import { supabase } from "../../lib/supabase";
import type { Campaign } from "../../domain/campaign/types";

export const CampaignService = {
  async fetchByPartner(partnerId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("partner_id", partnerId);

    if (error) throw error;
    return (data as any[]) || [];
  },

  /**
   * Fetch campaigns with specific payment status
   * @param partnerId Partner ID
   * @param status Campaign status (e.g., 'active', 'completed', 'paused')
   * @returns Array of campaigns filtered by status
   */
  async fetchByStatus(partnerId: string, status: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  },

  /**
   * Fetch upcoming campaigns (start_date >= today)
   * @param partnerId Partner ID
   * @param limit Maximum number of campaigns
   * @returns Array of upcoming campaigns
   */
  async fetchUpcoming(
    partnerId: string,
    limit: number = 5,
  ): Promise<Campaign[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("partner_id", partnerId)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as any[]) || [];
  },

  /**
   * Count campaigns by status
   * @param partnerId Partner ID
   * @param status Campaign status
   * @returns Number of campaigns with the given status
   */
  async countByStatus(partnerId: string, status: string): Promise<number> {
    const { count, error } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId)
      .eq("status", status);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Update campaign status
   * @param campaignId Campaign ID
   * @param status New status
   * @returns Updated campaign
   */
  async updateStatus(campaignId: string, status: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from("campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  /**
   * Delete a campaign
   * @param campaignId Campaign ID
   */
  async delete(campaignId: string): Promise<void> {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) throw error;
  },

  /**
   * Count total campaigns for a partner
   * @param partnerId Partner ID
   * @returns Number of campaigns
   */
  async countByPartner(partnerId: string): Promise<number> {
    const { count, error } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId);

    if (error) throw error;
    return count || 0;
  },
};
