"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles, Check } from "lucide-react";

import { LinkIconGlyph } from "@/components/icons/link-icon";
import {
  LINK_ICONS,
  detectLinkIconSlug,
  getLinkIcon,
  type LinkIconCategory,
  type LinkIconDef,
} from "@/lib/link-icons";
import { useT } from "@/i18n/client";

/**
 * Ikonväljare för en enskild länk.
 *
 * `value === null` betyder "Automatisk" — då detekteras ikonen ur URL:en, och
 * vi visar vilken ikon det blir så att valet inte känns som en tom ruta.
 */

interface LinkIconPickerProps {
  /** Manuellt vald slug, eller null för automatisk. */
  value: string | null;
  onChange: (slug: string | null) => void;
  /** Länkens URL — används för att visa vad "Automatisk" landar på. */
  url: string;
  title?: string;
}

const CATEGORY_ORDER: LinkIconCategory[] = [
  "social",
  "video",
  "music",
  "portfolio",
  "shop",
  "payment",
  "utility",
  "generic",
];

export function LinkIconPicker({ value, onChange, url, title }: LinkIconPickerProps) {
  const t = useT();
  const [query, setQuery] = useState("");

  const autoSlug = useMemo(() => detectLinkIconSlug(url, title), [url, title]);

  const iconLabel = (icon: LinkIconDef) =>
    icon.category === "generic" ? t(`links.iconNames.${icon.slug}`) : icon.title;

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = LINK_ICONS.filter((icon) => {
      if (!needle) return true;
      const haystack = [icon.slug, icon.title, ...(icon.domains ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    return CATEGORY_ORDER.map((category) => ({
      category,
      icons: matches.filter((icon) => icon.category === category),
    })).filter((group) => group.icons.length > 0);
  }, [query]);

  return (
    <div className="space-y-3">
      {/* Automatiskt-val */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
          value === null
            ? "border-purple-500 bg-purple-500/10"
            : "border-nordic-highlight/40 hover:border-slate-600"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-200">
          <LinkIconGlyph def={getLinkIcon(autoSlug)} size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Sparkles size={11} className="text-purple-400" />
            {t("links.iconAuto")}
          </span>
          <span className="block truncate text-[10px] text-slate-500">
            {t("links.iconAutoHint", { icon: iconLabel(getLinkIcon(autoSlug)) })}
          </span>
        </span>
        {value === null && <Check size={16} className="shrink-0 text-purple-400" />}
      </button>

      {/* Sök */}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("links.iconSearch")}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2 text-xs text-white outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Rutnät */}
      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {grouped.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-500">
            {t("links.iconNoResults")}
          </p>
        )}

        {grouped.map((group) => (
          <div key={group.category} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t(`links.iconCategories.${group.category}`)}
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {group.icons.map((icon) => {
                const selected = value === icon.slug;
                return (
                  <button
                    key={icon.slug}
                    type="button"
                    onClick={() => onChange(icon.slug)}
                    title={iconLabel(icon)}
                    aria-label={iconLabel(icon)}
                    aria-pressed={selected}
                    className={`flex aspect-square items-center justify-center rounded-lg border transition-colors ${
                      selected
                        ? "border-purple-500 bg-purple-500/15 text-purple-300"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <LinkIconGlyph def={icon} size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
