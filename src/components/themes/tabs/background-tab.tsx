"use client";

import { type CustomThemeSettings } from "@/types/theme";
import { ColorPicker, SegmentedControl, Slider } from "@/components/themes/theme-controls";
import { MediaManager } from "@/components/themes/media-manager"; 

interface BackgroundTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: any) => void;
  isPremium: boolean;
  onShowUpgrade: () => void; 
}

export function BackgroundTab({ settings, updateSetting, isPremium, onShowUpgrade }: BackgroundTabProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Huvudväljare */}
      <SegmentedControl 
        value={settings.backgroundType} 
        onChange={(v) => updateSetting("backgroundType", v)} 
        options={[
          { value: "solid", label: "Färg" },
          { value: "gradient", label: "Gradient" },
          { value: "image", label: "Bild" },
        ]}
      />

      {/* --- SOLID FÄRG --- */}
      {settings.backgroundType === "solid" && (
        <ColorPicker label="Bakgrundsfärg" value={settings.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
      )}

      {/* --- GRADIENT --- */}
      {settings.backgroundType === "gradient" && (
        <div className="space-y-4">
          <ColorPicker label="Från färg" value={settings.gradientFrom} onChange={(v) => updateSetting("gradientFrom", v)} />
          <ColorPicker label="Till färg" value={settings.gradientTo} onChange={(v) => updateSetting("gradientTo", v)} />
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-nordic-highlight uppercase">Riktning</label>
            <select 
                value={settings.gradientDir || "to bottom right"} 
                onChange={(e) => updateSetting("gradientDir", e.target.value)}
                className="w-full bg-slate-900 border border-nordic-highlight/40 rounded-lg px-3 py-2 text-xs text-nordic-secondary focus:border-purple-500 outline-none"
            >
                <option value="to bottom">Neråt ↓</option>
                <option value="to right">Höger →</option>
                <option value="to bottom right">Diagonalt ↘</option>
                <option value="to top right">Diagonalt ↗</option>
            </select>
          </div>
        </div>
      )}

      {/* --- BILD (MEDIA MANAGER) --- */}
      {settings.backgroundType === "image" && (
        <div className="space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-nordic-highlight uppercase">Välj Bakgrundsbild</label>
            
            {/* HÄR ÄR DEN NYA KOMPONENTEN */}
            <MediaManager 
                onImageSelected={(url) => updateSetting("backgroundImage", url)}
                isPremium={isPremium}
                onShowUpgrade={onShowUpgrade}
            />
          </div>

          {/* Om en bild är vald, visa inställningar för den */}
          {settings.backgroundImage && (
              <div className="p-4 rounded-xl border border-nordic-highlight/30 bg-slate-900/50 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={settings.backgroundImage} alt="Selected" className="h-full w-full object-cover" />
                      </div>
                      <div className="text-xs text-nordic-highlight truncate flex-1">
                          Aktuell bild
                      </div>
                  </div>

                  <Slider 
                    label="Oskärpa (Blur)" 
                    value={settings.backgroundBlur || 0} 
                    min={0} max={20} unit="px"
                    onChange={(v) => updateSetting("backgroundBlur", v)} 
                  />

                  <Slider 
                    label="Mörkare (Overlay)" 
                    value={settings.backgroundOverlay || 0} 
                    min={0} max={90} unit="%"
                    onChange={(v) => updateSetting("backgroundOverlay", v)} 
                  />
              </div>
          )}
        </div>
      )}
    </div>
  );
}