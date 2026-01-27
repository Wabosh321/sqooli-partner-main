import { useEffect, useState } from "react";
import campaignsData from "../auth/data/campaigns.json";
import { useUserHierarchy } from "./useUserHierarchy";

export function useUserCampaigns() {
  const { userIds, isAdminPartner } = useUserHierarchy();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    // Filter campaigns created by current user or child users
    const userCampaigns = campaignsData.campaigns.filter((campaign: any) =>
      userIds.includes(campaign.created_by_user_id),
    );

    setCampaigns(userCampaigns);
    setLoading(false);
  }, [userIds]);

  return {
    campaigns,
    loading,
  };
}
