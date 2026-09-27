import { describe, expect, it } from "vitest";

import {
  BUTTON_VARIANTS,
  clampButtonBorderWidth,
  ensureContrast,
  getButtonBackdropColors,
  getClassicLinkColorStyle,
  getLinkButtonAppearance,
  pickReadableText,
} from "@/lib/theme/button-style";
import type { CustomThemeSettings } from "@/types/theme";
import { getRelativeLuminance } from "@/utils/color";

function contrast(a: string, b: string): number {
  const [hi, lo] = [getRelativeLuminance(a), getRelativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BASE: Partial<CustomThemeSettings> = {
  backgroundType: "solid",
  backgroundColor: "#0f172a",
  accentColor: "#8b5cf6",
  textColor: "#f8fafc",
  buttonStyle: "rounded",
  buttonVariant: "solid",
};

const styleFor = (over: Partial<CustomThemeSettings>, opts = {}) =>
  getLinkButtonAppearance({ ...BASE, ...over }, opts).style;

describe("getLinkButtonAppearance – befintliga teman", () => {
  it("solid ser ut som förut: accent som bakgrund, sidans textfärg", () => {
    const s = styleFor({});
    expect(s.backgroundColor).toBe("#8b5cf6");
    expect(s.color).toBe("#f8fafc");
    expect(s.borderRadius).toBe("12px");
  });

  it("outline är transparent med accentfärgad kant och text", () => {
    const s = styleFor({ buttonVariant: "outline", accentColor: "#22d3ee" });
    expect(s.backgroundColor).toBe("transparent");
    expect(s.border).toBe("2px solid #22d3ee");
    expect(s.color).toBe("#22d3ee");
  });

  it("outline-text i mörk accent ljusas upp tills den går att läsa (kanten behåller accenten)", () => {
    const s = styleFor({ buttonVariant: "outline" });
    expect(s.border).toBe("2px solid #8b5cf6");
    expect(s.color).not.toBe("#8b5cf6");
    expect(contrast(String(s.color), "#0f172a")).toBeGreaterThanOrEqual(4.5);
  });

  it("primärknappen är inverterad", () => {
    const s = styleFor({}, { isPrimary: true });
    expect(s.backgroundColor).toBe("#f8fafc");
    expect(s.color).toBe("#8b5cf6");
  });

  it("brutal får tjock kant och hård förskjuten skugga", () => {
    const s = styleFor({ buttonStyle: "brutal" });
    expect(s.border).toBe("2px solid #f8fafc");
    expect(s.boxShadow).toContain("4px 4px 0 0 #f8fafc");
  });

  it("okänd variant/form faller tillbaka på solid/rounded", () => {
    const s = styleFor({ buttonVariant: "hacker" as never, buttonStyle: "blob" as never });
    expect(s.backgroundColor).toBe("#8b5cf6");
    expect(s.borderRadius).toBe("12px");
  });
});

describe("getLinkButtonAppearance – varianterna skiljer sig", () => {
  it("soft är inte längre solid med opacity", () => {
    const soft = styleFor({ buttonVariant: "soft" });
    expect(soft.opacity).toBeUndefined();
    expect(soft.backgroundColor).toMatch(/^rgba\(139, 92, 246, 0\.1/);
    expect(soft.backgroundColor).not.toBe(styleFor({}).backgroundColor);
  });

  it("ger unik stil för varje variant", () => {
    const seen = new Set(BUTTON_VARIANTS.map((v) => JSON.stringify(styleFor({ buttonVariant: v }))));
    expect(seen.size).toBe(BUTTON_VARIANTS.length);
  });

  it("gradient har vinklad flerfärgsgradient, högdagerlinje och läsbar text", () => {
    const s = styleFor({ buttonVariant: "gradient", accentColor: "#fbbf24" });
    expect(String(s.backgroundImage)).toMatch(/linear-gradient\(115deg, #[0-9a-f]{6} 0%, #fbbf24 45%, #[0-9a-f]{6} 100%\)/);
    expect(String(s.boxShadow)).toContain("inset 0 1px 0 rgba(255,255,255");
    expect(s.color).toBe("#0f172a"); // gult -> mörk text
  });

  it("neon glöder (box- och text-shadow)", () => {
    const s = styleFor({ buttonVariant: "neon" });
    expect(s.textShadow).toBeTruthy();
    expect(s.boxShadow).toContain("inset");
  });

  it("pressed har en hård bottenkant och tryck-klass", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "pressed" });
    expect(a.style.boxShadow).toMatch(/^0 5px 0 #/);
    // Trycket flyttar knappen exakt lika långt som sidan är tjock.
    expect(a.className).toContain("active:translate-y-[5px]");
    expect(a.className).toContain("motion-reduce:active:translate-y-0");
  });

  it("underline har bara en underkant och ingen radie", () => {
    const s = styleFor({ buttonVariant: "underline", buttonStyle: "pill" });
    expect(s.borderBottom).toBe("2px solid #8b5cf6");
    expect(s.border).toBeUndefined();
    expect(s.borderRadius).toBe("0px");
  });

  it("glass har fallback-färg för reducerad transparens", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "glass" });
    expect(a.style.backdropFilter).toBe("blur(10px)");
    expect((a.style as Record<string, unknown>)["--avy-btn-solid"]).toBeTruthy();
    expect(a.className).toContain("prefers-reduced-transparency");
  });

  it("alla knappar har tryckåterkoppling som respekterar reducerad rörelse", () => {
    for (const v of BUTTON_VARIANTS) {
      const { className } = getLinkButtonAppearance({ ...BASE, buttonVariant: v });
      expect(className).toContain("active:scale-[0.97]");
      expect(className).toContain("motion-reduce:active:scale-100");
    }
  });
});

