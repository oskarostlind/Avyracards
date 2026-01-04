"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { MousePointerClick, Eye, TrendingUp, Lock, Globe as GlobeIcon, QrCode } from "lucide-react";
import Link from "next/link";
import { Globe } from "./globe"; // Importera globen

interface AnalyticsProps {
  isPremium: boolean;
  stats: { totalViews: number; totalClicks: number; ctr: string };
  chartData: any[];
  topLinks: any[];
  trafficSources: any[];
  topCountries: any[];
  recentActivity: any[];
}

export function AnalyticsView({ 
  isPremium, stats, chartData, topLinks, trafficSources, topCountries, recentActivity 
}: AnalyticsProps) {

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. KPIer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Profilvisningar" value={stats.totalViews} icon={<Eye className="h-5 w-5 text-blue-400" />} subtitle="Senaste 30 dagarna" />
        <StatCard title="Länkklick" value={stats.totalClicks} icon={<MousePointerClick className="h-5 w-5 text-green-400" />} subtitle="Totalt antal klick" />
        <StatCard title="Klickfrekvens (CTR)" value={`${stats.ctr}%`} icon={<TrendingUp className="h-5 w-5 text-purple-400" />} subtitle="Besökare som klickar" />
      </div>

      {/* 2. Huvudgraf */}
      <div className="rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold text-slate-100">Aktivitet över tid</h3>
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
        
        {/* GEOGRAFI & KARTA (Med 3D Glob) */}
        <div className="relative flex flex-col rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between mb-4 z-10">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <GlobeIcon className="h-5 w-5 text-indigo-400" /> Geografi
            </h3>
            {isPremium && <span className="text-xs text-indigo-400 font-mono animate-pulse">LIVE MAP</span>}
          </div>

              <PremiumLock isPremium={isPremium} title="Se var dina besökare finns">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 md:opacity-100 mt-10">
                    {/* HÄR ÄR ÄNDRINGEN: Globen renderas alltid */}
                    <Globe className="scale-125" /> 
                </div>
                
                <div className="relative z-10 space-y-3 mt-4 bg-nordic-primary/30 p-4 rounded-xl backdrop-blur-sm border border-white/5 max-w-[250px]">
                  {/* Om listan är tom, visa "Väntar på data" men låt globen vara kvar i bakgrunden */}
                  {(isPremium ? topCountries : [{code: "SE", count: 42}, {code: "US", count: 12}]).length === 0 ? (
                      <p className="text-xs text-nordic-highlight">Väntar på geodata...</p>
                  ) : (
                    (isPremium ? topCountries : [{code: "SE", count: 42}, {code: "US", count: 12}]).map((c: any, i: number) => (
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
                <BarChart data={isPremium ? (trafficSources.length ? trafficSources : [{name:'Ingen data', value:0}]) : [{name: 'Instagram', value: 65}, {name: 'LinkedIn', value: 20}, {name: 'Direkt', value: 15}]} layout="vertical" margin={{ left: 10 }}>
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

      {/* 4. SENASTE AKTIVITET & TOPPLISTA (Som förut...) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Live Feed */}
        <div className="relative rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6 shadow-xl">
             <h3 className="mb-4 text-lg font-semibold text-slate-100">Live-aktivitet</h3>
             <PremiumLock isPremium={isPremium} title="Se vem som tittar just nu">
                <div className="space-y-4">
                    {(isPremium ? recentActivity : [1,2,3,4]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b border-nordic-highlight/40/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-slate-800/50">
                                {isPremium && item.type === 'CLICK' ? <MousePointerClick size={14} className="text-green-400"/> : <Eye size={14} className="text-blue-400"/>}
                            </div>
                            <div>
                                <p className="text-xs text-slate-300 font-medium">
                                    {isPremium ? (item.type === 'VIEW' ? 'Profilvisning' : 'Klick') : 'Besökare'}
                                </p>
                                <p className="text-[10px] text-nordic-highlight">
                                    {isPremium ? `${item.city || 'Okänd plats'}, ${item.country || ''}` : 'Stockholm, Sverige'}
                                </p>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                           {isPremium ? item.timeAgo : 'Just nu'}
                        </div>
                    </div>
                    ))}
                    {isPremium && recentActivity.length === 0 && <p className="text-sm text-nordic-highlight">Ingen aktivitet än.</p>}
                </div>
             </PremiumLock>
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

// Hjälpkomponenter
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

function getCountryName(code: string) {
  const names: Record<string, string> = { SE: "Sverige", US: "USA", NO: "Norge", GB: "UK", DE: "Tyskland" };
  return names[code] || code;
}