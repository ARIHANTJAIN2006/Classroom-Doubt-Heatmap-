"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

interface TrendChartProps {
  points: TrendPoint[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const point: TrendPoint = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{point.title}</p>
      <p className="text-ink-muted">{formatShortDate(point.date)}</p>
      <p className="mt-1 font-mono text-ink">
        {Math.round(point.confusionRate * 100)}% confusion · {point.totalMarks} marks
      </p>
    </div>
  );
}

export default function TrendChart({ points }: TrendChartProps) {
  const data = points.map((p) => ({
    ...p,
    label: formatShortDate(p.date),
    confusionPct: Math.round(p.confusionRate * 100),
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#D8DEDA" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5B6460", fontSize: 12 }}
            axisLine={{ stroke: "#D8DEDA" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5B6460", fontSize: 12 }}
            axisLine={{ stroke: "#D8DEDA" }}
            tickLine={false}
            width={40}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="confusionPct"
            stroke="#D6432F"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#D6432F", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
