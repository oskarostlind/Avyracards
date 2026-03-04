"use client";

import { Lock, Crown } from "lucide-react";

// --- FÄRGVÄLJARE ---
export function ColorPicker({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-xs font-bold text-nordic-highlight uppercase">{label}</label>
        <span className="text-[10px] font-mono text-slate-600 uppercase">{value}</span>
      </div>
      <div className="flex gap-2 items-center">
        <input 
          type="color" 
          value={value || "#000000"} 
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden"
        />
        <div className="flex-1 h-10 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: value }}></div>
      </div>
    </div>
  );
}

// --- SEGMENTED CONTROL ---
export function SegmentedControl({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: {value: string; label: string}[] }) {
  return (
    <div className="flex bg-slate-900 p-1 rounded-xl border border-nordic-highlight/40">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              value === opt.value ? "bg-slate-800 text-nordic-secondary shadow-sm ring-1 ring-white/5" : "text-nordic-highlight hover:text-slate-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// --- SLIDER ---
export function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <label className="text-xs font-bold text-nordic-highlight uppercase">{label}</label>
        <span className="text-xs text-nordic-highlight">{value}{unit}</span>
      </div>
      <input 
        type="range" min={min} max={max} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

// --- PREMIUM BADGE ---
export function PremiumBadge({ isUnlocked, className = "absolute top-2 right-2" }: { isUnlocked: boolean; className?: string }) {
  return (
    <div 
        className={`${className} p-1 rounded-full shadow-lg flex items-center justify-center z-10 ${
            isUnlocked 
            ? "bg-emerald-500 text-white" 
            : "bg-amber-500 text-slate-900" 
        }`} 
        title={isUnlocked ? "Ingår i ditt paket" : "Premium"}
    >
        {isUnlocked ? <Crown size={10} fill="currentColor" /> : <Lock size={10} />}
    </div>
  );
}