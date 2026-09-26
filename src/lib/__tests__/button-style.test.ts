import { describe, expect, it } from "vitest";

import {
  BUTTON_VARIANTS,
  clampButtonBorderWidth,
  getClassicLinkColorStyle,
  getLinkButtonAppearance,
  pickReadableText,
} from "@/lib/theme/button-style";
import type { CustomThemeSettings } from "@/types/theme";

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
    const s = styleFor({ buttonVariant: "outline" });
    expect(s.backgroundColor).toBe("transparent");
    expect(s.border).toBe("2px solid #8b5cf6");
    expect(s.color).toBe("#8b5cf6");
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

  it("gradient har två färgstopp och läsbar text", () => {
    const s = styleFor({ buttonVariant: "gradient", accentColor: "#fbbf24" });
    expect(String(s.backgroundImage)).toMatch(/^linear-gradient\(135deg, #fbbf24/);
    expect(s.color).toBe("#0f172a"); // gult -> mörk text
  });

  it("neon glöder (box- och text-shadow)", () => {
    const s = styleFor({ buttonVariant: "neon" });
    expect(s.textShadow).toBeTruthy();
    expect(s.boxShadow).toContain("inset");
  });

  it("pressed har en hård bottenkant och tryck-klass", () => {
    const a = getLinkButtonAppearance({ ...BASE, buttonVariant: "pressed" });
    expect(a.style.boxShadow).toMatch(/^0 4px 0 #/);
    expect(a.className).toContain("active:translate-y-[3px]");
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
    expect(s.color).toBe("#ff0000");
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
