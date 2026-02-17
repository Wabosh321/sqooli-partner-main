import React from "react";
import {
  Briefcase,
  Megaphone,
  ThumbsUp,
  MessageSquare,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardStats } from "../../application/dashboard/useDashboardStats";

export default function SmallCardsGrid() {
  const { partner } = useAuth();
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  // Fetch all stats using centralized hook
  const { stats, isLoading, error } = useDashboardStats(partnerId);

  const totalCampaigns = stats?.totalCampaigns ?? null;
  const ongoingCampaigns = stats?.ongoingCampaigns ?? null;
  const engagements = stats?.engagements ?? null;
  const purchases = stats?.purchases ?? null;
  const walletBalance = stats?.walletBalance ?? 0;
  const balanceChange = stats?.balanceChange ?? 0;

  return (
    <div
      className="bg-white w-full h-full flex-1"
      style={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        padding: "max(1.1vw, 16px)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "hidden",
      }}
    >
      {error && <div className="text-red-500 text-xs">Error loading stats</div>}

      {/* Primary Section */}
      <div className="flex flex-col gap-0" style={{ flex: "0 0 auto" }}>
        <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center mb-1">
          <Briefcase className="w-3 h-3 text-orange-500" />
        </div>
        <p className="text-xs text-gray-500 font-normal">Total Earnings</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900">
            KES{" "}
            {walletBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <span
            className={`${balanceChange >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5`}
          >
            <ArrowUp className="w-2 h-2" />
            <span className="text-xs">{Math.abs(balanceChange)}%</span>
          </span>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-4 gap-4" style={{ flex: 1, minHeight: 0 }}>
        <div className="flex flex-col gap-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center bg-orange-100 text-orange-500`}
          >
            <Megaphone className={`w-3 h-3 text-orange-500`} />
          </div>
          <p className="text-xs text-gray-500 font-normal leading-tight">
            Total Campaigns
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading ? "-" : (totalCampaigns ?? "—")}
          </p>
        </div>

        <div className="flex flex-col gap-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center bg-orange-100 text-orange-500`}
          >
            <Megaphone className={`w-3 h-3 text-orange-500`} />
          </div>
          <p className="text-xs text-gray-500 font-normal leading-tight">
            Ongoing Campaigns
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading ? "-" : (ongoingCampaigns ?? "—")}
          </p>
        </div>

        <div className="flex flex-col gap-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center bg-green-100 text-green-500`}
          >
            <ThumbsUp className={`w-3 h-3 text-green-500`} />
          </div>
          <p className="text-xs text-gray-500 font-normal leading-tight">
            Engagements
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading ? "-" : (engagements ?? "—")}
          </p>
        </div>

        <div className="flex flex-col gap-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center bg-green-100 text-green-500`}
          >
            <MessageSquare className={`w-3 h-3 text-green-500`} />
          </div>
          <p className="text-xs text-gray-500 font-normal leading-tight">
            Purchases
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {isLoading ? "-" : (purchases ?? "—")}
          </p>
        </div>
      </div>
    </div>
  );
}
