"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { FOUNDERS_DROP_ID, findCollectible, formatSerial, type ProfileCollectible } from "@/lib/collectibles-shared";

/**
 * "Founder #042"-pill på publik profil, editorns preview och dashboarden.
 *
 * Diskret men omisskännlig: obsidianbotten, tunn guldkant, graverat F-sigill.
 * Tryck/hover visar "Ett av 100" (en tooltip som även fungerar på touch —
 * title-attribut syns aldrig på iPhone). Renderar ingenting för icke-ägare.
 */
export function FounderBadge({
  collectibles,
  size = "md",
  interactive = true,
  className = "",
}: {
  collectibles?: readonly ProfileCollectible[] | null;
  size?: "sm" | "md";
  /** false i previewn/miniatyrer där trycket inte ska göra något. */
  interactive?: boolean;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const founder = findCollectible(collectibles, FOUNDERS_DROP_ID);
  if (!founder) return null;

  const serial = formatSerial(founder.serial, founder.maxSupply);
  const label = t("collectibles.founderBadge", { serial });
  const aria = t("collectibles.founderBadgeAria", { serial: founder.serial, max: founder.maxSupply });
  const oneOf = t("collectibles.oneOf", { max: founder.maxSupply });

  const pill = (
    <span
      // Eget typsnitt: pillen ska se likadan ut oavsett profilens tema (ett
      // serif-tema gav annars gemena siffror i löpnumret).
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fontVariantNumeric: "lining-nums tabular-nums" }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#c9a352]/70 bg-[linear-gradient(160deg,#1b1915,#0a0a0d)] font-semibold uppercase text-[#ecd08a] shadow-[inset_0_1px_0_rgba(255,236,179,0.18),0_4px_14px_rgba(0,0,0,0.35)] ${
        size === "sm" ? "py-0.5 pl-0.5 pr-2 text-[9.5px] tracking-[0.12em]" : "py-1 pl-1 pr-2.5 text-[10.5px] tracking-[0.14em]"
      }`}
    >
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2d2a24,#0b0b0e_70%)] font-serif font-bold normal-case tracking-normal text-[#e3c26f] shadow-[inset_0_0_0_1px_#c9a352] ${
          size === "sm" ? "h-3.5 w-3.5 text-[8px]" : "h-[18px] w-[18px] text-[10px]"
        }`}
        style={{ fontFamily: '"Playfair Display Variable", "Playfair Display", Georgia, serif' }}
      >
        F
      </span>
      <span className="tabular-nums">{label}</span>
    </span>
  );

  if (!interactive) {
    return (
      <span className={`inline-flex ${className}`} aria-label={aria} role="img">
        {pill}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={`${aria}. ${oneOf}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        // Hover bara med riktig mus: på touch skickar webbläsaren en syntetisk
        // mouseenter före click, som då hade stängt tooltipen direkt igen.
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        // 44 px tryckyta utan att pillen blir större.
        className="relative inline-flex items-center rounded-full transition-transform duration-100 ease-out before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] active:scale-[0.96]"
      >
        {pill}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#c9a352]/40 bg-[#0b0b0e]/95 px-2.5 py-1 text-[11px] font-medium text-[#ecd08a] shadow-xl transition-opacity duration-150 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {oneOf}
      </span>
    </span>
  );
}
