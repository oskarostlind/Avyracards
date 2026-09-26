"use client";

import type { CSSProperties } from "react";
import { Check, Crown, Lock } from "lucide-react";
import { type CustomThemeSettings, type ThemeTemplate, type ThemeMode } from "@/types/theme";
import { getTemplates, isTemplateLocked } from "@/lib/feature-access";
import { getRelativeLuminance, normalizeHexColor } from "@/utils/color";
import { getLinkButtonAppearance } from "@/lib/theme/button-style";
import { useT } from "@/i18n/client";

interface TemplatesTabProps {
  isPremium: boolean;
  isAdmin?: boolean;
  onApply: (template: ThemeTemplate) => void;
  onShowUpgrade: () => void;
  mode: ThemeMode;
  currentSettings: CustomThemeSettings;
  /**
   * "strip": horisontell karusell (mobil, nedfällt ark — previewn får plats ovanför).
   * "grid": rutnät (uppfällt ark / desktop).
   */
  layout?: "strip" | "grid";
  columns?: 2 | 3;
}

// Fallback för mallar vars settings saknar färg/bild. De flesta mallar har
// allt i settings, men några äldre id:n har bara fått sin look här.
const LEGACY_PREVIEWS: Record<string, CSSProperties> = {
  "biz-nyc": { backgroundImage: "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300)" },
  "biz-nordic-office": { backgroundImage: "url(https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300)" },
  "biz-innovator": { backgroundImage: "url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300)" },
  "biz-marble": { backgroundImage: "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300)" },
  "biz-workspace": { backgroundImage: "url(https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=300)" },
  "biz-concrete": { backgroundImage: "url(https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=300)" },
};

function backgroundFor(t: ThemeTemplate): CSSProperties {
  const s = t.settings;
  if (s.backgroundType === "image" && s.backgroundImage) {
    return { backgroundImage: `url(${s.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (s.backgroundType === "gradient") {
    return { background: `linear-gradient(${s.gradientDir || "to bottom right"}, ${s.gradientFrom || "#000"}, ${s.gradientTo || "#000"})` };
  }
  if (LEGACY_PREVIEWS[t.id]) return { ...LEGACY_PREVIEWS[t.id], backgroundSize: "cover", backgroundPosition: "center" };
  return { backgroundColor: s.backgroundColor || "#1e293b" };
}

function isLightBackground(t: ThemeTemplate): boolean {
  const s = t.settings;
  if (s.backgroundType !== "solid" && s.backgroundType !== undefined) return false;
  const hex = normalizeHexColor(s.backgroundColor);
  return hex ? getRelativeLuminance(hex) > 0.5 : false;
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
    const light = isLightBackground(tpl);
    const s = tpl.settings;
    // Samma stilfunktion som den riktiga knappen, nerskalad till miniatyr.
    const buttonStyle: CSSProperties = getLinkButtonAppearance(s, { scale: 0.45 }).style;

    return (
      <button
        key={tpl.id}
        type="button"
        onClick={() => (locked ? onShowUpgrade() : onApply(tpl))}
        aria-pressed={active}
        aria-label={locked ? `${tpl.name} – ${tr("themes.templateLocked")}` : tpl.name}
        className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl text-left transition-[transform,box-shadow] duration-150 active:scale-[0.96] ${
          layout === "strip" ? "h-[112px] w-[92px]" : "aspect-[4/5] w-full"
        } ${active ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950" : "ring-1 ring-white/10"}`}
      >
        <span className="absolute inset-0" style={backgroundFor(tpl)} />

        {/* Mini-knappar: visar mallens knappform och färg, inte bara bakgrunden. */}
        <span className="relative mt-auto flex w-full flex-col gap-1 px-2.5 pb-7">
          <span className="block h-[9px] w-full" style={buttonStyle} />
          <span className="block h-[9px] w-full" style={buttonStyle} />
        </span>

        <span
          className={`absolute inset-x-0 bottom-0 truncate px-2.5 pb-2 pt-4 text-[12px] font-semibold ${
            light ? "text-slate-900" : "text-white"
          } bg-gradient-to-t ${light ? "from-white/80" : "from-black/60"} to-transparent`}
        >
          {tpl.name}
        </span>

        {locked && <span className="absolute inset-0 bg-slate-950/55" />}

        {active && (
          <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
        {tpl.isPremium && (
          <span
            className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-lg ${
              locked ? "bg-amber-500 text-slate-900" : "bg-emerald-500 text-white"
            }`}
            title={locked ? tr("themes.templateLocked") : tr("themes.includedInPlan")}
          >
            {locked ? <Lock size={12} /> : <Crown size={12} fill="currentColor" />}
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
