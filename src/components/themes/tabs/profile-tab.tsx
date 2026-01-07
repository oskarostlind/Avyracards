"use client";

import { type CustomThemeSettings, type Font, type FrameStyle } from "@/types/theme";
import { PremiumBadge } from "@/components/themes/theme-controls";

interface ProfileTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: any) => void;
  isPremium: boolean;
}

export function ProfileTab({ settings, updateSetting, isPremium }: ProfileTabProps) {
  
  // Hjälpare för att visa fonten korrekt
  const getFontFamily = (font: string) => {
    switch(font) {
        case 'inter': return 'Inter, sans-serif';
        case 'playfair': return '"Playfair Display", serif';
        case 'roboto': return 'Roboto, sans-serif';
        case 'lora': return 'Lora, serif';
        case 'space': return '"Space Mono", monospace';
        case 'oswald': return 'Oswald, sans-serif';
        default: return 'sans-serif';
    }
  };

  return (
     <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        
        {/* FONTER */}
        <div className="space-y-3">
         <label className="text-xs font-bold text-nordic-highlight uppercase">Typsnitt</label>
         <div className="grid grid-cols-2 gap-2">
            {(["inter", "playfair", "roboto", "space", "oswald", "lora"] as Font[]).map((font) => (
               <button 
                 key={font}
                 onClick={() => updateSetting("font", font)}
                 className={`relative p-3 rounded-lg border text-center transition-all ${
                   settings.font === font 
                   ? "border-purple-500 bg-purple-500/10 text-nordic-secondary" 
                   : "border-nordic-highlight/40 bg-slate-900 text-nordic-highlight hover:bg-slate-800"
                 }`}
               >
                  <span className="text-sm capitalize" style={{ fontFamily: getFontFamily(font) }}>{font}</span>
               </button>
            ))}
         </div>
        </div>

        {/* RAMAR */}
        <div className="space-y-3">
         <label className="text-xs font-bold text-nordic-highlight uppercase">Profilbild Ram</label>
         <div className="grid grid-cols-3 gap-2">
            {(['none', 'circle', 'rounded', 'ring', 'glow', 'hexagon'] as FrameStyle[]).map((frame) => {
                return (
                  <button 
                    key={frame}
                    onClick={() => updateSetting("frameStyle", frame)}
                    className={`py-2 text-[10px] uppercase font-bold border rounded-lg transition-all ${
                      settings.frameStyle === frame 
                      ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                      : "border-nordic-highlight/40 text-nordic-highlight hover:border-slate-600"
                    }`}
                  >
                    {frame}
                  </button>
                )
            })}
         </div>
        </div>

        <hr className="border-nordic-highlight/40"/>

        {/* BRANDING (PREMIUM) */}
        <div className="flex items-center justify-between p-4 border border-amber-500/20 rounded-xl bg-amber-500/5 relative overflow-hidden">
            <div className="space-y-1">
                <span className="text-xs font-bold text-nordic-secondary flex items-center gap-2">
                    Dölj AvyraCards Logga 
                    <div className="scale-75 origin-left">
                        <PremiumBadge isUnlocked={isPremium} />
                    </div>
                </span>
                {/* HÄR ÄR ÄNDRINGEN: Använder &quot; istället för " */}
                <p className="text-[10px] text-nordic-highlight">Ta bort &quot;Powered by&quot; i sidfoten.</p>
            </div>
            
            <button 
                onClick={() => {
                    if(!isPremium) return; 
                    updateSetting("hideBranding", !settings.hideBranding);
                }}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.hideBranding ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.hideBranding ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
     </div>
  );
}