import { useEffect, useState, useCallback } from "react";
import { CampaignService } from "../../infrastructure/campaign/campaign.service";
import type { Campaign } from "../../domain/campaign/types";

export function useCampaigns(partnerId?: string, enabled = false) {
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await CampaignService.fetchByPartner(partnerId);
      setCampaigns(data || []);
    } catch (err) {
      setError(err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (!enabled) return;
    fetch();
  }, [enabled, fetch]);

  return { campaigns, loading, error, refetch: fetch } as const;
}
