import { describe, expect, it } from "vitest";
import { getCardSurfaceStyle, resolveCardSurface } from "@/lib/theme/card-surface";
import { sanitizeThemeSettings } from "@/lib/feature-access";

describe("profilkortets yta", () => {
  it("utan inställning: samma utseende som tidigare", () => {
    expect(getCardSurfaceStyle({}, { mode: "SOCIAL", animated: false }).backgroundColor).toBe("rgba(15, 23, 42, 0.6)");
    expect(resolveCardSurface({}, { mode: "SOCIAL", animated: false }).blur).toBe(16);
    expect(resolveCardSurface({}, { mode: "BUSINESS", animated: false }).blur).toBe(20);
    expect(resolveCardSurface({}, { mode: "BUSINESS", animated: true })).toEqual({ opacity: 78, blur: 6 });
  });

  it("använder sparad täckning och oskärpa", () => {
    const style = getCardSurfaceStyle({ cardOpacity: 15, cardBlur: 0 }, { mode: "BUSINESS", animated: false });
    expect(style.backgroundColor).toBe("rgba(15, 23, 42, 0.15)");
    expect(style.backdropFilter).toBe("none");
  });

  it("taklägger blur vid animerad bakgrund", () => {
    expect(resolveCardSurface({ cardBlur: 25 }, { mode: "SOCIAL", animated: true }).blur).toBe(6);
  });

  it("sanering klampar och tar bort skräp", () => {
    const { settings } = sanitizeThemeSettings(
      { backgroundType: "solid", cardOpacity: 140, cardBlur: "x" as unknown as number },
      "SOCIAL",
      null,
    );
    expect(settings.cardOpacity).toBe(100);
    expect("cardBlur" in settings).toBe(false);
  });
});
