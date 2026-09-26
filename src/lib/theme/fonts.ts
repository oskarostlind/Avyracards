/**
 * Typsnittskatalogen för profilteman.
 *
 * Enda källan för vilka typsnitt som finns, vad de heter, vilken CSS-stack de
 * renderas med och vilka som kostar premium. Alla tre renderare
 * (SocialProfile, BusinessProfile, ProfilePreview), väljaren i temaeditorn och
 * sanitizeThemeSettings läser härifrån — tidigare fanns tre fontMap-kopior som
 * dessutom pekade på familjer som aldrig laddades (allt föll tillbaka på
 * systemtypsnittet).
 *
 * Själva @font-face-reglerna ligger i src/styles/profile-fonts.css, genererad
 * av scripts/generate-profile-fonts-css.mjs ur @fontsource-paketen (självhostat,
 * inget Google Fonts-CDN — se kommentaren i CSS-filen). `family` nedan måste
 * matcha font-family-namnet där; ett test i src/lib/__tests__/fonts.test.ts
 * vaktar det.
 *
 * VIKTIGT: id:n sparas i användarnas themeSettings-JSON. Byt aldrig namn på
 * ett befintligt id — de sex ursprungliga ("inter", "playfair", "roboto",
 * "lora", "space", "oswald") används av sparade teman och mallar.
 */

import type { CSSProperties } from "react";

export type FontCategory = "sans" | "serif" | "display" | "handwriting" | "mono";

export const FONT_CATEGORIES: readonly FontCategory[] = ["sans", "serif", "display", "handwriting", "mono"];

export interface FontDef {
  id: string;
  /** Visningsnamn i väljaren (egennamn, översätts inte). */
  name: string;
  category: FontCategory;
  /** font-family-namnet i profile-fonts.css. */
  family: string;
  isPremium: boolean;
  /**
   * false = display-/skrivstilstypsnitt som blir svårläst i brödtextstorlek
   * (versaler, skrivstil, extrabrett). Visas bara under "Rubrik" i väljaren.
   */
  bodySafe: boolean;
  /**
   * Typsnittet finns bara i en vikt. Rubriken sätts då till 400 i stället för
   * att webbläsaren fejkar fetstil (ser smetigt ut på t.ex. Bebas/Pacifico).
   */
  singleWeight?: boolean;
}

// Fallback-stackar per kategori — används medan filen laddas (font-display:
// swap) och om den av någon anledning inte går att hämta.
const FALLBACK: Record<FontCategory, string> = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  display: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  handwriting: "'Segoe Script', 'Bradley Hand', cursive",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export const FONTS = [
  // --- Sans ---
  { id: "inter", name: "Inter", category: "sans", family: "Inter Variable", isPremium: false, bodySafe: true },
  { id: "roboto", name: "Roboto", category: "sans", family: "Roboto Variable", isPremium: false, bodySafe: true },
  { id: "space", name: "Space Grotesk", category: "sans", family: "Space Grotesk Variable", isPremium: false, bodySafe: true },
  { id: "dm-sans", name: "DM Sans", category: "sans", family: "DM Sans Variable", isPremium: false, bodySafe: true },
  { id: "montserrat", name: "Montserrat", category: "sans", family: "Montserrat Variable", isPremium: false, bodySafe: true },
  { id: "poppins", name: "Poppins", category: "sans", family: "Poppins", isPremium: false, bodySafe: true },
  { id: "manrope", name: "Manrope", category: "sans", family: "Manrope Variable", isPremium: true, bodySafe: true },
  { id: "outfit", name: "Outfit", category: "sans", family: "Outfit Variable", isPremium: true, bodySafe: true },
  { id: "sora", name: "Sora", category: "sans", family: "Sora Variable", isPremium: true, bodySafe: true },
  { id: "plus-jakarta", name: "Plus Jakarta Sans", category: "sans", family: "Plus Jakarta Sans Variable", isPremium: true, bodySafe: true },
  { id: "figtree", name: "Figtree", category: "sans", family: "Figtree Variable", isPremium: true, bodySafe: true },
  { id: "archivo", name: "Archivo", category: "sans", family: "Archivo Variable", isPremium: true, bodySafe: true },
  { id: "nunito", name: "Nunito", category: "sans", family: "Nunito Variable", isPremium: true, bodySafe: true },
  { id: "quicksand", name: "Quicksand", category: "sans", family: "Quicksand Variable", isPremium: true, bodySafe: true },
  { id: "comfortaa", name: "Comfortaa", category: "sans", family: "Comfortaa Variable", isPremium: true, bodySafe: true },

  // --- Serif ---
  { id: "playfair", name: "Playfair Display", category: "serif", family: "Playfair Display Variable", isPremium: false, bodySafe: true },
  { id: "lora", name: "Lora", category: "serif", family: "Lora Variable", isPremium: false, bodySafe: true },
  { id: "merriweather", name: "Merriweather", category: "serif", family: "Merriweather Variable", isPremium: false, bodySafe: true },
  { id: "fraunces", name: "Fraunces", category: "serif", family: "Fraunces Variable", isPremium: true, bodySafe: true },
  { id: "cormorant", name: "Cormorant Garamond", category: "serif", family: "Cormorant Garamond Variable", isPremium: true, bodySafe: true },
  { id: "eb-garamond", name: "EB Garamond", category: "serif", family: "EB Garamond Variable", isPremium: true, bodySafe: true },
  { id: "libre-baskerville", name: "Libre Baskerville", category: "serif", family: "Libre Baskerville Variable", isPremium: true, bodySafe: true },
  { id: "dm-serif-display", name: "DM Serif Display", category: "serif", family: "DM Serif Display", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "instrument-serif", name: "Instrument Serif", category: "serif", family: "Instrument Serif", isPremium: true, bodySafe: false, singleWeight: true },

  // --- Display ---
  { id: "oswald", name: "Oswald", category: "display", family: "Oswald Variable", isPremium: false, bodySafe: true },
  { id: "bebas-neue", name: "Bebas Neue", category: "display", family: "Bebas Neue", isPremium: false, bodySafe: false, singleWeight: true },
  { id: "syne", name: "Syne", category: "display", family: "Syne Variable", isPremium: true, bodySafe: true },
  { id: "bricolage", name: "Bricolage Grotesque", category: "display", family: "Bricolage Grotesque Variable", isPremium: true, bodySafe: true },
  { id: "unbounded", name: "Unbounded", category: "display", family: "Unbounded Variable", isPremium: true, bodySafe: false },
  { id: "anton", name: "Anton", category: "display", family: "Anton", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "righteous", name: "Righteous", category: "display", family: "Righteous", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "abril-fatface", name: "Abril Fatface", category: "display", family: "Abril Fatface", isPremium: true, bodySafe: false, singleWeight: true },

  // --- Handskrift ---
  { id: "caveat", name: "Caveat", category: "handwriting", family: "Caveat Variable", isPremium: false, bodySafe: false },
  { id: "dancing-script", name: "Dancing Script", category: "handwriting", family: "Dancing Script Variable", isPremium: true, bodySafe: false },
  { id: "pacifico", name: "Pacifico", category: "handwriting", family: "Pacifico", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "satisfy", name: "Satisfy", category: "handwriting", family: "Satisfy", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "great-vibes", name: "Great Vibes", category: "handwriting", family: "Great Vibes", isPremium: true, bodySafe: false, singleWeight: true },
  { id: "permanent-marker", name: "Permanent Marker", category: "handwriting", family: "Permanent Marker", isPremium: true, bodySafe: false, singleWeight: true },

  // --- Mono ---
  { id: "jetbrains-mono", name: "JetBrains Mono", category: "mono", family: "JetBrains Mono Variable", isPremium: true, bodySafe: true },
  { id: "space-mono", name: "Space Mono", category: "mono", family: "Space Mono", isPremium: true, bodySafe: true },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", category: "mono", family: "IBM Plex Mono", isPremium: true, bodySafe: true },
] as const satisfies readonly FontDef[];

