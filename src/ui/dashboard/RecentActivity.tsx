import React, { useEffect, useState } from "react";
import { DashboardColors } from "../../theme/dashboardTheme";
import { useAuth } from "../../hooks/useAuth";
import userActivityData from "../../auth/data/user_activity.json";
import createdUsersData from "../../auth/data/created_users.json";

export default function RecentActivity() {
  const { user } = useAuth();
  const [items, setItems] = useState<
    { id: string; user: string; action: string; time: string }[]
  >([]);

  useEffect(() => {
    try {
      if (!user) {
        setItems([]);
        return;
      }

      // Get all activities for this user and their created users
      let relevantActivities = userActivityData.user_activities.filter(
        (activity: any) => {
          // Show own activities
          if (activity.user_id === user.id) return true;
          // Show activities from users created by this user (if they're an admin)
          if (activity.parent_user_id === user.id) return true;
          return false;
        }
      );

      // Sort by most recent first and take top 10
      const sortedActivities = [...relevantActivities]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 10);

      setItems(
        sortedActivities.map((activity: any) => ({
          id: activity.id,
          user: activity.user_name || "System",
          action: activity.action,
          time: activity.timestamp
            ? new Date(activity.timestamp).toLocaleString()
            : "",
        }))
      );
    } catch (err) {
      console.error("RecentActivity: error loading user activities", err);
      setItems([]);
    }
  }, [user]);

  return (
    <div
      className="w-full h-full flex-1"
      style={{
        background: DashboardColors.section_background,
        border: `1px solid ${DashboardColors.border_muted}`,
        borderRadius: "12px",
        padding: "max(1.1vw, 12px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between mb-2"
        style={{ flex: "0 0 auto" }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: DashboardColors.text_secondary }}
        >
          Recent Activity
        </p>
        <a
          href="#"
          className="text-xs font-medium"
          style={{ color: DashboardColors.primary }}
        >
          View All
        </a>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-start gap-2 pb-2 border-b last:border-0 text-xs"
            style={{
              borderColor: DashboardColors.border_muted,
              flex: "0 0 auto",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-xs text-white"
              style={{ background: DashboardColors.primary }}
            >
              {it.user.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium leading-tight"
                style={{ color: DashboardColors.text_secondary }}
              >
                <span
                  style={{ color: DashboardColors.primary }}
                  className="font-semibold"
                >
                  {it.user}
                </span>{" "}
                {it.action}
              </p>
              <p
                className="text-xs mt-0.5 leading-tight"
                style={{ color: DashboardColors.text_muted }}
              >
                {it.time}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500">No recent activity.</div>
        )}
      </div>
    </div>
  );
}
