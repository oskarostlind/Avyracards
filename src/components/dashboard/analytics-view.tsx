"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MousePointerClick, Eye, TrendingUp } from "lucide-react";

interface AnalyticsProps {
  stats: {
    totalViews: number;
    totalClicks: number;
    ctr: string; 
  };
  chartData: {
    date: string;
    views: number;
    clicks: number;
  }[];
  topLinks: {
    title: string;
    url: string;
    clicks: number; // <-- VIKTIGT: Namnet här måste matcha vad vi skickar från page.tsx
  }[];
}

export function AnalyticsView({ stats, chartData, topLinks }: AnalyticsProps) {
  return (
    <div className="space-y-8">
      {/* 1. Översiktskort (KPIer) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Profilvisningar"
          value={stats.totalViews}
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          subtitle="Senaste 30 dagarna"
        />
        <StatCard
          title="Länkklick"
          value={stats.totalClicks}
          icon={<MousePointerClick className="h-5 w-5 text-green-400" />}
          subtitle="Totalt antal klick"
        />
        <StatCard
          title="Klickfrekvens (CTR)"
          value={`${stats.ctr}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
          subtitle="Besökare som klickar"
        />
      </div>

      {/* 2. Huvudgraf */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold text-slate-100">
          Aktivitet över tid
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  color: "#f8fafc",
                }}
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Visningar"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                name="Klick"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Topplista */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Mest klickade länkar
        </h3>
        <div className="space-y-4">
          {topLinks.length === 0 ? (
            <p className="text-sm text-slate-400">Ingen data ännu.</p>
          ) : (
            topLinks.map((link, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-slate-700"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-slate-200">
                    {link.title || link.url}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {link.url}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1 font-mono text-sm font-bold text-green-400">
                  {link.clicks}
                  <span className="text-[10px] font-normal text-slate-500">
                    KLICK
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="rounded-full bg-slate-800/50 p-2">{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-slate-50">{value}</div>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}