"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { Info, MousePointerClick, Eye, TrendingUp, Lock, Globe as GlobeIcon, QrCode, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe } from "./globe"; 
import type { EventType } from "@prisma/client";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

type ChartDatum = { date: string; views: number; clicks: number };
type TopLink = { title: string; url: string; clicks: number };
type TrafficSource = { name: string; value: number };
type TopCountry = { code: string; count: number };

type RecentActivityItem = {
  id: string;
  type: EventType;
  country: string | null;
  city: string | null;
  device: string | null;
  timeAgo: string;
  source: string;
  actionName: string;
};

type RowsToShow = 10 | 25 | 50 | 100 | "all";

type AnalyticsProps = {
  isPremium: boolean;
  stats: {
    totalViews: number;
    totalClicks: number;
    ctr: string;
    totalVcardDownloads: number;
  };
  chartData: ChartDatum[];
  topLinks: TopLink[];
  trafficSources: TrafficSource[];
  topCountries: TopCountry[];
  recentActivity: RecentActivityItem[];
  historyActivity: RecentActivityItem[];
  currentDays: number;
};

export function AnalyticsView({ 
  isPremium,
  stats,
  chartData,
  topLinks,
  trafficSources,
  topCountries,
  recentActivity,
  historyActivity,
  currentDays,
}: AnalyticsProps) {
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [rowsToShow, setRowsToShow] = useState<RowsToShow>(10);

  const visibleHistory = useMemo(() => {
    if (rowsToShow === "all") return historyActivity;
    return historyActivity.slice(0, rowsToShow);
  }, [historyActivity, rowsToShow]);

  const handleDateChange = (e: ChangeEvent<HTMLSelectElement>) => {
      const days = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      params.set('days', days);
      router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const fallbackCountries: TopCountry[] = [
    { code: "SE", count: 42 },
    { code: "US", count: 12 },
  ];

  const fallbackTrafficSources: TrafficSource[] = [
    { name: "Instagram", value: 65 },
    { name: "LinkedIn", value: 20 },
    { name: "Direkt", value: 15 },
  ];

  const barData: TrafficSource[] = isPremium
    ? trafficSources.length
      ? trafficSources
      : [{ name: "Ingen data", value: 0 }]
    : fallbackTrafficSources;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. KPIer - Nu med 4 kolumner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Profilvisningar" value={stats.totalViews} icon={<Eye className="h-5 w-5 text-blue-400" />} subtitle={`Senaste ${currentDays} dagarna`} />
        {/* NYTT KORT */}
        <StatCard title="Sparade kontakter" value={stats.totalVcardDownloads} icon={<Save className="h-5 w-5 text-emerald-400" />} subtitle={`Senaste ${currentDays} dagarna`} />
        <StatCard title="Länkklick" value={stats.totalClicks} icon={<MousePointerClick className="h-5 w-5 text-sky-400" />} subtitle={`Senaste ${currentDays} dagarna`} />
        <StatCard title="Klickfrekvens (CTR)" value={`${stats.ctr}%`} icon={<TrendingUp className="h-5 w-5 text-purple-400" />} subtitle="Besökare som klickar" />
      </div>

      {/* 2. Huvudgraf */}
      <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-100">Aktivitet över tid</h3>
            <select 
                value={currentDays}
                onChange={handleDateChange}
                className="bg-slate-800 text-sm text-slate-200 rounded-lg px-3 py-2 border border-nordic-highlight/40 outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
                <option value={7}>Senaste 7 dagarna</option>
                <option value={14}>Senaste 14 dagarna</option>
                <option value={30}>Senaste 30 dagarna</option>
                <option value={90}>Senaste 90 dagarna</option>
                <option value={365}>Senaste året</option>
            </select>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }} />
              <Line type="monotone" dataKey="views" name="Visningar" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="clicks" name="Klick" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. PREMIUM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GEOGRAFI & KARTA */}
        <div className="relative flex flex-col rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between mb-4 z-10">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <GlobeIcon className="h-5 w-5 text-indigo-400" /> Geografi
            </h3>
            {isPremium && <span className="text-xs text-indigo-400 font-mono animate-pulse">LIVE MAP</span>}
          </div>

              <PremiumLock isPremium={isPremium} title="Se var dina besökare finns">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 md:opacity-100 mt-10">
                    <Globe className="scale-125" /> 
                </div>
                
                <div className="relative z-10 space-y-3 mt-4 bg-nordic-primary/30 p-4 rounded-xl backdrop-blur-sm border border-white/5 max-w-[250px]">
                  {(isPremium ? topCountries : fallbackCountries).length === 0 ? (
                    <p className="text-xs text-nordic-highlight">Väntar på geodata...</p>
                  ) : (
                    (isPremium ? topCountries : fallbackCountries).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{getFlagEmoji(c.code)}</span>
                          <span className="text-slate-200">{getCountryName(c.code)}</span>
                        </div>
                        <span className="font-bold text-nordic-highlight">{c.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </PremiumLock>
        </div>

        {/* TRAFIKKÄLLOR */}
        <div className="relative rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl overflow-hidden">
          <h3 className="mb-6 text-lg font-semibold text-slate-100 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-pink-400" /> Trafikkällor
          </h3>
          <PremiumLock isPremium={isPremium} title="Se hur folk hittar dig">
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={70} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#8b5cf6', '#64748b'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
               </ResponsiveContainer>
            </div>
          </PremiumLock>
        </div>
      </div>

      {/* 4. SENASTE AKTIVITET & TOPPLISTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Live Feed */}
        <div className="relative rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
             <h3 className="mb-4 text-lg font-semibold text-slate-100">Live-aktivitet</h3>
             <PremiumLock isPremium={isPremium} title="Se vem som tittar just nu">
                <div className="space-y-4">
                    {isPremium ? (
                      recentActivity.length === 0 ? (
                        <p className="text-sm text-nordic-highlight">Ingen aktivitet än.</p>
                      ) : (
                        recentActivity.map((item) => {
                          const isUnknownPlace = item.city == null || item.city.trim() === "";
                          return (
                            <div key={item.id} className="flex items-center justify-between border-b border-nordic-highlight/40/50 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-800/50">
                                  {item.actionName === "Sparade kontakt" ? (
                                    <Save size={14} className="text-emerald-400" />
                                  ) : item.type === "CLICK" ? (
                                    <MousePointerClick size={14} className="text-sky-400" />
                                  ) : (
                                    <Eye size={14} className="text-blue-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-slate-300 font-medium">
                                    {item.actionName}
                                  </p>
                                  <div className="flex items-start gap-2">
                                    <p className="text-[10px] text-nordic-highlight">
                                      {`${item.city || "Okänd plats"}, ${item.country || ""}`}
                                    </p>
                                    {isUnknownPlace && (
                                      <div className="relative group z-[80]">
                                        <Info size={14} className="mt-[-1px] text-muted-foreground" />
                                        <div className="pointer-events-none absolute left-0 top-full mt-1 w-[280px] rounded-lg bg-slate-900/90 border border-nordic-highlight/20 p-3 text-[11px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-[90]">
                                          <p className="font-medium mb-1">
                                            Varför står det &apos;Okänd plats&apos;?
                                          </p>
                                          <p>
                                            När besökare använder mobildata (4G/5G) eller integritetsfunktioner som Apple Private Relay, maskeras deras exakta stad. Vi kan då se vilket land de befinner sig i, men den exakta orten hålls dold för att skydda deras sekretess.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-600 font-mono">
                                {item.timeAgo}
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      Array.from({ length: 4 }, (_, i) => (
                        <div key={`ph-${i}`} className="flex items-center justify-between border-b border-nordic-highlight/40/50 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-slate-800/50">
                              <Eye size={14} className="text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-300 font-medium">Besökare</p>
                              <p className="text-[10px] text-nordic-highlight">Stockholm, Sverige</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            Just nu
                          </div>
                        </div>
                      ))
                    )}
                </div>

                {/* Visa all historik */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryOpen(true);
                      setRowsToShow(10);
                    }}
                    className="w-full py-2.5 rounded-xl bg-nordic-secondary text-nordic-primary border border-nordic-highlight/10 hover:bg-nordic-support transition-colors disabled:opacity-60"
                  >
                    Visa all historik
                  </button>
                </div>
             </PremiumLock>

              {isPremium && historyOpen && (
                <div
                  className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                  role="presentation"
                  onClick={() => setHistoryOpen(false)}
                >
                  <div
                    className="w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-nordic-highlight/40 shadow-2xl overflow-hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Historik"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-nordic-highlight/20 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100">Historik</h4>
                        <p className="text-xs text-nordic-highlight">
                          Visa händelser för de valda dagarna
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(false)}
                        className="p-2 rounded-full bg-slate-800/60 text-slate-300 hover:bg-slate-800 transition-colors border border-white/10"
                        aria-label="Stäng modal"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-5 border-b border-nordic-highlight/20 flex items-center justify-between gap-3">
                      <label className="text-xs text-nordic-highlight font-bold uppercase tracking-widest">
                        Rader
                      </label>
                      <select
                        value={rowsToShow}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "all") setRowsToShow("all");
                          if (v === "10") setRowsToShow(10);
                          if (v === "25") setRowsToShow(25);
                          if (v === "50") setRowsToShow(50);
                          if (v === "100") setRowsToShow(100);
                        }}
                        className="bg-slate-800 text-sm text-slate-200 rounded-lg px-3 py-2 border border-nordic-highlight/40 outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Alla</option>
                      </select>
                    </div>

                    <div className="p-5 max-h-[60vh] overflow-y-auto">
                      {visibleHistory.length === 0 ? (
                        <p className="text-sm text-nordic-highlight">Ingen historik än.</p>
                      ) : (
                        <div className="space-y-4">
                          {visibleHistory.map((item) => {
                            const isUnknownPlace = item.city == null || item.city.trim() === "";
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between border-b border-nordic-highlight/40/50 pb-3 last:border-0 last:pb-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-full bg-slate-800/50">
                                    {item.actionName === "Sparade kontakt" ? (
                                      <Save size={14} className="text-emerald-400" />
                                    ) : item.type === "CLICK" ? (
                                      <MousePointerClick size={14} className="text-sky-400" />
                                    ) : (
                                      <Eye size={14} className="text-blue-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-300 font-medium">
                                      {item.actionName}
                                    </p>
                                    <div className="flex items-start gap-2">
                                      <p className="text-[10px] text-nordic-highlight">
                                        {`${item.city || "Okänd plats"}, ${item.country || ""}`}
                                      </p>
                                      {isUnknownPlace && (
                                        <div className="relative group z-[80]">
                                          <Info size={14} className="mt-[-1px] text-muted-foreground" />
                                          <div className="pointer-events-none absolute left-0 top-full mt-1 w-[280px] rounded-lg bg-slate-900/90 border border-nordic-highlight/20 p-3 text-[11px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-[90]">
                                            <p className="font-medium mb-1">
                                              Varför står det &apos;Okänd plats&apos;?
                                            </p>
                                            <p>
                                              När besökare använder mobildata (4G/5G) eller integritetsfunktioner som Apple Private Relay, maskeras deras exakta stad. Vi kan då se vilket land de befinner sig i, men den exakta orten hålls dold för att skydda deras sekretess.
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono">
                                  {item.timeAgo}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
        </div>
        
        {/* Topplista Länkar */}
        <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Mest klickade</h3>
            <div className="space-y-3">
            {topLinks.length === 0 ? <p className="text-sm text-nordic-highlight">Ingen data.</p> : topLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-nordic-primary/30 p-3 border border-nordic-highlight/40/50">
                    <span className="truncate text-sm font-medium text-slate-300 max-w-[150px]">{link.title || link.url}</span>
                    <span className="text-xs font-bold text-emerald-400">{link.clicks} klick</span>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function PremiumLock({ isPremium, title, children }: { isPremium: boolean; title: string; children: React.ReactNode }) {
  if (isPremium) return <>{children}</>;
  return (
    <div className="relative group cursor-default h-full">
      <div className="blur-sm opacity-30 select-none pointer-events-none grayscale transition duration-500 group-hover:blur-md h-full overflow-hidden">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
        <div className="h-10 w-10 rounded-full bg-slate-800 border border-nordic-highlight/40 flex items-center justify-center mb-2 shadow-xl">
          <Lock className="h-4 w-4 text-emerald-400" />
        </div>
        <h4 className="text-slate-200 font-bold text-sm mb-1">{title}</h4>
        <Link href="/checkout/premium" className="rounded-full bg-emerald-600 px-4 py-1.5 text-[10px] font-bold text-nordic-secondary hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
          Lås upp
        </Link>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle: string;
};

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-nordic-highlight">{title}</h3>
        <div className="rounded-full bg-slate-800/50 p-2">{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-nordic-secondary">{value}</div>
        <p className="mt-1 text-xs text-nordic-highlight">{subtitle}</p>
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode === 'Unknown') return '🌍';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getCountryName(code: string) {
  const names: Record<string, string> = { SE: "Sverige", US: "USA", NO: "Norge", GB: "UK", DE: "Tyskland" };
  return names[code] || code;
}