describe("getLinkButtonAppearance – solid/3D/skugga/gradient är lätta att skilja", () => {
  it("solid är platt: ingen skugga, kant eller bakgrundsbild", () => {
    const s = styleFor({});
    expect(s.boxShadow).toBeUndefined();
    expect(s.border).toBeUndefined();
    expect(s.backgroundImage).toBeUndefined();
  });

  it("shadow svävar: stor mjuk färgad skugga och lyft-klass, ingen kant", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "shadow" });
    expect(a.style.boxShadow).toMatch(/^0 18px 34px -10px rgba\(139, 92, 246/);
    expect(a.style.border).toBeUndefined();
    expect(a.className).toContain("-translate-y-[2px]");
  });

  it("miniatyrer får inga tryck-/lyftklasser (de ska inte röra sig i rutnätet)", () => {
    for (const v of ["pressed", "shadow", "pixel"] as const) {
      const { className } = getLinkButtonAppearance({ ...BASE, buttonVariant: v }, { scale: 0.6 });
      expect(className).not.toMatch(/translate-y-\[/);
    }
  });
});

describe("getLinkButtonAppearance – nya premiumvarianter", () => {
  it("liquid är mättat glas med ljusbrytningsklass och fallback för reducerad transparens", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "liquid" });
    expect(a.style.backdropFilter).toContain("saturate(");
    expect(a.className).toContain("avy-btn-liquid");
    expect(a.className).toContain("prefers-reduced-transparency");
    expect((a.style as Record<string, unknown>)["--avy-btn-solid"]).toMatch(/^#/);
  });

  it("holo har folie-gradient och svepklass", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "holo" });
    expect(String(a.style.backgroundImage)).toContain("linear-gradient(115deg");
    expect(a.className).toContain("avy-btn-holo");
  });

  it("sticker har tjock vit kant, hård offset-skugga och lutningsklass", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "sticker" });
    expect(a.style.border).toBe("3px solid #ffffff");
    expect(a.style.boxShadow).toMatch(/^3px 4px 0 /);
    expect(a.className).toContain("avy-btn-sticker");
  });

  it("pixel har raka hörn, trappstegsram och spärrad text", () => {
    const s = styleFor({ buttonVariant: "pixel", buttonStyle: "pill" });
    expect(s.borderRadius).toBe("0px");
    expect(s.letterSpacing).toBe("0.12em");
    expect(String(s.boxShadow)).toMatch(/0 -4px 0 0 #/);
    expect(String(s.boxShadow)).toMatch(/8px 8px 0 0 /);
  });

  it("neon har tryckpuls-klass men ingen loop", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "neon" });
    expect(a.className).toContain("avy-btn-neon");
    expect((a.style as Record<string, unknown>)["--avy-btn-glow"]).toBeTruthy();
  });
});

