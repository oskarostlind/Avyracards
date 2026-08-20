"use client";

import { type CustomThemeSettings, type ButtonStyle, type ButtonVariant } from "@/types/theme";
import { ColorPicker, PremiumBadge } from "@/components/themes/theme-controls";
import { canAccess, PREMIUM_BUTTON_VARIANTS } from "@/lib/feature-access";
import { useT } from "@/i18n/client";

interface ButtonsTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean) => void;
  isPremium: boolean;
  isAdmin?: boolean;
  onShowUpgrade: () => void;
}

export function ButtonsTab({ settings, updateSetting, isPremium, isAdmin, onShowUpgrade }: ButtonsTabProps) {
  const t = useT();

  // Samma källa som /api/themes/save använder. Utan det här kunde ett gratiskonto
  // välja "glass", se den i previewn och tro att den satt — servern tvättade bort
  // den först vid spara, helt tyst. (ClickUp 86cb5duj6)
  const accessUser = { isPremium, isAdmin };
  const canUsePremiumVariants = canAccess("theme_button_glass", accessUser);

  const renderShapePreview = (style: ButtonStyle) => {
    const baseClass = "w-full h-8 bg-slate-700 transition-all group-hover:bg-purple-500/50";
    if (style === 'rounded') return <div className={`${baseClass} rounded-lg`} />;
    if (style === 'pill') return <div className={`${baseClass} rounded-full`} />;
    if (style === 'sharp') return <div className={`${baseClass} rounded-none`} />;
    if (style === 'brutal') return <div className={`${baseClass} rounded-sm border-2 border-slate-500`} />;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
       
       {/* FORM */}
       <div className="space-y-3">
         <label className="text-xs font-bold text-nordic-highlight uppercase">{t("themes.buttons.shape")}</label>
         <div className="grid grid-cols-4 gap-2">
            {(['rounded', 'pill', 'sharp', 'brutal'] as ButtonStyle[]).map((style) => (
              <button 
                key={style}
                onClick={() => updateSetting("buttonStyle", style)}
                className={`group p-2 border rounded-xl transition-all flex flex-col items-center gap-2 ${
                  settings.buttonStyle === style 
                  ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                  : "border-nordic-highlight/40 hover:border-slate-600"
                }`}
              >
                {renderShapePreview(style)}
                <span className="text-[10px] uppercase font-bold text-nordic-highlight">{style}</span>
              </button>
            ))}
         </div>
       </div>

       {/* STIL */}
       <div className="space-y-3">
         <label className="text-xs font-bold text-nordic-highlight uppercase">{t("themes.buttons.style")}</label>
         <div className="grid grid-cols-2 gap-2">
            {(['solid', 'outline', 'soft', 'glass', 'ghost'] as ButtonVariant[]).map((variant) => {
                const isPremiumVariant = PREMIUM_BUTTON_VARIANTS.includes(variant);
                const locked = isPremiumVariant && !canUsePremiumVariants;
                return (
                  <button
                    key={variant}
                    onClick={() => (locked ? onShowUpgrade() : updateSetting("buttonVariant", variant))}
                    aria-disabled={locked}
                    className={`relative py-3 px-4 text-xs uppercase font-bold border rounded-lg transition-all text-left flex justify-between items-center overflow-hidden ${
                      settings.buttonVariant === variant
                      ? "border-purple-500 bg-purple-500/10 text-purple-400"
                      : locked
                      ? "border-nordic-highlight/40 text-nordic-highlight/50 hover:border-amber-500 cursor-not-allowed"
                      : "border-nordic-highlight/40 text-nordic-highlight hover:border-slate-600"
                    }`}
                  >
                    <span>{variant}</span>
                    {/* Använder specifikt anpassad styling för ikonen inuti knappar */}
                    {isPremiumVariant && <PremiumBadge isUnlocked={!locked} className="absolute top-1/2 -translate-y-1/2 right-2 scale-[0.65] origin-right" />}
                  </button>
                )
            })}
         </div>
       </div>
       
       {/* SKUGGA TOGGLE */}
       <div className="flex items-center justify-between p-3 border border-nordic-highlight/40 rounded-xl bg-slate-900/30">
          <span className="text-xs font-bold text-nordic-highlight uppercase">{t("themes.buttons.shadow")}</span>
          <button 
            onClick={() => updateSetting("buttonShadow", !settings.buttonShadow)}
            className={`w-10 h-5 rounded-full transition-colors relative ${settings.buttonShadow ? 'bg-purple-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.buttonShadow ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
       </div>

       <hr className="border-nordic-highlight/40"/>
       
       <ColorPicker label={t("themes.buttons.accentColor")} value={settings.accentColor} onChange={(v) => updateSetting("accentColor", v)} />
       <ColorPicker label={t("themes.buttons.textColor")} value={settings.textColor} onChange={(v) => updateSetting("textColor", v)} />
    </div>
  );
}