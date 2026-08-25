"use client";

import { Palette, RotateCcw } from "lucide-react";

import { PremiumBadge } from "@/components/themes/theme-controls";
import { getLinkIcon, resolveLinkIconSlug } from "@/lib/link-icons";
import { getReadableTextColor } from "@/utils/color";
import { useT } from "@/i18n/client";

/**
 * Färgväljare för en enskild länkknapp (premium).
 *
 * Låst läge följer samma mönster som premium-knappstilen i temaredigeraren:
 * kontrollen syns, är märkt med PremiumBadge och öppnar uppgraderingsmodalen
 * i stället för att bara vara borta. Servern gatar oberoende av det här —
 * se sanitizeLinkCustomization i src/lib/feature-access.ts.
 */

interface LinkColorPickerProps {
  /** null = använd temats accentfärg. */
  value: string | null;
  onChange: (hex: string | null) => void;
  locked: boolean;
  onShowUpgrade: () => void;
  /** Länkens URL/ikon — ger ett snabbval med varumärkets egen färg. */
  url: string;
  title?: string;
  icon?: string | null;
}

export function LinkColorPicker({
  value,
  onChange,
  locked,
  onShowUpgrade,
  url,
  title,
  icon,
}: LinkColorPickerProps) {
  const t = useT();

  const brand = getLinkIcon(resolveLinkIconSlug({ url, title, icon }));
  const brandHex = brand.hex;

  if (locked) {
    return (
      <button
        type="button"
        onClick={onShowUpgrade}
        className="relative flex w-full items-center gap-3 rounded-xl border border-nordic-highlight/40 px-3 py-2.5 text-left transition-colors hover:border-amber-500"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
          <Palette size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-slate-400">
            {t("links.color")}
          </span>
          <span className="block truncate text-[10px] text-slate-500">
            {t("links.colorPremium")}
          </span>
        </span>
        <PremiumBadge
          isUnlocked={false}
          className="relative scale-90 shrink-0"
        />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || brandHex || "#8b5cf6"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer overflow-hidden rounded-lg border-none bg-transparent p-0"
          aria-label={t("links.color")}
        />

        <div
          className="flex h-9 flex-1 items-center justify-center rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-wider shadow-inner"
          style={
            value
              ? { backgroundColor: value, color: getReadableTextColor(value) }
              : { backgroundColor: "rgba(255,255,255,0.04)", color: "#94a3b8" }
          }
        >
          {value || t("links.colorTheme")}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title={t("links.colorReset")}
            aria-label={t("links.colorReset")}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {brandHex && brandHex !== value && (
        <button
          type="button"
          onClick={() => onChange(brandHex)}
          className="flex items-center gap-2 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <span
            className="h-3 w-3 rounded-full border border-white/20"
            style={{ backgroundColor: brandHex }}
          />
          {t("links.brandColor", { brand: brand.title })}
        </button>
      )}
    </div>
  );
}