describe("kontrast på ljus och mörk sida", () => {
  const LIGHT: Partial<CustomThemeSettings> = { backgroundColor: "#ffffff", textColor: "#0f172a" };
  const DARK: Partial<CustomThemeSettings> = { backgroundColor: "#0f172a", textColor: "#f8fafc" };
  const ACCENTS = ["#8b5cf6", "#22d3ee", "#fbbf24", "#ef4444", "#10b981", "#ffffff", "#000000"];

  /** Transparenta varianter: texten står mot sidan. */
  const SEE_THROUGH = new Set(["outline", "ghost", "underline", "neon", "soft", "glass", "liquid"]);

  it("neon på ljus yta bakom knappen klarar 4,5:1 (var ~2,3:1)", () => {
    // Bildbakgrund => ytterlighetsfallen inkl. vit bild under kortet.
    const s = styleFor({ ...LIGHT, backgroundType: "image", buttonVariant: "neon", accentColor: "#22d3ee" });
    for (const bg of getButtonBackdropColors({ backgroundType: "image" })) {
      expect(contrast(String(s.color), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("bakgrunden bakom knapparna är profilkortet ovanpå sidan", () => {
    expect(getButtonBackdropColors({ backgroundType: "solid", backgroundColor: "#ffffff" })).toEqual(["#6f747f"]);
    expect(getButtonBackdropColors({ backgroundType: "solid", backgroundColor: "#0f172a" })).toEqual(["#0f172a"]);
  });

  it("neon på mörk sida behåller glöd och läsbarhet", () => {
    const s = styleFor({ ...DARK, buttonVariant: "neon", accentColor: "#8b5cf6" });
    expect(contrast(String(s.color), "#0f172a")).toBeGreaterThanOrEqual(4.5);
    expect(s.textShadow).toBeTruthy();
  });

  for (const page of [LIGHT, DARK]) {
    for (const accent of ACCENTS) {
      it(`fyllda varianter har läsbar text (sida ${page.backgroundColor}, accent ${accent})`, () => {
        for (const v of ["pressed", "gradient", "sticker", "pixel", "metallic", "holo"] as const) {
          const s = styleFor({ ...page, accentColor: accent, buttonVariant: v });
          const surfaces = String(s.backgroundImage ?? "").match(/#[0-9a-f]{6}/g) ?? [String(s.backgroundColor)];
          const worst = Math.min(...surfaces.map((bg) => contrast(String(s.color), bg)));
          expect(worst, `${v}`).toBeGreaterThanOrEqual(3);
        }
      });

      it(`genomskinliga varianter har läsbar text mot sidan (sida ${page.backgroundColor}, accent ${accent})`, () => {
        for (const v of BUTTON_VARIANTS.filter((x) => SEE_THROUGH.has(x) && x !== "liquid" && x !== "soft")) {
          const s = styleFor({ ...page, accentColor: accent, buttonVariant: v });
          // Texten står på profilkortet (mörkt, halvgenomskinligt) ovanpå sidan.
          for (const bg of getButtonBackdropColors({ ...BASE, ...page })) {
            expect(contrast(String(s.color), bg), `${v}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    }
  }

  it("ensureContrast behåller färgen när den redan räcker", () => {
    expect(ensureContrast("#000000", ["#ffffff"])).toBe("#000000");
    expect(contrast(ensureContrast("#22d3ee", ["#ffffff"]), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("getLinkButtonAppearance – avancerade fält", () => {
  it("buttonTextColor vinner över variantens text", () => {
    expect(styleFor({ buttonVariant: "gradient", buttonTextColor: "#ff0000" }).color).toBe("#ff0000");
  });

  it("egen kantfärg och -tjocklek", () => {
    const s = styleFor({ buttonBorderColor: "#00ff00", buttonBorderWidth: 3 });
    expect(s.border).toBe("3px solid #00ff00");
  });

  it("kanttjocklek 0 tar bort variantens kant", () => {
    expect(styleFor({ buttonVariant: "outline", buttonBorderWidth: 0 }).border).toBeUndefined();
  });

  it("skuggfärg används av shadow-varianten", () => {
    expect(styleFor({ buttonVariant: "shadow", buttonShadowColor: "#ff0000" }).boxShadow).toContain("rgba(255, 0, 0");
  });

  it("ogiltiga färger ignoreras", () => {
    expect(styleFor({ buttonTextColor: "red; background:url(x)" }).color).toBe("#f8fafc");
  });
});

describe("per-länk-färg", () => {
  it("ersätter accenten och ger läsbar text på solid", () => {
    const s = styleFor({}, { customColor: "#fffc00" });
    expect(s.backgroundColor).toBe("#fffc00");
    expect(s.color).toBe("#0f172a");
  });

  it("följer outline-varianten", () => {
    const s = styleFor({ buttonVariant: "outline" }, { customColor: "#ff0000" });
    expect(s.border).toBe("2px solid #ff0000");
    // Rött på mörkt kort är ~4:1 — texten ljusas en aning, samma kulör.
    expect(String(s.color)).toMatch(/^#ff/);
    expect(contrast(String(s.color), "#0f172a")).toBeGreaterThanOrEqual(4.5);
  });

  it("klassiska teman får fylld färg", () => {
    expect(getClassicLinkColorStyle("#000000")).toEqual({ backgroundColor: "#000000", color: "#ffffff" });
    expect(getClassicLinkColorStyle("nope")).toEqual({});
  });
});

describe("hjälpare", () => {
  it("clampButtonBorderWidth klampar och avvisar skräp", () => {
    expect(clampButtonBorderWidth(9)).toBe(4);
    expect(clampButtonBorderWidth(-2)).toBe(0);
    expect(clampButtonBorderWidth("2")).toBe(2);
    expect(clampButtonBorderWidth(1.6)).toBe(2);
    expect(clampButtonBorderWidth("abc")).toBeNull();
    expect(clampButtonBorderWidth(undefined)).toBeNull();
  });

  it("pickReadableText väljer den text som klarar sämsta bakgrunden", () => {
    expect(pickReadableText(["#ffffff"])).toBe("#0f172a");
    expect(pickReadableText(["#000000"])).toBe("#ffffff");
  });
});

describe("vald knapptextfärg på genomskinliga varianter", () => {
  it("ignorerar en mörk knapptext som blir oläslig på neon över mörk bakgrund", async () => {
    const { getLinkButtonAppearance } = await import("@/lib/theme/button-style");
    const { getRelativeLuminance } = await import("@/utils/color");
    const contrastRatio = (a: string, b: string) => {
      const [x, y] = [getRelativeLuminance(a), getRelativeLuminance(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    const settings = {
      buttonVariant: "neon" as const, accentColor: "#f7a8c8", buttonTextColor: "#3b0a22",
      backgroundType: "gradient" as const, gradientFrom: "#3b0a22", gradientTo: "#14040c", textColor: "#ffeef5",
    };
    const { style } = getLinkButtonAppearance(settings as never);
    expect(String(style.color)).not.toBe("#3b0a22");
    expect(contrastRatio(String(style.color), "#1a1020")).toBeGreaterThan(4);
  });
  it("behåller vald knapptext på fyllda varianter", async () => {
    const { getLinkButtonAppearance } = await import("@/lib/theme/button-style");
    const { style } = getLinkButtonAppearance({ buttonVariant: "solid", accentColor: "#f7a8c8", buttonTextColor: "#3b0a22" } as never);
    expect(style.color).toBe("#3b0a22");
  });
});
