import { useEffect, useState } from "react";
import programsData from "../auth/data/programs.json";
import campaignsData from "../auth/data/campaigns.json";
import { useUserHierarchy } from "./useUserHierarchy";

export function useUserPrograms() {
  const { userIds } = useUserHierarchy();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    // Get campaigns created by user
    const userCampaigns = campaignsData.campaigns.filter((campaign: any) =>
      userIds.includes(campaign.created_by_user_id),
    );

    // Get unique program IDs from user campaigns
    const userProgramIds = new Set(
      userCampaigns.map((campaign: any) => campaign.program_id),
    );

    // Filter programs that are used in user campaigns
    const userPrograms = programsData.programs.filter((program: any) =>
      userProgramIds.has(program.id),
    );

    setPrograms(userPrograms);
    setLoading(false);
  }, [userIds]);

  return {
    programs,
    loading,
  };
}
