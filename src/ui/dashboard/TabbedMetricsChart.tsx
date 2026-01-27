import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import transactionsData from "../../auth/data/transactions.json";
import { useAuth } from "../../hooks/useAuth";

function formatYAxis(value: number) {
  return value >= 1000 ? `${value / 1000}K` : `${value}`;
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function TabbedMetricsChart() {
  const [activeTab, setActiveTab] = useState<
    "earnings" | "withdrawals" | "engagements"
  >("earnings");
  const { partner } = useAuth();
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [withdrawalsData, setWithdrawalsData] = useState<any[]>([]);
  const [engagementsData, setEngagementsData] = useState<any[]>([]);

  useEffect(() => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString();

      // Filter transactions for this partner and last 30 days
      const txs = transactionsData.transactions.filter((t) => {
        const txDate = new Date(t.created_at).toISOString();
        return (!partnerId || t.partner_id === partnerId) && txDate >= sinceStr;
      });

      const bucket: Record<string, number> = {};
      const bucketWithdrawals: Record<string, number> = {};
      const bucketEng: Record<string, number> = {};

      const days: Date[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      }

      days.forEach((d) => {
        const key = d.toISOString().split("T")[0];
        bucket[key] = 0;
        bucketWithdrawals[key] = 0;
        bucketEng[key] = 0;
      });

      txs.forEach((t) => {
        const key = (t.created_at || "").split("T")[0];
        if (!key) return;
        const amt = Number(t.amount || 0);
        bucket[key] = (bucket[key] || 0) + amt;
        if (
          t.transaction_type === "withdrawal" ||
          t.transaction_type === "withdraw"
        ) {
          bucketWithdrawals[key] = (bucketWithdrawals[key] || 0) + amt;
        }
        if (
          t.transaction_type === "engagement" ||
          t.transaction_type === "engage"
        ) {
          bucketEng[key] = (bucketEng[key] || 0) + amt;
        }
      });

      setEarningsData(
        days.map((d) => ({
          date: formatDateLabel(d),
          value: bucket[d.toISOString().split("T")[0]] || 0,
        }))
      );
      setWithdrawalsData(
        days.map((d) => ({
          date: formatDateLabel(d),
          value: bucketWithdrawals[d.toISOString().split("T")[0]] || 0,
        }))
      );
      setEngagementsData(
        days.map((d) => ({
          date: formatDateLabel(d),
          value: bucketEng[d.toISOString().split("T")[0]] || 0,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, [partnerId]);

  const chartDataMap: Record<string, any[]> = {
    earnings: earningsData,
    withdrawals: withdrawalsData,
    engagements: engagementsData,
  };

  const earningsSum = earningsData.reduce((acc, d) => acc + (d.value || 0), 0);
  const withdrawalsSum = withdrawalsData.reduce(
    (acc, d) => acc + (d.value || 0),
    0
  );
  const engagementsSum = engagementsData.reduce(
    (acc, d) => acc + (d.value || 0),
    0
  );

  const tabs = [
    {
      id: "earnings",
      label: "Earnings",
      value: `KES ${earningsSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      id: "withdrawals",
      label: "Withdrawals",
      value: `KES ${withdrawalsSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      id: "engagements",
      label: "Engagements",
      value: engagementsSum.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
    },
  ];

  const activeData = chartDataMap[activeTab];
  // Exact spec constants
  const ROOT_WIDTH = 956;
  const ROOT_HEIGHT = 379;
  const PADDING = 16;
  const TABS_CONTAINER = { x: 16, y: 16, width: 924, height: 69 };
  const TAB_WIDTH = 297.333333;
  const TAB_HEIGHT = 69;
  const GAP = 16;
  const TAB_LEFTS = [0, TAB_WIDTH + GAP, TAB_WIDTH * 2 + GAP * 2];

  function GraphHeader({
    active,
    onSelect,
  }: {
    active: string;
    onSelect: (id: string) => void;
  }) {
    return (
      <div
        style={{
          position: "absolute",
          left: TABS_CONTAINER.x,
          top: TABS_CONTAINER.y,
          width: TABS_CONTAINER.width,
          height: TABS_CONTAINER.height,
          boxSizing: "border-box",
        }}
      >
        {/* Selected tab background layer */}
        {(() => {
          const selectedIndex = tabs.findIndex((t) => t.id === active);
          if (selectedIndex === -1) return null;
          const left = TAB_LEFTS[selectedIndex];
          return (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left,
                top: 0,
                width: `${TAB_WIDTH}px`,
                height: `${TAB_HEIGHT}px`,
                backgroundColor: "#FFFFFF",
                opacity: 1,
                borderRadius: 12,
                boxShadow: "0px 1px 3px rgba(0,0,0,0.08)",
                zIndex: 1,
                pointerEvents: "none",
                boxSizing: "border-box",
              }}
            />
          );
        })()}

        {tabs.map((tab, i) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              style={{
                position: "absolute",
                left: TAB_LEFTS[i],
                top: 0,
                width: `${TAB_WIDTH}px`,
                height: `${TAB_HEIGHT}px`,
                paddingTop: 16,
                paddingRight: 8,
                paddingBottom: 8,
                paddingLeft: 16,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                gap: 4,
                boxSizing: "border-box",
                backgroundColor: "transparent",
                opacity: 1,
                border: "none",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              <span
                className="text-sm font-normal"
                style={{ color: selected ? "#111827" : "#6B7280" }}
              >
                {tab.label}
              </span>
              <span className="text-2xl font-bold" style={{ color: "#111827" }}>
                {tab.value}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  function GraphBody({ data }: { data: any[] }) {
    return (
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 101,
          width: 924,
          height: 278,
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          zIndex: 0,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart
              data={data}
              margin={{ top: 6, right: 12, left: 16, bottom: 16 }}
            >
              <CartesianGrid
                stroke="#E5E7EB"
                strokeDasharray="0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 16000]}
                ticks={[0, 4000, 8000, 12000, 16000]}
                tickFormatter={formatYAxis}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${ROOT_WIDTH}px`,
        height: `${ROOT_HEIGHT}px`,
        backgroundColor: "#FFFFFF",
        opacity: 1,
        borderRadius: 16,
        overflow: "hidden",
        paddingTop: PADDING,
        paddingRight: PADDING,
        paddingBottom: PADDING,
        paddingLeft: PADDING,
        boxSizing: "content-box",
        position: "relative",
        zIndex: 0,
      }}
    >
      <GraphHeader
        active={activeTab}
        onSelect={(id) => setActiveTab(id as any)}
      />
      <GraphBody data={activeData} />
    </div>
  );
}
