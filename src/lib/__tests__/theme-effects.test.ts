import { describe, it, expect } from "vitest";
import {
  ANIMATED_FRAME_STYLES,
  CLASSIC_FRAME_STYLES,
  PATTERN_OPACITY_DEFAULT,
  PATTERN_OPACITY_MAX,
  type CustomThemeSettings,
} from "@/types/theme";
import {
  PREMIUM_FRAME_STYLES,
  PREMIUM_NAME_EFFECTS,
  canAccess,
  clampPatternOpacity,
  isAnimatedBackgroundLocked,
  isFrameLocked,
  isNameEffectLocked,
  sanitizeThemeSettings,
} from "@/lib/feature-access";
import { getAnimatedGradientImage, getPatternBackground, isAnimatedFrame, mixHex } from "@/lib/theme-effects";

const FREE = { isPremium: false, isAdmin: false };
const PREMIUM = { isPremium: true, isAdmin: false };
const ADMIN = { isPremium: false, isAdmin: true };

// Skräpvärden som kan komma via direktanrop mot /api/themes/save.
const junk = (v: unknown) => v as never;

describe("ramar", () => {
  it("klassiska ramar är gratis, animerade är premium", () => {
    for (const f of CLASSIC_FRAME_STYLES) expect(isFrameLocked(f, FREE)).toBe(false);
    for (const f of ANIMATED_FRAME_STYLES) {
      expect(PREMIUM_FRAME_STYLES).toContain(f);
      expect(isFrameLocked(f, FREE)).toBe(true);
      expect(isFrameLocked(f, PREMIUM)).toBe(false);
      expect(isFrameLocked(f, ADMIN)).toBe(false);
    }
  });

  it("har 6–8 animerade ramar utan överlapp med de klassiska", () => {
    expect(ANIMATED_FRAME_STYLES.length).toBeGreaterThanOrEqual(6);
    expect(ANIMATED_FRAME_STYLES.length).toBeLessThanOrEqual(8);
    for (const f of ANIMATED_FRAME_STYLES) expect(CLASSIC_FRAME_STYLES as readonly string[]).not.toContain(f);
    expect(isAnimatedFrame("aurora")).toBe(true);
    expect(isAnimatedFrame("circle")).toBe(false);
    expect(isAnimatedFrame(undefined)).toBe(false);
  });
});

