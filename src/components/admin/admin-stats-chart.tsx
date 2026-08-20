"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface AdminStatsChartPoint {
  date: string;
  views: number;
  clicks: number;
  /** Null för dagar före visitorHash-migrationen — ritas som lucka, inte 0. */
  unique: number | null;
}

interface Props {
  data: AdminStatsChartPoint[];
  labels: { views: string; clicks: string; unique: string };
}

export function AdminStatsChart({ data, labels }: Props) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="adminViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Area
            type="monotone"
            dataKey="views"
            name={labels.views}
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#adminViews)"
          />
          <Line
            type="monotone"
            dataKey="clicks"
            name={labels.clicks}
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="unique"
            name={labels.unique}
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
