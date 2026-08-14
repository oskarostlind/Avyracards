"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { MousePointerClick, Eye, TrendingUp, Lock, Globe as GlobeIcon, QrCode, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe } from "./globe";
import { useT, useLocaleTag } from "@/i18n/client";
import type { Translator } from "@/i18n";

interface AnalyticsProps {
  isPremium: boolean;
  stats: { totalViews: number; totalClicks: number; ctr: string; totalVcardDownloads: number };
  chartData: any[];
  topLinks: any[];
  trafficSources: any[];
  topCountries: any[];
  recentActivity: any[];
  currentDays: number;
}

export function AnalyticsView({ 
  isPremium, stats, chartData, topLinks, trafficSources, topCountries, recentActivity, currentDays 
}: AnalyticsProps) {
  const t = useT();
  const localeTag = useLocaleTag();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const days = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      params.set('days', days);
      router.push(`/dashboard/analytics?${params.toString()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. KPIer - Nu med 4 kolumner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("analytics.profileViews")} value={stats.totalViews} icon={<Eye className="h-5 w-5 text-blue-400" />} subtitle={t("analytics.lastDays", { days: currentDays })} />
        {/* NYTT KORT */}
        <StatCard title={t("analytics.contactsSaved")} value={stats.totalVcardDownloads} icon={<Save className="h-5 w-5 text-emerald-400" />} subtitle={t("analytics.lastDays", { days: currentDays })} />
        <StatCard title={t("analytics.linkClicks")} value={stats.totalClicks} icon={<MousePointerClick className="h-5 w-5 text-sky-400" />} subtitle={t("analytics.lastDays", { days: currentDays })} />
        <StatCard title={t("analytics.ctr")} value={`${stats.ctr}%`} icon={<TrendingUp className="h-5 w-5 text-purple-400" />} subtitle={t("analytics.ctrSubtitle")} />
      </div>

      {/* 2. Huvudgraf */}
      <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-100">{t("analytics.activityOverTime")}</h3>
            <select 
                value={currentDays}
                onChange={handleDateChange}
                className="bg-slate-800 text-sm text-slate-200 rounded-lg px-3 py-2 border border-nordic-highlight/40 outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
                <option value={7}>{t("analytics.range7")}</option>
                <option value={14}>{t("analytics.range14")}</option>
                <option value={30}>{t("analytics.range30")}</option>
                <option value={90}>{t("analytics.range90")}</option>
                <option value={365}>{t("analytics.range365")}</option>
            </select>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }} />
              <Line type="monotone" dataKey="views" name={t("analytics.views")} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="clicks" name={t("analytics.clicks")} stroke="#22c55e" strokeWidth={3} dot={false} />
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
              <GlobeIcon className="h-5 w-5 text-indigo-400" /> {t("analytics.geography")}
            </h3>
            {isPremium && <span className="text-xs text-indigo-400 font-mono animate-pulse">{t("analytics.liveMap")}</span>}
          </div>

              <PremiumLock isPremium={isPremium} t={t} title={t("analytics.lockGeo")}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 md:opacity-100 mt-10">
                    <Globe className="scale-125" /> 
                </div>
                
                <div className="relative z-10 space-y-3 mt-4 bg-nordic-primary/30 p-4 rounded-xl backdrop-blur-sm border border-white/5 max-w-[250px]">
                  {(isPremium ? topCountries : [{code: "SE", count: 42}, {code: "US", count: 12}]).length === 0 ? (
                      <p className="text-xs text-nordic-highlight">{t("analytics.waitingForGeo")}</p>
                  ) : (
                    (isPremium ? topCountries : [{code: "SE", count: 42}, {code: "US", count: 12}]).map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{getFlagEmoji(c.code)}</span> 
                          <span className="text-slate-200">{getCountryName(c.code, localeTag)}</span>
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
            <QrCode className="h-5 w-5 text-pink-400" /> {t("analytics.trafficSources")}
          </h3>
          <PremiumLock isPremium={isPremium} t={t} title={t("analytics.lockSources")}>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isPremium ? (trafficSources.length ? trafficSources : [{name: t("analytics.noData"), value: 0}]) : [{name: 'Instagram', value: 65}, {name: 'LinkedIn', value: 20}, {name: 'Direkt', value: 15}]} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={70} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    { (isPremium ? trafficSources : [{name: 'Instagram'}, {name: 'LinkedIn'}, {name: 'Direkt'}]).map((entry: any, index: number) => (
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
             <h3 className="mb-4 text-lg font-semibold text-slate-100">{t("analytics.liveActivity")}</h3>
             <PremiumLock isPremium={isPremium} t={t} title={t("analytics.lockLive")}>
                <div className="space-y-4">
                    {(isPremium ? recentActivity : [1,2,3,4]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b border-nordic-highlight/40/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-slate-800/50">
                                {/* Visar olika ikoner baserat på handlingen */}
                                {isPremium && item.actionKey === "analytics.actions.contactSaved" 
                                  ? <Save size={14} className="text-emerald-400"/> 
                                  : (item.type === 'CLICK' ? <MousePointerClick size={14} className="text-sky-400"/> : <Eye size={14} className="text-blue-400"/>)
                                }
                            </div>
                            <div>
                                <p className="text-xs text-slate-300 font-medium">
                                    {isPremium ? t(item.actionKey) : t("analytics.visitor")}
                                </p>
                                <p className="text-[10px] text-nordic-highlight">
                                    {isPremium
                                      ? `${item.city || t("analytics.unknownPlace")}, ${item.country || ""}`
                                      : "Stockholm, Sweden"}
                                </p>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                           {isPremium ? item.timeAgo : t("analytics.justNow")}
                        </div>
                    </div>
                    ))}
                    {isPremium && recentActivity.length === 0 && <p className="text-sm text-nordic-highlight">{t("analytics.noActivityYet")}</p>}
                </div>
             </PremiumLock>
        </div>
        
        {/* Topplista Länkar */}
        <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">{t("analytics.mostClicked")}</h3>
            <div className="space-y-3">
            {topLinks.length === 0 ? <p className="text-sm text-nordic-highlight">{t("analytics.noData")}</p> : topLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-nordic-primary/30 p-3 border border-nordic-highlight/40/50">
                    <span className="truncate text-sm font-medium text-slate-300 max-w-[150px]">{link.title || link.url}</span>
                    <span className="text-xs font-bold text-emerald-400">{link.clicks} {t("analytics.clicksSuffix")}</span>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function PremiumLock({ isPremium, title, t, children }: { isPremium: boolean; title: string; t: Translator; children: React.ReactNode }) {
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
          {t("analytics.unlock")}
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: any) {
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

// Intl.DisplayNames ger landsnamnet på valt språk för ALLA landskoder, inte
// bara de fem som råkade finnas i den handskrivna listan.
function getCountryName(code: string, localeTag: string) {
  if (!code || code === "Unknown") return code;
  try {
    return new Intl.DisplayNames([localeTag], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}