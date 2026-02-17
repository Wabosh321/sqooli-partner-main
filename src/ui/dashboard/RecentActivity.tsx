import React, { useEffect, useState } from "react";
import { DashboardColors } from "../../theme/dashboardTheme";
import { useAuth } from "../../hooks/useAuth";
// PHASE 4: Supabase integration for activity logs
import { supabase } from "../../lib/supabase";

export default function RecentActivity() {
  const { user } = useAuth();
  const [items, setItems] = useState<
    { id: string; user: string; action: string; time: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    const loadActivities = async () => {
      try {
        // PHASE 4: Fetch recent activities from user_activity_log
        const { data: activities, error } = await supabase
          .from("user_activity_log")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        setItems(
          (activities || []).map((activity: any) => ({
            id: activity.id,
            user: activity.user_name || "System",
            action: activity.action,
            time: activity.created_at
              ? new Date(activity.created_at).toLocaleString()
              : "",
          })),
        );
      } catch (err) {
        console.error("RecentActivity: error loading activities", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();

    // PHASE 4: Subscribe to real-time activity changes
    const subscription = supabase
      .channel("recent_activity_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activity_log",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newActivity = {
            id: payload.new.id,
            user: payload.new.user_name || "System",
            action: payload.new.action,
            time: payload.new.created_at
              ? new Date(payload.new.created_at).toLocaleString()
              : "",
          };
          setItems((prev) => [newActivity, ...prev.slice(0, 9)]);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

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
        {loading ? (
          <div className="text-sm text-gray-500 flex items-center justify-center py-8">
            Loading activities...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 flex items-center justify-center py-8">
            No recent activity.
          </div>
        ) : (
          items.map((it) => (
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
          ))
        )}
      </div>
    </div>
  );
}
