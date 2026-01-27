import { useMemo } from "react";
import createdUsersData from "../auth/data/created_users.json";
import userMetricsData from "../auth/data/user_metrics.json";
import { JsonUser } from "../auth/handleJsonAuth";

export interface UserTeamData {
  childUsers: any[];
  teamMetrics: any[];
  totalTeamEarnings: number;
  totalTeamCampaigns: number;
  averagePerformanceScore: number;
  teamSize: number;
}

/**
 * Hook to get team data for admin users who have created child users
 */
export function useTeamData(user: JsonUser | null) {
  return useMemo(() => {
    const result: UserTeamData = {
      childUsers: [],
      teamMetrics: [],
      totalTeamEarnings: 0,
      totalTeamCampaigns: 0,
      averagePerformanceScore: 0,
      teamSize: 0,
    };

    if (!user) return result;

    try {
      // Get all child users created by this user
      const childUsers = createdUsersData.created_users.filter(
        (cu: any) => cu.parent_user_id === user.id
      );

      result.childUsers = childUsers;
      result.teamSize = childUsers.length;

      if (childUsers.length === 0) return result;

      // Get metrics for all child users
      const teamMetrics = userMetricsData.user_metrics.filter((metric: any) =>
        childUsers.some((cu: any) => cu.id === metric.user_id)
      );

      result.teamMetrics = teamMetrics;

      // Calculate aggregate metrics
      result.totalTeamEarnings = teamMetrics.reduce(
        (sum: number, metric: any) => sum + (metric.total_earnings || 0),
        0
      );

      result.totalTeamCampaigns = teamMetrics.reduce(
        (sum: number, metric: any) => sum + (metric.total_campaigns || 0),
        0
      );

      result.averagePerformanceScore =
        teamMetrics.length > 0
          ? Math.round(
              teamMetrics.reduce(
                (sum: number, metric: any) =>
                  sum + (metric.performance_score || 0),
                0
              ) / teamMetrics.length
            )
          : 0;
    } catch (err) {
      console.error("useTeamData: error loading team data", err);
    }

    return result;
  }, [user?.id]);
}

/**
 * Hook to get metrics for a specific user
 */
export function useUserMetrics(userId: string | null) {
  return useMemo(() => {
    if (!userId) return null;

    try {
      return (
        userMetricsData.user_metrics.find(
          (metric: any) => metric.user_id === userId
        ) || null
      );
    } catch (err) {
      console.error("useUserMetrics: error loading user metrics", err);
      return null;
    }
  }, [userId]);
}

/**
 * Hook to get a specific child user's information
 */
export function useChildUser(userId: string | null) {
  return useMemo(() => {
    if (!userId) return null;

    try {
      return (
        createdUsersData.created_users.find((cu: any) => cu.id === userId) ||
        null
      );
    } catch (err) {
      console.error("useChildUser: error loading child user", err);
      return null;
    }
  }, [userId]);
}
