"use client";

import { THEME_TEMPLATES, type ThemeTemplate } from "@/data/theme-templates";
import { PremiumBadge } from "@/components/themes/theme-controls";

interface TemplatesTabProps {
  isPremium: boolean;
  onApply: (template: ThemeTemplate) => void;
}

export function TemplatesTab({ isPremium, onApply }: TemplatesTabProps) {
  
  // Hjälpfunktion för färger (samma som vi gjorde tidigare)
  const getPreviewStyle = (id: string) => {
    switch (id) {
        case 'minimal-white': return 'bg-white border border-slate-200';
        case 'minimal-dark': return 'bg-[#020617]';
        case 'forest': return 'bg-gradient-to-b from-[#14532d] to-[#052e16]';
        case 'ocean': return 'bg-gradient-to-br from-[#1e3a8a] to-[#172554]';
        case 'cocoa': return 'bg-[#451a03]';
        case 'lavender': return 'bg-[#f5f3ff] border border-violet-100';
        case 'stone': return 'bg-[#e7e5e4]';
        case 'tech-basic': return 'bg-[#2563eb]';
        case 'cyberpunk': return 'bg-[#050505] border-t-2 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.3)]';
        case 'luxury-gold': return 'bg-gradient-to-b from-[#0c0a09] to-black border border-[#d4af37]/30';
        case 'glass-morphism': return 'bg-[url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop)] bg-cover';
        case 'sunset-vibes': return 'bg-gradient-to-br from-[#f43f5e] to-[#8b5cf6]';
        case 'bottega': return 'bg-[#064e3b]';
        case 'monochrome-pro': return 'bg-[url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&auto=format&fit=crop)] bg-cover grayscale';
        default: return 'bg-slate-800';
    }
  };

  const getTextColor = (id: string) => {
    return ['minimal-white', 'lavender', 'stone'].includes(id) ? 'text-slate-900' : 'text-white';
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-3">
        {THEME_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onApply(t)}
            className="group relative aspect-video rounded-xl border border-nordic-highlight/40 bg-slate-900 overflow-hidden hover:border-purple-500 transition-all text-left p-3 flex flex-col justify-end"
          >
            <div className={`absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100 ${getPreviewStyle(t.id)}`} />
            
            <div className="relative z-10 flex items-center justify-between w-full">
                <span className={`text-xs font-bold drop-shadow-md ${getTextColor(t.id)}`}>
                    {t.name}
                </span>
                {t.isPremium && <PremiumBadge isUnlocked={isPremium} />}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-nordic-highlight text-center">Välj en mall som grund och anpassa sedan.</p>
    </div>
  );
}