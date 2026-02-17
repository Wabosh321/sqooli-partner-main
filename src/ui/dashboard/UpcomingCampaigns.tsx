import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function UpcomingCampaigns() {
  const { partner } = useAuth();
  const [items, setItems] = useState<
    { name: string; date: string; variant?: string }[]
  >([]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const partnerId = (partner as any)?.id || (partner as any)?._id;
        if (!partnerId) {
          setItems([]);
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        // Fetch upcoming campaigns from Supabase
        const { data: campaigns, error } = await supabase
          .from("campaigns")
          .select("id, name, duration_start")
          .eq("partner_id", partnerId)
          .gte("duration_start", today)
          .order("duration_start", { ascending: true })
          .limit(5);

        if (error) throw error;

        setItems(
          (campaigns || []).map((c: any) => ({
            name: c.name || "Untitled",
            date: c.duration_start
              ? new Date(c.duration_start).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "TBD",
            variant: "default",
          })),
        );
      } catch (err) {
        console.error("UpcomingCampaigns: error loading campaigns", err);
        setItems([]);
      }
    };

    loadCampaigns();
  }, [partner]);

  return (
    <div
      className="w-full h-full rounded-xl p-4 flex flex-col gap-4 border"
      style={{
        background:
          "linear-gradient(116.26deg, #F7DDFD 23.59%, rgba(216, 231, 243, 0.93) 79.56%)",
        borderColor: "#EAECF0",
        overflow: "hidden",
      }}
    >
      {/* Header with Icon */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-sm bg-white/50 flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#9F0BC1]" strokeWidth={1.67} />
        </div>
        <h2 className="text-[#101828] font-medium text-base">
          Upcoming Campaigns
        </h2>
      </div>

      {/* Campaign List with fixed item heights */}
      <div className="relative flex-1 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">
            No upcoming campaigns found.
          </div>
        ) : (
          <>
            {items.map((it, idx) => {
              const bg =
                idx === 0
                  ? "bg-white"
                  : idx === 1
                    ? "bg-[#FDF6D8]"
                    : "bg-[#EEF6FC]";
              const border =
                idx === 0
                  ? "border-[#CFCCFF]"
                  : idx === 1
                    ? "border-[#FAE99E]"
                    : "transparent";
              return (
                <div
                  key={idx}
                  className={`w-full h-[42px] rounded-lg px-3 flex items-center gap-2 ${bg}`}
                  style={{ borderLeft: `2px solid ${border}` }}
                >
                  <span className="text-[#667085] text-xs">{it.date}</span>
                  <span className="text-[#667085] text-xs">|</span>
                  <span className="text-[#101828] text-xs font-medium truncate">
                    {it.name}
                  </span>
                </div>
              );
            })}
            {/* Partially visible placeholder if fewer than 3 items */}
            {items.length < 3 && (
              <div className="w-full h-[42px] rounded-lg bg-[#EEF6FC] px-3 flex items-center gap-2" />
            )}
          </>
        )}

        {/* Scrollbar indicator */}
        <div className="absolute right-0 top-2 w-2 h-6 rounded-full bg-[#EAECF0]" />
      </div>
    </div>
  );
}
