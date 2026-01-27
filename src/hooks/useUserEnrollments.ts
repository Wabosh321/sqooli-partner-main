import enrollmentsData from "../auth/data/enrollments.json";
import { useUserCampaigns } from "./useUserCampaigns";
import { useEffect, useState } from "react";

export function useUserEnrollments() {
  const { campaigns, loading: campaignsLoading } = useUserCampaigns();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignsLoading) return;

    const campaignIds = campaigns.map((c) => c.id);

    // Filter enrollments for campaigns created by user
    const userEnrollments = enrollmentsData.program_enrollments.filter(
      (enrollment: any) => campaignIds.includes(enrollment.campaign_id),
    );

    setEnrollments(userEnrollments);
    setLoading(false);
  }, [campaigns, campaignsLoading]);

  return {
    enrollments,
    loading,
  };
}
