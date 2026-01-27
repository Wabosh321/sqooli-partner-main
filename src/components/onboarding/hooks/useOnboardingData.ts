import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface UseOnboardingDataProps {
  partnerId?: string;
}

export function useOnboardingData({ partnerId }: UseOnboardingDataProps) {
  const [wallet, setWallet] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("partner_id", partnerId)
        .single();

      // Fetch campaign
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("partner_id", partnerId)
        .limit(1);

      setWallet(walletData);
      setCampaign(campaignData?.length > 0 ? campaignData[0] : null);
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  return { wallet, campaign, loading, refetch: fetchData };
}
