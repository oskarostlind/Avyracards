"use client";

import type { CSSProperties } from "react";
import { Check, Crown, Lock } from "lucide-react";
import { type CustomThemeSettings, type ThemeTemplate, type ThemeMode } from "@/types/theme";
import { getTemplates, isTemplateLocked } from "@/lib/feature-access";
import { getLinkButtonAppearance } from "@/lib/theme/button-style";
import { getHeadingFontStyle } from "@/lib/theme/fonts";
import { getPatternBackground } from "@/lib/theme-effects";
import { AvatarFrame } from "@/components/theme-effects/avatar-frame";
import { useT } from "@/i18n/client";
// Namnet i miniatyren visas i mallens rubriktypsnitt.
import "@/styles/profile-fonts.css";
import type { PremiumTeaser } from "@/components/themes/premium-gate";

interface TemplatesTabProps {
  isPremium: boolean;
  isAdmin?: boolean;
  onApply: (template: ThemeTemplate) => void;
  /** Öppnar uppgraderingsrutan med det som trycktes på (usePremiumGate i editorn). */
  onShowUpgrade: (teaser?: PremiumTeaser) => void;
  mode: ThemeMode;
  currentSettings: CustomThemeSettings;
  /**
   * "strip": horisontell karusell (mobil, nedfällt ark — previewn får plats ovanför).
   * "grid": rutnät (uppfällt ark / desktop).
   */
  layout?: "strip" | "grid";
  columns?: 2 | 3;
}

function backgroundFor(t: ThemeTemplate): CSSProperties {
  const s = t.settings;
  if (s.backgroundType === "image" && s.backgroundImage) {
    return { backgroundImage: `url(${s.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (s.backgroundType === "gradient") {
    return { background: `linear-gradient(${s.gradientDir || "to bottom right"}, ${s.gradientFrom || "#000"}, ${s.gradientTo || "#000"})` };
  }
  return { backgroundColor: s.backgroundColor || "#1e293b" };
}

/** Mönsterlagret (prickar, rutnät …) i samma färg/opacitet som på profilen. */
function patternFor(t: ThemeTemplate): CSSProperties | null {
  const s = t.settings;
  const p = getPatternBackground(s.backgroundPattern, s.textColor, s.backgroundPatternOpacity);
  return p ? { backgroundImage: p.backgroundImage, backgroundSize: p.backgroundSize, backgroundRepeat: "repeat" } : null;
}

/** Sant om mallens alla fält matchar nuvarande inställningar — dvs. den är vald. */
export function isTemplateActive(t: ThemeTemplate, current: CustomThemeSettings): boolean {
  return (Object.keys(t.settings) as (keyof CustomThemeSettings)[]).every((key) => {
    const a = t.settings[key];
    const b = current[key];
    if (typeof a === "string" && typeof b === "string") return a.toLowerCase() === b.toLowerCase();
    return a === b;
  });
}

export function TemplatesTab({
  isPremium,
  isAdmin,
  onApply,
  onShowUpgrade,
  mode,
  currentSettings,
  layout = "grid",
  columns = 2,
}: TemplatesTabProps) {
  const tr = useT();
  const templates = getTemplates(mode);
  const accessUser = { isPremium, isAdmin };

  const cards = templates.map((tpl) => {
    const locked = isTemplateLocked(tpl, accessUser);
    const active = !locked && isTemplateActive(tpl, currentSettings);
    const s = tpl.settings;
    const strip = layout === "strip";
    // Samma stilfunktion som den riktiga knappen, nerskalad till miniatyr.
    const buttonStyle: CSSProperties = getLinkButtonAppearance(s, { scale: strip ? 0.35 : 0.45 }).style;
    const pattern = patternFor(tpl);

    return (
      <button
        key={tpl.id}
        type="button"
        onClick={() => (locked ? onShowUpgrade({ kind: "template", template: tpl }) : onApply(tpl))}
        aria-pressed={active}
        aria-label={locked ? `${tpl.name} – ${tr("themes.templateLocked")}` : tpl.name}
        className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl text-left transition-[transform,box-shadow] duration-150 active:scale-[0.96] motion-reduce:active:scale-100 motion-reduce:active:opacity-80 ${
          strip ? "h-[112px] w-[92px]" : "aspect-[4/5] w-full"
        } ${active ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950" : tpl.isPremium ? "ring-1 ring-amber-300/35" : "ring-1 ring-white/10"}`}
      >
        {/* Bakgrund + mönster + bildens overlay — som på profilen. */}
        <span className="absolute inset-0" style={backgroundFor(tpl)} />
        {s.backgroundType === "image" && (
          <span className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(s.backgroundOverlay ?? 20) / 100})` }} />
        )}
        {pattern && <span className="absolute inset-0" style={pattern} />}

        {/* Minikortet: samma mörka glaskort som den riktiga profilen, med
            ram, namn i mallens rubriktypsnitt och två knappar i mallens stil. */}
        <span
          className={`relative mx-auto flex w-[82%] flex-col items-center border border-white/10 ${
            strip ? "mt-2.5 gap-1 rounded-[10px] px-1.5 pb-2 pt-2" : "mt-[10%] gap-1.5 rounded-[14px] px-2 pb-2.5 pt-2.5"
          }`}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", color: s.textColor }}
        >
          <AvatarFrame frame={s.frameStyle} size={strip ? 20 : 30} accent={s.accentColor}>
            <span className="block h-full w-full bg-slate-700" />
          </AvatarFrame>
          <span
            className={`block w-full truncate text-center ${strip ? "text-[9px]" : "text-[12px]"} font-bold`}
            style={getHeadingFontStyle(s.headingFont, s.font)}
          >
            {tpl.name}
          </span>
          <span className={`flex w-full flex-col ${strip ? "mt-0.5 gap-[5px]" : "mt-1 gap-1.5"}`}>
            <span className={`block w-full ${strip ? "h-[7px]" : "h-[10px]"}`} style={buttonStyle} />
            <span className={`block w-full ${strip ? "h-[7px]" : "h-[10px]"}`} style={buttonStyle} />
          </span>
        </span>

        {locked && <span className="absolute inset-0 bg-slate-950/45" />}

        {active && (
          <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        {/* Premium: alltid en tydlig guldkrona; låst får ett hänglås bredvid. */}
        {tpl.isPremium && (
          <span
            className="absolute right-1.5 top-1.5 flex h-6 items-center gap-0.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 px-1.5 text-amber-950 shadow-lg shadow-black/40 ring-1 ring-amber-100/60"
            title={locked ? tr("themes.templateLocked") : tr("themes.includedInPlan")}
          >
            <Crown size={12} fill="currentColor" strokeWidth={2.2} />
            {locked && <Lock size={10} strokeWidth={2.6} />}
          </span>
        )}
      </button>
    );
  });

  if (layout === "strip") {
    return (
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingInline: 16 }}
      >
        {cards}
        <span aria-hidden className="w-1 shrink-0" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold text-slate-300">
          {mode === "BUSINESS" ? tr("themes.upgrade.templatesTitleBusiness") : tr("themes.upgrade.templatesTitleSocial")}
        </h3>
        <span className="text-xs text-nordic-highlight">{tr("themes.upgrade.templatesCount", { count: templates.length })}</span>
      </div>
      <div className={`grid gap-3 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>{cards}</div>
      <p className="text-center text-xs text-nordic-highlight">
        {mode === "BUSINESS" ? tr("themes.templatesIntroBusiness") : tr("themes.templatesIntroSocial")}
      </p>
    </div>
  );
}
