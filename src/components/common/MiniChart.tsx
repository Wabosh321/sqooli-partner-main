import React from "react";

type MiniChartProps = {
  data?: number[];
  className?: string;
};

const MiniChart: React.FC<MiniChartProps> = ({ data = [], className = "" }) => {
  const width = 160;
  const height = 40;

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-muted-foreground ${className}`}>
        No data
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="40" className={className}>
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default MiniChart;
