"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { useT } from "@/i18n/client";
import { isFontLocked, type AccessUser } from "@/lib/feature-access";
import { FONTS, FONT_CATEGORIES, getFont, getFontStack, type FontCategory, type FontDef } from "@/lib/theme/fonts";
import type { Font } from "@/types/theme";
import { PremiumBadge, SegmentedControl } from "@/components/themes/theme-controls";
import "@/styles/profile-fonts.css";

/*
 * Typsnittsväljaren i temaeditorn (profilfliken).
 *
 * Två lägen: "Rubrik" (namnet) och "Brödtext" (resten av profilen).
 * Display- och skrivstilstypsnitt (bodySafe: false) visas bara under Rubrik —
 * de blir svårlästa i 14–15 px och det är lättare att inte erbjuda dem än att
 * varna i efterhand.
 *
 * Laddning: varje rad renderar sitt prov i sitt eget typsnitt, men först när
 * raden scrollats in i listan (IntersectionObserver). En rad med font-family
 * satt räcker för att webbläsaren ska hämta filen även om den ligger utanför
 * synfältet, så utan detta hade alla ~40 familjer (~1 MB) laddats direkt när
 * man öppnade fliken. Nu hämtas bara de ~6–8 som syns, plus det man scrollar
 * förbi. En gång visad behåller raden sitt typsnitt (filen är ändå cachad).
 */

type Target = "heading" | "body";
type CategoryFilter = FontCategory | "all";

const SAMPLE = "Aa Åå Öö";

interface FontPickerProps {
  font?: Font;
  headingFont?: Font;
  onChange: (key: "font" | "headingFont", value: Font | undefined) => void;
  accessUser: AccessUser;
  onShowUpgrade: () => void;
}

export function FontPicker({ font, headingFont, onChange, accessUser, onShowUpgrade }: FontPickerProps) {
  const t = useT();
  const [target, setTarget] = useState<Target>("heading");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const bodyFont = getFont(font);
  const selectedId = target === "heading" ? headingFont : bodyFont.id;

  // Brödtext: inga skrivstils-/display-typsnitt, och därmed ingen tom kategori.
  const categories = useMemo(
    () =>
      FONT_CATEGORIES.filter((c) => target === "heading" || FONTS.some((f) => f.category === c && f.bodySafe)),
    [target],
  );
  const activeCategory: CategoryFilter = category === "all" || categories.includes(category) ? category : "all";

  const visibleFonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (FONTS as readonly FontDef[]).filter(
      (f) =>
        (target === "heading" || f.bodySafe) &&
        (activeCategory === "all" || f.category === activeCategory) &&
        (!q || f.name.toLowerCase().includes(q)),
    );
  }, [target, activeCategory, query]);

  // Byter man flik/filter ska listan börja överst, annars hamnar man mitt i.
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [target, activeCategory, query]);

  const select = (f: FontDef) => {
    if (isFontLocked(f.id, accessUser)) {
      onShowUpgrade();
      return;
    }
    onChange(target === "heading" ? "headingFont" : "font", f.id as Font);
  };

  const showSameAsBody = target === "heading" && !query.trim() && activeCategory === "all";

  return (
    <div className="space-y-3">
      <SegmentedControl
        size="sm"
        ariaLabel={t("themes.fonts.targetLabel")}
        value={target}
        onChange={(v) => setTarget(v as Target)}
        options={[
          { value: "heading", label: t("themes.fonts.heading") },
          { value: "body", label: t("themes.fonts.body") },
        ]}
      />

      {/* Kategori-chips: horisontell scroll i stället för radbrytning — sparar höjd i arket. */}
      <div
        role="radiogroup"
        aria-label={t("themes.fonts.categoryLabel")}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {(["all", ...categories] as CategoryFilter[]).map((c) => {
          const active = activeCategory === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCategory(c)}
              className={`relative flex min-h-[36px] shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] ${
                active
                  ? "border-purple-500 bg-purple-500/15 text-purple-200"
                  : "border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/25"
              }`}
            >
              {t(`themes.fonts.categories.${c}`)}
            </button>
          );
        })}
      </div>

      <label className="relative block">
        <span className="sr-only">{t("themes.fonts.searchLabel")}</span>
        <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nordic-highlight" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("themes.fonts.searchPlaceholder")}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          // 16 px: iOS zoomar in på fält med mindre text.
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-900 pl-10 pr-3 text-base text-nordic-secondary outline-none placeholder:text-nordic-highlight/70 focus:border-purple-500"
        />
      </label>

      {/* Egen scrollyta med fast maxhöjd så att sektionerna under (ram, växlar)
          går att nå utan att scrolla förbi 40 typsnitt. overscroll-contain:
          scrollen "läcker" inte över till bottom sheet när listan når kanten. */}
      <div
        ref={listRef}
        role="radiogroup"
        aria-label={target === "heading" ? t("themes.fonts.heading") : t("themes.fonts.body")}
        className="max-h-[22rem] space-y-1.5 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-slate-950/40 p-1.5"
      >
        {showSameAsBody && (
          <PickerRow
            selected={!headingFont}
            onClick={() => onChange("headingFont", undefined)}
            title={t("themes.fonts.sameAsBody")}
            subtitle={bodyFont.name}
            fontId={bodyFont.id}
            root={listRef}
          />
        )}

        {visibleFonts.map((f) => {
          const locked = isFontLocked(f.id, accessUser);
          return (
            <PickerRow
              key={f.id}
              selected={selectedId === f.id}
              locked={locked}
              onClick={() => select(f)}
              title={f.name}
              subtitle={t(`themes.fonts.categories.${f.category}`)}
              fontId={f.id}
              root={listRef}
              badge={locked ? <PremiumBadge isUnlocked={false} className="relative" /> : undefined}
            />
          );
        })}

        {visibleFonts.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-nordic-highlight">{t("themes.fonts.noResults")}</p>
        )}
      </div>

      {target === "heading" && (
        <p className="text-xs leading-snug text-nordic-highlight">{t("themes.fonts.headingHint")}</p>
      )}
    </div>
  );
}

function PickerRow({
  selected,
  locked = false,
  onClick,
  title,
  subtitle,
  fontId,
  root,
  badge,
}: {
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  fontId: string;
  root: React.RefObject<HTMLElement>;
  badge?: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    // Äldre WebViews utan IO: ladda direkt hellre än att aldrig visa typsnittet.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      // Lite marginal: raderna strax under kanten hinner ladda innan de syns.
      { root: root.current, rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, root]);

  const family = inView ? getFontStack(fontId) : undefined;

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] ${
        selected ? "border-purple-500 bg-purple-500/10" : "border-transparent hover:bg-white/5"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[17px] leading-tight ${locked ? "text-slate-300/70" : "text-nordic-secondary"}`}
          style={{ fontFamily: family }}
        >
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-nordic-highlight">{subtitle}</span>
      </span>
      <span
        aria-hidden
        className={`shrink-0 text-xl leading-none ${locked ? "text-slate-400/60" : "text-slate-200"}`}
        style={{ fontFamily: family }}
      >
        {SAMPLE}
      </span>
      <span className="flex w-6 shrink-0 items-center justify-center">
        {badge ?? (selected ? <Check size={18} className="text-purple-300" aria-hidden /> : null)}
      </span>
    </button>
  );
}
