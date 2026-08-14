"use client";

import { BarChart3, Globe, MousePointer2, ShieldCheck, Zap } from "lucide-react";
import { useT } from "@/i18n/client";

// --- SLIDE 1: DASHBOARD ---
export function DashboardVisual() {
  return (
    <div className="w-full h-full bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 p-6 relative overflow-hidden flex flex-col shadow-2xl">
      {/* Top Bar */}
      <div className="h-8 w-full border-b border-slate-800 mb-6 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
          <div className="w-3 h-3 rounded-full bg-green-500/20" />
      </div>

      <div className="flex flex-1 gap-6">
        {/* Sidebar */}
        <div className="w-16 h-full border-r border-slate-800 flex flex-col items-center gap-4 pt-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800" />
            <div className="w-8 h-8 rounded-lg bg-slate-800/50 mt-4" />
            <div className="w-8 h-8 rounded-lg bg-slate-800/50" />
            <div className="w-8 h-8 rounded-lg bg-slate-800/50" />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-slate-800 rounded-lg" />
                <div className="h-8 w-24 bg-emerald-500/20 rounded-lg border border-emerald-500/30" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-slate-800/30 rounded-xl border border-slate-800 p-4 space-y-2">
                    <div className="w-8 h-8 rounded bg-slate-700/50 mb-2" />
                    <div className="h-2 w-20 bg-slate-700/50 rounded" />
                    <div className="h-2 w-12 bg-slate-700/50 rounded" />
                </div>
                <div className="h-32 bg-slate-800/30 rounded-xl border border-slate-800 p-4 space-y-2">
                      <div className="w-8 h-8 rounded bg-slate-700/50 mb-2" />
                      <div className="h-2 w-20 bg-slate-700/50 rounded" />
                      <div className="h-2 w-12 bg-slate-700/50 rounded" />
                </div>
            </div>
            <div className="h-40 bg-slate-800/30 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="h-4 w-full bg-slate-700/20 rounded" />
                <div className="h-4 w-3/4 bg-slate-700/20 rounded" />
                <div className="h-4 w-1/2 bg-slate-700/20 rounded" />
            </div>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
    </div>
  );
}

// --- SLIDE 2: STATS ---
export function StatsVisual({ isPremium }: { isPremium: boolean }) {
  const t = useT();
  return (
    <div className="w-full h-full bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 p-8 relative overflow-hidden flex items-center justify-center">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-900 to-slate-900" />
       
       <div className="relative w-full max-w-sm space-y-6 scale-90 sm:scale-100">
           {/* Graph Header */}
           <div className="flex justify-between items-end">
               <div>
                   <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t("onboarding.visuals.uniqueVisitors")}</div>
                   <div className="text-4xl font-bold text-white mt-1">12,450</div>
               </div>
               <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded">
                   <Zap size={14} /> +24%
               </div>
           </div>

           {/* The Chart */}
           <div className="flex items-end justify-between h-40 sm:h-48 gap-2">
               {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                   <div key={i} className="w-full bg-slate-800 rounded-t-md relative group overflow-hidden" style={{ height: `${h}%` }}>
                       <div className="absolute bottom-0 left-0 right-0 top-0 bg-emerald-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                   </div>
               ))}
           </div>

           {/* Bottom Details */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center gap-3">
                   <Globe className="text-slate-400" size={18} />
                   <div className="h-2 w-16 bg-slate-700 rounded" />
               </div>
               <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center gap-3">
                   <MousePointer2 className="text-slate-400" size={18} />
                   <div className="h-2 w-16 bg-slate-700 rounded" />
               </div>
           </div>
       </div>

       {!isPremium && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-center">
                  <div className="bg-slate-900 p-4 rounded-full border border-slate-700 shadow-2xl inline-flex mb-4">
                      <BarChart3 className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t("onboarding.visuals.unlockAnalytics")}</h3>
                  <p className="text-slate-400 text-sm mt-2">{t("onboarding.visuals.unlockAnalyticsBody")}</p>
              </div>
          </div>
       )}
    </div>
  );
}

// --- SLIDE 3: THEMES ---
export function ThemesVisual() {
  return (
    <div className="w-full h-full bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 relative overflow-hidden flex items-center justify-center">
       <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/30 to-transparent" />
       
       <div className="relative flex gap-6 perspective-1000 scale-75 sm:scale-90 md:scale-100">
           {/* Card Left */}
           <div className="w-40 h-64 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl transform -rotate-y-12 scale-90 opacity-60">
               <div className="h-32 bg-indigo-500/20 rounded-t-2xl mb-4" />
               <div className="px-4 space-y-2">
                   <div className="h-2 w-12 bg-slate-700 rounded" />
                   <div className="h-2 w-20 bg-slate-700 rounded" />
               </div>
           </div>
           
           {/* Card Center (Main) */}
           <div className="w-48 h-72 bg-slate-900 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 z-10 transform hover:scale-105 transition-transform duration-500 flex flex-col">
               <div className="h-32 bg-emerald-500/10 rounded-t-2xl flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                   <div className="w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
               </div>
               <div className="p-4 space-y-3 flex-1">
                   <div className="h-3 w-24 bg-slate-700 rounded-full mx-auto" />
                   <div className="h-2 w-32 bg-slate-800 rounded-full mx-auto" />
                   
                   <div className="mt-6 space-y-2">
                       <div className="h-8 w-full bg-slate-800 rounded-lg border border-slate-700" />
                       <div className="h-8 w-full bg-slate-800 rounded-lg border border-slate-700" />
                   </div>
               </div>
               <div className="p-3 border-t border-slate-800 flex justify-center">
                   <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                       <ShieldCheck size={12} /> PRO THEME
                   </div>
               </div>
           </div>

           {/* Card Right */}
           <div className="w-40 h-64 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl transform rotate-y-12 scale-90 opacity-60">
                <div className="h-32 bg-rose-500/20 rounded-t-2xl mb-4" />
                <div className="px-4 space-y-2">
                   <div className="h-2 w-12 bg-slate-700 rounded" />
                   <div className="h-2 w-20 bg-slate-700 rounded" />
               </div>
           </div>
       </div>
    </div>
  );
}

// --- SLIDE 4: HARDWARE VISUAL (Bara kortet) ---
export function HardwareVisual({ name }: { name: string }) {
  const t = useT();
    return (
        <div className="w-full h-full bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 relative overflow-hidden flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30" />
            
            {/* FIX: Anpassad storlek och skalning för mobila enheter */}
            <div className="relative w-full max-w-[280px] sm:max-w-sm aspect-[1.586/1] bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col justify-between p-5 sm:p-8 group transform transition-all hover:scale-105 duration-500 hover:shadow-emerald-900/20">
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="flex justify-between items-start">
                    <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white/40 uppercase">Avyra</div>
                    {/* Chip */}
                    <div className="w-8 h-6 sm:w-10 sm:h-8 rounded bg-gradient-to-br from-yellow-200/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center">
                        <div className="w-full h-px bg-yellow-500/20 absolute top-1/3" />
                        <div className="h-full w-px bg-yellow-500/20 absolute left-1/3" />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <p className="text-[8px] sm:text-[10px] text-white/30 uppercase tracking-wider font-semibold">{t("onboarding.visuals.cardholder")}</p>
                    <p className="text-base sm:text-lg md:text-2xl font-medium text-white tracking-wide truncate font-mono shadow-black drop-shadow-md">
                        {name || "DITT NAMN"}
                    </p>
                </div>
            </div>
        </div>
    );
}