export type FontId = (typeof FONTS)[number]["id"];

export const DEFAULT_FONT_ID: FontId = "inter";

const FONT_BY_ID: ReadonlyMap<string, FontDef> = new Map(FONTS.map((f) => [f.id, f as FontDef]));

export function isKnownFontId(id: unknown): id is FontId {
  return typeof id === "string" && FONT_BY_ID.has(id);
}

/** Typsnittet för ett id; okänt/saknat id ger standardtypsnittet (Inter). */
export function getFont(id: string | null | undefined): FontDef {
  return (id && FONT_BY_ID.get(id)) || (FONT_BY_ID.get(DEFAULT_FONT_ID) as FontDef);
}

export function isPremiumFont(id: string | null | undefined): boolean {
  return Boolean(id && FONT_BY_ID.get(id)?.isPremium);
}

/** CSS font-family-stack för ett id — den enda resolvern renderarna ska använda. */
export function getFontStack(id: string | null | undefined): string {
  const font = getFont(id);
  return `'${font.family}', ${FALLBACK[font.category]}`;
}

/*
 * Typografi (efter Apples HIG): stora rubriker får lätt negativ tracking och
 * tätare radavstånd; brödtext står på 0 tracking. Skrivstil och mono får
 * ingen negativ tracking — bokstäverna krockar annars.
 */
const HEADING_TRACKING: Record<FontCategory, string> = {
  sans: "-0.02em",
  serif: "-0.015em",
  display: "-0.01em",
  handwriting: "0em",
  mono: "-0.01em",
};

/** Stil för brödtext (hela profilsidan). */
export function getBodyFontStyle(fontId: string | null | undefined): CSSProperties {
  return { fontFamily: getFontStack(fontId), letterSpacing: "0em" };
}

/**
 * Stil för rubriker (namnet på profilen m.m.). Saknas headingFont används
 * brödtextens typsnitt, så befintliga teman ser ut som förut.
 */
export function getHeadingFontStyle(
  headingFontId: string | null | undefined,
  bodyFontId: string | null | undefined,
): CSSProperties {
  const font = getFont(isKnownFontId(headingFontId) ? headingFontId : bodyFontId);
  const style: CSSProperties = {
    fontFamily: getFontStack(font.id),
    letterSpacing: HEADING_TRACKING[font.category],
    lineHeight: font.category === "handwriting" ? 1.2 : 1.1,
  };
  if (font.singleWeight) style.fontWeight = 400;
  return style;
}
