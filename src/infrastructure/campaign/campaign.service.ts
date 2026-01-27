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
};
