import { describe, it, expect } from "vitest";
import { SOCIAL_TEMPLATES } from "@/data/theme-templates-social";
import { BUSINESS_TEMPLATES } from "@/data/theme-templates-business";
import { getRelativeLuminance, normalizeHexColor } from "@/utils/color";
import { getLinkButtonAppearance, isButtonVariant } from "@/lib/theme/button-style";
import { isKnownFontId, isPremiumFont } from "@/lib/theme/fonts";
import {
  ANIMATED_FRAME_STYLES,
  CLASSIC_FRAME_STYLES,
  type CustomThemeSettings,
  type ThemeTemplate,
} from "@/types/theme";
import { PREMIUM_BUTTON_VARIANTS, sanitizeThemeSettings } from "@/lib/feature-access";

/**
 * Vakt för de färdiga mallarna: läsbarhet (WCAG) och att premium-mallarna
 * faktiskt visar upp premiumfunktionerna.
 *
 * Kontrasten räknas mot sidans bakgrund (solid, eller gradientens BÅDA
 * ändar) — det strängaste fallet. Publika profilen lägger dessutom ett mörkt
 * slate-kort (60 %) ovanpå; det räknas som ett andra fall för brödtexten,
 * eftersom namn och bio står på kortet. Bildbakgrunder hoppas över (beror på
 * bild + overlay och går inte att räkna fram här).
 */

const ALL: ThemeTemplate[] = [...SOCIAL_TEMPLATES, ...BUSINESS_TEMPLATES];
const PREMIUM = ALL.filter((t) => t.isPremium);

