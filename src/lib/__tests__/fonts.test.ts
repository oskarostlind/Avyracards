import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FONTS,
  DEFAULT_FONT_ID,
  getFont,
  getFontStack,
  getHeadingFontStyle,
  getBodyFontStyle,
  isKnownFontId,
  isPremiumFont,
} from "@/lib/theme/fonts";
import { SOCIAL_TEMPLATES } from "@/data/theme-templates-social";
import { BUSINESS_TEMPLATES } from "@/data/theme-templates-business";

describe("typsnittskatalogen", () => {
  it("behåller de sex ursprungliga id:na (sparade teman)", () => {
    for (const id of ["inter", "playfair", "roboto", "lora", "space", "oswald"]) {
      expect(isKnownFontId(id)).toBe(true);
      expect(isPremiumFont(id)).toBe(false);
    }
  });

  it("har unika id:n och ett rimligt antal typsnitt", () => {
    const ids = FONTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FONTS.length).toBeGreaterThanOrEqual(35);
  });

  it("har minst ett brödtextsäkert typsnitt per kategori utom handskrift", () => {
    for (const c of ["sans", "serif", "display", "mono"]) {
      expect(FONTS.some((f) => f.category === c && f.bodySafe)).toBe(true);
    }
  });

  it("alla mallar använder typsnitt som finns i katalogen", () => {
    for (const t of [...SOCIAL_TEMPLATES, ...BUSINESS_TEMPLATES]) {
      if (t.settings.font) expect(isKnownFontId(t.settings.font)).toBe(true);
    }
  });

  it("varje familj har @font-face i profile-fonts.css (annars laddas den aldrig)", () => {
    const css = readFileSync(path.resolve(__dirname, "../../styles/profile-fonts.css"), "utf8");
    for (const f of FONTS) {
      expect(css, f.family).toContain(`font-family: '${f.family}';`);
    }
    // Bara latin/latin-ext, inga CDN-anrop.
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cyrillic|greek|vietnamese/);
  });
});

describe("resolvern", () => {
  it("ger en riktig font-family med fallback, inte id:t", () => {
    expect(getFontStack("playfair")).toMatch(/^'Playfair Display Variable', .*serif$/);
    expect(getFontStack("space")).toContain("'Space Grotesk Variable'");
  });

  it("faller tillbaka på Inter för okänt eller saknat id", () => {
    expect(getFont("comic-sans").id).toBe(DEFAULT_FONT_ID);
    expect(getFont(undefined).id).toBe(DEFAULT_FONT_ID);
    expect(getFontStack(null)).toContain("'Inter Variable'");
  });

  it("rubrik faller tillbaka på brödtextens typsnitt", () => {
    expect(getHeadingFontStyle(undefined, "lora").fontFamily).toBe(getFontStack("lora"));
    expect(getHeadingFontStyle("pacifico", "lora").fontFamily).toBe(getFontStack("pacifico"));
  });

  it("negativ tracking på sans-rubrik, ingen på brödtext eller skrivstil", () => {
    expect(getHeadingFontStyle("inter", undefined).letterSpacing).toBe("-0.02em");
    expect(getBodyFontStyle("inter").letterSpacing).toBe("0em");
    expect(getHeadingFontStyle("caveat", undefined).letterSpacing).toBe("0em");
  });

  it("enviktstypsnitt får inte fejkad fetstil", () => {
    expect(getHeadingFontStyle("bebas-neue", undefined).fontWeight).toBe(400);
    expect(getHeadingFontStyle("inter", undefined).fontWeight).toBeUndefined();
  });
});
