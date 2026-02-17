import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Megaphone,
  ThumbsUp,
  MessageSquare,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

export default function SmallCardsGrid() {
  const { partner } = useAuth();
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
  const [ongoingCampaigns, setOngoingCampaigns] = useState<number | null>(null);
  const [engagements, setEngagements] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [balanceChange, setBalanceChange] = useState<number>(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!partnerId) {
          setTotalCampaigns(0);
          setOngoingCampaigns(0);
          setEngagements(0);
          setPurchases(0);
          setWalletBalance(0);
          setBalanceChange(0);
          return;
        }

        // Fetch campaigns for this partner
        const { data: campaigns, error: campaignsError } = await supabase
          .from("campaigns")
          .select("id, status")
          .eq("partner_id", partnerId);

        if (campaignsError) throw campaignsError;

        const totalCount = campaigns?.length || 0;
        const ongoingCount =
          campaigns?.filter((c) => c.status === "active").length || 0;

        // Fetch transactions for this partner
        const { data: transactions, error: transError } = await supabase
          .from("transactions")
          .select("id, transaction_type")
          .eq("partner_id", partnerId);

        if (transError) throw transError;

        const txCount = transactions?.length || 0;
        const purchaseCount =
          transactions?.filter((t) => t.transaction_type === "purchase")
            .length || 0;

        // Fetch wallet for this partner
        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("balance, total_earned")
          .eq("partner_id", partnerId)
          .single();

        if (walletError && walletError.code !== "PGRST116") throw walletError;

        const currentBalance = wallet?.balance || 0;
        const totalEarned = wallet?.total_earned || 0;
        const changePercent =
          totalEarned > 0 ? (currentBalance / totalEarned) * 100 - 100 : 0;

        setTotalCampaigns(totalCount);
        setOngoingCampaigns(ongoingCount);
        setEngagements(txCount);
        setPurchases(purchaseCount);
        setWalletBalance(currentBalance);
        setBalanceChange(Math.round(changePercent));
      } catch (err) {
        console.error("SmallCardsGrid: error loading stats", err);
        setTotalCampaigns(0);
        setOngoingCampaigns(0);
        setEngagements(0);
        setPurchases(0);
        setWalletBalance(0);
        setBalanceChange(0);
      }
    };

    loadStats();
  }, [partnerId]);

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
            {totalCampaigns ?? "—"}
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
            {ongoingCampaigns ?? "—"}
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
            {engagements ?? "—"}
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
            {purchases ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
