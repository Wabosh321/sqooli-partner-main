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

export default function LineChart() {
  const [activeTab, setActiveTab] = useState<
    "earnings" | "withdrawals" | "engagements"
  >("earnings");
  const { partner } = useAuth();
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  // Fetch metrics using centralized hook
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
          width: "100%",
          height: "100%",
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
          width: "100%",
          height: "100%",
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

  const activeData = chartDataMap[activeTab];

  // Responsive layout: header + body stacked vertically; sizes adapt to parent container
  const PADDING = 16;
  const HEADER_HEIGHT = 69;
  const GAP = 16;

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
          height: HEADER_HEIGHT,
          display: "flex",
          gap: GAP,
          alignItems: "flex-start",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {tabs.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                flex: "0 0 calc((100% - 32px) / 3)",
                height: "100%",
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
                backgroundColor: selected ? "#FFFFFF" : "transparent",
                boxShadow: selected ? "0px 1px 3px rgba(0,0,0,0.08)" : "none",
                opacity: 1,
                border: "none",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: selected ? "#111827" : "#6B7280",
                }}
              >
                {t.label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {t.value}
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
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          overflow: "hidden",
          paddingTop: 8,
          paddingRight: 16,
          paddingBottom: 16,
          paddingLeft: 16,
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart
              data={data}
              margin={{ top: 6, right: 12, left: 0, bottom: 16 }}
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
      // Root card: responsive container, lets parent control sizing
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
        opacity: 1,
        borderRadius: 16,
        overflow: "hidden",
        paddingTop: PADDING,
        paddingRight: PADDING,
        paddingBottom: PADDING,
        paddingLeft: PADDING,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <GraphHeader
        active={activeTab}
        onSelect={(id) => setActiveTab(id as any)}
      />
      <div style={{ height: 16 }} />
      <GraphBody data={activeData} />
    </div>
  );
}