describe("sanitizeThemeSettings — ramar/effekter/bakgrund", () => {
  it("nollar animerad ram för gratiskonto", () => {
    const res = sanitizeThemeSettings({ frameStyle: "gold" }, "SOCIAL", FREE);
    expect(res.settings.frameStyle).toBe("circle");
    expect(res.removed).toContain("theme_premium_frames");
  });

  it("behåller animerad ram för premium", () => {
    const res = sanitizeThemeSettings({ frameStyle: "neon" }, "SOCIAL", PREMIUM);
    expect(res.settings.frameStyle).toBe("neon");
    expect(res.sanitized).toBe(false);
  });

  it("okänd ram blir standard utan premium-flagga", () => {
    const res = sanitizeThemeSettings({ frameStyle: junk("<script>") }, "SOCIAL", PREMIUM);
    expect(res.settings.frameStyle).toBe("circle");
    expect(res.removed).not.toContain("theme_premium_frames");
  });

  it("namneffekt: premium nollas för gratis, okänt -> none", () => {
    expect(PREMIUM_NAME_EFFECTS).not.toContain("none");
    expect(isNameEffectLocked("none", FREE)).toBe(false);

    const free = sanitizeThemeSettings({ nameEffect: "shimmer" }, "SOCIAL", FREE);
    expect(free.settings.nameEffect).toBe("none");
    expect(free.removed).toContain("theme_name_effects");

    const prem = sanitizeThemeSettings({ nameEffect: "glow" }, "BUSINESS", PREMIUM);
    expect(prem.settings.nameEffect).toBe("glow");

    const bad = sanitizeThemeSettings({ nameEffect: junk("rainbow") }, "SOCIAL", PREMIUM);
    expect(bad.settings.nameEffect).toBe("none");
    expect(bad.sanitized).toBe(false);
  });

  it("animerad bakgrund: bara premium, och bara riktiga booleans", () => {
    expect(canAccess("theme_animated_background", FREE)).toBe(false);
    expect(isAnimatedBackgroundLocked(ADMIN)).toBe(false);

    const free = sanitizeThemeSettings({ backgroundType: "gradient", backgroundAnimated: true }, "SOCIAL", FREE);
    expect(free.settings.backgroundAnimated).toBe(false);
    expect(free.removed).toContain("theme_animated_background");

    const prem = sanitizeThemeSettings({ backgroundType: "gradient", backgroundAnimated: true }, "SOCIAL", PREMIUM);
    expect(prem.settings.backgroundAnimated).toBe(true);

    const str = sanitizeThemeSettings({ backgroundAnimated: junk("true") }, "SOCIAL", PREMIUM);
    expect(str.settings.backgroundAnimated).toBe(false);
  });

  it("mönster är gratis men vitlistas, opaciteten klampas", () => {
    const ok = sanitizeThemeSettings({ backgroundPattern: "dots", backgroundPatternOpacity: 25 }, "SOCIAL", FREE);
    expect(ok.settings.backgroundPattern).toBe("dots");
    expect(ok.settings.backgroundPatternOpacity).toBe(25);
    expect(ok.sanitized).toBe(false);

    const bad = sanitizeThemeSettings(
      { backgroundPattern: junk("url(evil)"), backgroundPatternOpacity: 900 },
      "SOCIAL",
      FREE,
    );
    expect(bad.settings.backgroundPattern).toBe("none");
    expect(bad.settings.backgroundPatternOpacity).toBe(PATTERN_OPACITY_MAX);

    expect(sanitizeThemeSettings({ backgroundPatternOpacity: -5 }, "SOCIAL", FREE).settings.backgroundPatternOpacity).toBe(0);
    expect(sanitizeThemeSettings({ backgroundPatternOpacity: junk("abc") }, "SOCIAL", FREE).settings.backgroundPatternOpacity).toBe(
      PATTERN_OPACITY_DEFAULT,
    );
  });

  it("lägger inte till fält som saknas i indatan", () => {
    const res = sanitizeThemeSettings({ backgroundType: "solid" }, "SOCIAL", FREE);
    expect(res.settings).toEqual({ backgroundType: "solid" });
  });
});

describe("clampPatternOpacity", () => {
  it("avrundar och klampar", () => {
    expect(clampPatternOpacity(12.6)).toBe(13);
    expect(clampPatternOpacity("30")).toBe(30);
    expect(clampPatternOpacity(Infinity)).toBe(PATTERN_OPACITY_DEFAULT);
    expect(clampPatternOpacity(null)).toBe(PATTERN_OPACITY_DEFAULT);
  });
});

describe("theme-effects-hjälpare", () => {
  it("mixHex blandar och tål skräp", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("#ff0000", "#0000ff", 0)).toBe("#ff0000");
    expect(mixHex("nope", "#ffffff", 0)).toBe("#8b5cf6");
  });

  it("getPatternBackground ger en SVG-data-URI, eller null", () => {
    expect(getPatternBackground("none", "#fff", 20)).toBeNull();
    expect(getPatternBackground(undefined, "#fff", 20)).toBeNull();
    expect(getPatternBackground("dots", "#fff", 0)).toBeNull();
    expect(getPatternBackground(junk("evil"), "#fff", 20)).toBeNull();

    for (const p of ["dots", "grid", "diagonal", "waves", "grain"] as const) {
      const bg = getPatternBackground(p, "#ffffff", 20);
      expect(bg?.backgroundImage.startsWith('url("data:image/svg+xml,')).toBe(true);
      expect(bg?.backgroundSize).toMatch(/px/);
    }
  });

  it("getPatternBackground läcker inte in ogiltig färg i SVG:n", () => {
    const bg = getPatternBackground("dots", "red'/><script>", 20)!;
    expect(decodeURIComponent(bg.backgroundImage)).not.toContain("script");
  });

  it("getAnimatedGradientImage använder temats färger", () => {
    const s: Pick<CustomThemeSettings, "gradientDir" | "gradientFrom" | "gradientTo" | "accentColor"> = {
      gradientFrom: "#112233",
      gradientTo: "#445566",
      gradientDir: "to right",
      accentColor: "#ff0000",
    };
    const img = getAnimatedGradientImage(s);
    expect(img).toContain("linear-gradient(to right, #112233, #445566)");
    expect(img.match(/radial-gradient/g)).toHaveLength(2);
  });
});
