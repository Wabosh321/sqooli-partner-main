import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardMetrics } from "../../application/dashboard/useDashboardMetrics";

function formatYAxis(value: number) {
  return value >= 1000 ? `${value / 1000}K` : `${value}`;
}

export default function TabbedMetricsChart() {
  const [activeTab, setActiveTab] = useState<
    "earnings" | "withdrawals" | "engagements"
  >("earnings");
  const { partner } = useAuth();
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  // Fetch metrics using centralized hook (shared with LineChart)
  const {
    data: metrics,
    isLoading,
    error,
  } = useDashboardMetrics(partnerId, 30);

  // Map metrics to chart data by tab
  const earningsData =
    metrics?.map((m) => ({
      date: m.date,
      value: m.earnings,
    })) ?? [];
  const withdrawalsData =
    metrics?.map((m) => ({
      date: m.date,
      value: m.withdrawals,
    })) ?? [];
  const engagementsData =
    metrics?.map((m) => ({
      date: m.date,
      value: m.engagements,
    })) ?? [];

  const chartDataMap: Record<string, any[]> = {
    earnings: earningsData,
    withdrawals: withdrawalsData,
    engagements: engagementsData,
  };

  const earningsSum = earningsData.reduce((acc, d) => acc + (d.value || 0), 0);
  const withdrawalsSum = withdrawalsData.reduce(
    (acc, d) => acc + (d.value || 0),
    0,
  );
  const engagementsSum = engagementsData.reduce(
    (acc, d) => acc + (d.value || 0),
    0,
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

  if (error) {
    return (
      <div
        style={{
          width: "956px",
          height: "379px",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ color: "#DC2626", fontSize: 14, fontWeight: 500 }}>
          Error loading metrics
        </div>
        <div style={{ color: "#6B7280", fontSize: 12 }}>{error.message}</div>
      </div>
    );
  }

  if (isLoading || metrics === undefined) {
    return (
      <div
        style={{
          width: "956px",
          height: "379px",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#9CA3AF" }}>Loading metrics...</div>
      </div>
    );
  }
  // Exact spec constants
  const ROOT_WIDTH = 956;
  const ROOT_HEIGHT = 379;
  const PADDING = 16;
  const TABS_CONTAINER = { x: 16, y: 16, width: 924, height: 69 };
  const TAB_WIDTH = 297.333333;
  const TAB_HEIGHT = 69;
  const GAP = 16;
  const TAB_LEFTS = [0, TAB_WIDTH + GAP, TAB_WIDTH * 2 + GAP * 2];

  const activeData = chartDataMap[activeTab];

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