function contrast(a: string, b: string): number {
  const la = getRelativeLuminance(a);
  const lb = getRelativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Lägg en rgba-färg över en hexfärg (alfa-blandning). */
function over(bg: string, [r, g, b]: [number, number, number], alpha: number): string {
  const n = normalizeHexColor(bg)!;
  const base = [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16));
  const out = base.map((v, i) => Math.round([r, g, b][i] * alpha + v * (1 - alpha)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Sidans bakgrundsfärger, eller null för bild. */
function backgrounds(s: Partial<CustomThemeSettings>): string[] | null {
  if (s.backgroundType === "image") return null;
  if (s.backgroundType === "gradient") return [s.gradientFrom!, s.gradientTo!];
  return [s.backgroundColor!];
}

/** Profilkortet (social + business): rgba(15, 23, 42, 0.6) ovanpå bakgrunden. */
const CARD: [number, number, number] = [15, 23, 42];

/**
 * Varianter där knappens yta är en (ungefär) enfärgad accent — där kan vi
 * räkna knapptext mot accent. Genomskinliga varianter (outline, ghost, glass,
 * underline, soft, neon, liquid) har sidan/kortet som yta i stället.
 */
/**
 * Knappvarianter som byggs i en parallell branch (feat/pv2-knappar). Tills den
 * är sammanslagen finns de i typen men inte i vitlistan — testerna nedan
 * godtar dem då i stället för att fälla mallarna. Efter sammanslagning är
 * listan verkningslös (isButtonVariant blir sant) och kan tas bort.
 */
const PENDING_VARIANTS = new Set(["liquid", "holo", "sticker", "pixel"]);
const pending = (v: string | undefined) => !!v && PENDING_VARIANTS.has(v) && !isButtonVariant(v);

const SOLID_LIKE = new Set(["solid", "shadow", "pressed", "gradient", "metallic", "sticker", "pixel"]);

describe("mallarna — struktur", () => {
  it("har unika id:n", () => {
    const ids = ALL.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rätt kategori i rätt fil", () => {
    for (const t of SOCIAL_TEMPLATES) expect(t.category).toBe("SOCIAL");
    for (const t of BUSINESS_TEMPLATES) expect(t.category).toBe("BUSINESS");
  });

  it("10–12 sociala och 6–8 business-premiummallar", () => {
    const social = SOCIAL_TEMPLATES.filter((t) => t.isPremium).length;
    const business = BUSINESS_TEMPLATES.filter((t) => t.isPremium).length;
    expect(social).toBeGreaterThanOrEqual(10);
    expect(social).toBeLessThanOrEqual(12);
    expect(business).toBeGreaterThanOrEqual(6);
    expect(business).toBeLessThanOrEqual(8);
  });

  it("använder bara kända värden (typsnitt, ramar, knappvarianter)", () => {
    const frames = [...CLASSIC_FRAME_STYLES, ...ANIMATED_FRAME_STYLES] as readonly string[];
    for (const t of ALL) {
      const s = t.settings;
      if (s.font) expect(isKnownFontId(s.font), `${t.id} font`).toBe(true);
      if (s.headingFont) expect(isKnownFontId(s.headingFont), `${t.id} headingFont`).toBe(true);
      if (s.frameStyle) expect(frames, `${t.id} frameStyle`).toContain(s.frameStyle);
      if (s.buttonVariant && !pending(s.buttonVariant)) {
        expect(isButtonVariant(s.buttonVariant), `${t.id} buttonVariant`).toBe(true);
      }
    }
  });

  it("bildbakgrunder är https från Unsplash och har overlay", () => {
    for (const t of ALL.filter((x) => x.settings.backgroundType === "image")) {
      expect(t.settings.backgroundImage, t.id).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(t.settings.backgroundOverlay ?? 0, t.id).toBeGreaterThanOrEqual(25);
    }
  });

  it("varje premium-mall använder minst tre premiumbyggstenar", () => {
    for (const t of PREMIUM) {
      const s = t.settings;
      const blocks = [
        !!s.frameStyle && (ANIMATED_FRAME_STYLES as readonly string[]).includes(s.frameStyle),
        !!s.nameEffect && s.nameEffect !== "none",
        isPremiumFont(s.font) || isPremiumFont(s.headingFont),
        !!s.buttonVariant && (PREMIUM_BUTTON_VARIANTS.includes(s.buttonVariant) || PENDING_VARIANTS.has(s.buttonVariant)),
        s.backgroundType === "gradient" && s.backgroundAnimated === true,
        s.backgroundType === "image",
      ].filter(Boolean).length;
      expect(blocks, `${t.id} har ${blocks} premiumbyggstenar`).toBeGreaterThanOrEqual(3);
    }
  });

  it("premium-mallar överlever sanering oförändrade för premiumkonton", () => {
    for (const t of PREMIUM) {
      const res = sanitizeThemeSettings({ ...t.settings }, t.category, { isPremium: true });
      expect(res.removed, t.id).toEqual([]);
      for (const key of Object.keys(t.settings) as (keyof CustomThemeSettings)[]) {
        if (key === "buttonVariant" && pending(t.settings.buttonVariant)) continue;
        expect(res.settings[key], `${t.id}.${key}`).toEqual(t.settings[key]);
      }
    }
  });
});

describe("mallarna — kontrast (WCAG)", () => {
  // Premium-mallarna ska klara 4.5:1 för brödtext både direkt mot bakgrunden
  // och på profilkortet. Gratismallarna är äldre och ljusa bakgrunder blir
  // grå under det mörka kortet — där kräver vi minst 3:1 (stor text) på
  // kortet så att inget blir oläsligt.
  for (const t of ALL) {
    const bgs = backgrounds(t.settings);
    if (!bgs) continue;
    const text = t.settings.textColor!;

    it(`${t.id}: text mot bakgrund`, () => {
      const worst = Math.min(...bgs.map((bg) => contrast(text, bg)));
      expect(worst).toBeGreaterThanOrEqual(t.isPremium ? 4.5 : 3);
    });

    it(`${t.id}: text på profilkortet`, () => {
      const worst = Math.min(...bgs.map((bg) => contrast(text, over(bg, CARD, 0.6))));
      expect(worst).toBeGreaterThanOrEqual(t.isPremium ? 4.5 : 3);
    });
  }

  for (const t of ALL) {
    const variant = t.settings.buttonVariant ?? "solid";
    if (!SOLID_LIKE.has(variant)) continue;

    it(`${t.id}: knapptext mot accent (${variant})`, () => {
      const style = getLinkButtonAppearance(t.settings).style;
      const color = normalizeHexColor(style.color as string);
      const accent = normalizeHexColor(t.settings.accentColor)!;
      expect(color, "knapptexten ska vara en hexfärg").not.toBeNull();
      // Premium: 4.5:1. Gratis (äldre mallar): minst 3:1.
      expect(contrast(color!, accent)).toBeGreaterThanOrEqual(t.isPremium ? 4.5 : 3);
    });
  }

  for (const t of PREMIUM) {
    const s = t.settings;
    if (!s.buttonTextColor) continue;
    const bgs = backgrounds(s);
    if (!bgs) continue;
    const variant = s.buttonVariant ?? "solid";
    // Genomskinliga knappar med egen textfärg: texten står på kortet.
    if (SOLID_LIKE.has(variant) || variant === "holo") continue;
    it(`${t.id}: egen knapptext mot kortet (${variant})`, () => {
      const worst = Math.min(...bgs.map((bg) => contrast(s.buttonTextColor!, over(bg, CARD, 0.6))));
      expect(worst).toBeGreaterThanOrEqual(4.5);
    });
  }
});
