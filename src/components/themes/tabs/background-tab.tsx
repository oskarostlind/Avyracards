"use client";

import { type CustomThemeSettings } from "@/types/theme";
import { ColorPicker, SegmentedControl, Slider } from "@/components/themes/theme-controls";
import { MediaManager } from "@/components/themes/media-manager";
import { useT } from "@/i18n/client";

interface BackgroundTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: any) => void;
  isPremium: boolean;
  onShowUpgrade: () => void; 
}

export function BackgroundTab({ settings, updateSetting, isPremium, onShowUpgrade }: BackgroundTabProps) {
  const t = useT();

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Huvudväljare */}
      <SegmentedControl 
        value={settings.backgroundType} 
        onChange={(v) => updateSetting("backgroundType", v)} 
        options={[
          { value: "solid", label: t("themes.background.typeColor") },
          { value: "gradient", label: t("themes.background.typeGradient") },
          { value: "image", label: t("themes.background.typeImage") },
        ]}
      />

      {/* --- SOLID FÄRG --- */}
      {settings.backgroundType === "solid" && (
        <ColorPicker label={t("themes.background.backgroundColor")} value={settings.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
      )}

      {/* --- GRADIENT --- */}
      {settings.backgroundType === "gradient" && (
        <div className="space-y-4">
          <ColorPicker label={t("themes.background.gradientFrom")} value={settings.gradientFrom} onChange={(v) => updateSetting("gradientFrom", v)} />
          <ColorPicker label={t("themes.background.gradientTo")} value={settings.gradientTo} onChange={(v) => updateSetting("gradientTo", v)} />
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-nordic-highlight uppercase">{t("themes.background.direction")}</label>
            <select 
                value={settings.gradientDir || "to bottom right"} 
                onChange={(e) => updateSetting("gradientDir", e.target.value)}
                className="w-full bg-slate-900 border border-nordic-highlight/40 rounded-lg px-3 py-2 text-xs text-nordic-secondary focus:border-purple-500 outline-none"
            >
                <option value="to bottom">{t("themes.background.dirDown")}</option>
                <option value="to right">{t("themes.background.dirRight")}</option>
                <option value="to bottom right">{t("themes.background.dirBottomRight")}</option>
                <option value="to top right">{t("themes.background.dirTopRight")}</option>
            </select>
          </div>
        </div>
      )}

      {/* --- BILD (MEDIA MANAGER) --- */}
      {settings.backgroundType === "image" && (
        <div className="space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-nordic-highlight uppercase">{t("themes.background.chooseImage")}</label>
            
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
                          <img src={settings.backgroundImage} alt={t("themes.background.selectedAlt")} className="h-full w-full object-cover" />
                      </div>
                      <div className="text-xs text-nordic-highlight truncate flex-1">
                          {t("themes.background.currentImage")}
                      </div>
                  </div>

                  <Slider 
                    label={t("themes.background.blur")}
                    value={settings.backgroundBlur || 0} 
                    min={0} max={20} unit="px"
                    onChange={(v) => updateSetting("backgroundBlur", v)} 
                  />

                  <Slider 
                    label={t("themes.background.overlay")}
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