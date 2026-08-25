import { describe, it, expect } from "vitest";
import {
  canAccess,
  isTemplateLocked,
  matchesLockedTemplate,
  sanitizeLinkCustomization,
  sanitizeThemeSettings,
  getTemplates,
} from "@/lib/feature-access";

const FREE = { isPremium: false, isAdmin: false };
const PREMIUM = { isPremium: true, isAdmin: false };
const ADMIN = { isPremium: false, isAdmin: true };

describe("canAccess", () => {
  it("nekar premium-features för gratiskonton", () => {
    expect(canAccess("theme_premium_templates", FREE)).toBe(false);
    expect(canAccess("theme_background_image", FREE)).toBe(false);
    expect(canAccess("theme_hide_branding", FREE)).toBe(false);
  });

  it("släpper igenom premiumkonton", () => {
    expect(canAccess("theme_premium_templates", PREMIUM)).toBe(true);
    expect(canAccess("analytics_geo", PREMIUM)).toBe(true);
  });

  it("ger admin tillgång även utan premium (gift/beta-vägen)", () => {
    expect(canAccess("theme_premium_templates", ADMIN)).toBe(true);
    expect(canAccess("admin_panel", ADMIN)).toBe(true);
  });

  it("stänger admin-features för vanliga premiumkonton", () => {
    expect(canAccess("admin_panel", PREMIUM)).toBe(false);
  });

  it("behandlar saknad användare som gratis", () => {
    expect(canAccess("theme_premium_templates", null)).toBe(false);
    expect(canAccess("theme_premium_templates", undefined)).toBe(false);
  });
});

describe("isTemplateLocked", () => {
  it("låser premium-mallar för gratiskonton men inte gratismallar", () => {
    for (const mode of ["SOCIAL", "BUSINESS"] as const) {
      const templates = getTemplates(mode);
      const premium = templates.find((t) => t.isPremium)!;
      const free = templates.find((t) => !t.isPremium)!;

      expect(isTemplateLocked(premium, FREE)).toBe(true);
      expect(isTemplateLocked(free, FREE)).toBe(false);
      expect(isTemplateLocked(premium, PREMIUM)).toBe(false);
    }
  });
});

describe("matchesLockedTemplate", () => {
  it("känner igen en premium-mall som skickas rakt in i API:t", () => {
    const premium = getTemplates("SOCIAL").find((t) => t.isPremium)!;
    const hit = matchesLockedTemplate({ ...premium.settings }, "SOCIAL", FREE);
    expect(hit?.id).toBe(premium.id);
  });

  it("låter premiumkonton spara samma mall", () => {
    const premium = getTemplates("SOCIAL").find((t) => t.isPremium)!;
    expect(matchesLockedTemplate({ ...premium.settings }, "SOCIAL", PREMIUM)).toBeNull();
  });

  it("flaggar inte en gratismall", () => {
    const free = getTemplates("BUSINESS").find((t) => !t.isPremium)!;
    expect(matchesLockedTemplate({ ...free.settings }, "BUSINESS", FREE)).toBeNull();
  });
});

describe("sanitizeThemeSettings", () => {
  it("blockerar premium-mall sparad av gratiskonto (regressionsskydd)", () => {
    const premium = getTemplates("SOCIAL").find((t) => t.isPremium)!;
    const res = sanitizeThemeSettings({ ...premium.settings }, "SOCIAL", FREE);

    expect(res.sanitized).toBe(true);
    expect(res.removed).toContain("theme_premium_templates");
    expect(matchesLockedTemplate(res.settings, "SOCIAL", FREE)).toBeNull();
  });

  it("lämnar premiumkontots inställningar orörda", () => {
    const premium = getTemplates("BUSINESS").find((t) => t.isPremium)!;
    const res = sanitizeThemeSettings({ ...premium.settings }, "BUSINESS", PREMIUM);

    expect(res.sanitized).toBe(false);
    expect(res.settings).toEqual(premium.settings);
  });

  it("faller tillbaka på solid färg när gratiskonto sätter bakgrundsbild", () => {
    const res = sanitizeThemeSettings(
      { backgroundType: "image", backgroundImage: "https://example.com/a.jpg" },
      "SOCIAL",
      FREE,
    );

    expect(res.settings.backgroundType).toBe("solid");
    expect(res.settings.backgroundImage).toBeUndefined();
    expect(res.settings.backgroundColor).toBeTruthy();
    expect(res.removed).toContain("theme_background_image");
  });

  it("tvingar tillbaka branding och glass-knappar för gratiskonto", () => {
    const res = sanitizeThemeSettings(
      { hideBranding: true, buttonVariant: "glass", backgroundType: "solid" },
      "SOCIAL",
      FREE,
    );

    expect(res.settings.hideBranding).toBe(false);
    expect(res.settings.buttonVariant).toBe("solid");
    expect(res.removed).toEqual(
      expect.arrayContaining(["theme_hide_branding", "theme_button_glass"]),
    );
  });

  it("muterar inte indatan", () => {
    const input = { hideBranding: true, backgroundType: "solid" as const };
    sanitizeThemeSettings(input, "SOCIAL", FREE);
    expect(input.hideBranding).toBe(true);
  });

  it("rör inte lagliga gratisinställningar", () => {
    const input = {
      backgroundType: "solid" as const,
      backgroundColor: "#123456",
      buttonVariant: "outline" as const,
      frameStyle: "circle" as const,
      hideBranding: false,
    };
    const res = sanitizeThemeSettings(input, "SOCIAL", FREE);
    expect(res.sanitized).toBe(false);
    expect(res.settings).toEqual(input);
  });
});

describe("sanitizeLinkCustomization", () => {
  it("nollar customColor för gratiskonton", () => {
    const res = sanitizeLinkCustomization({ customColor: "#ff0000" }, FREE);
    expect(res.customColor).toBeNull();
    expect(res.sanitized).toBe(true);
    expect(res.removed).toContain("link_custom_color");
  });

  it("släpper igenom och normaliserar färgen för premium", () => {
    const res = sanitizeLinkCustomization({ customColor: "#F00" }, PREMIUM);
    expect(res.customColor).toBe("#ff0000");
    expect(res.sanitized).toBe(false);
  });

  it("ger admin samma rättighet som premium", () => {
    expect(sanitizeLinkCustomization({ customColor: "#123456" }, ADMIN).customColor).toBe(
      "#123456",
    );
  });

  it("avvisar ogiltiga färgvärden utan att flagga premium", () => {
    const res = sanitizeLinkCustomization({ customColor: "red" }, PREMIUM);
    expect(res.customColor).toBeNull();
    expect(res.sanitized).toBe(false);
  });

  it("låter ikonval vara gratis men validerar sluggen", () => {
    expect(sanitizeLinkCustomization({ icon: "snapchat" }, FREE).icon).toBe("snapchat");
    expect(sanitizeLinkCustomization({ icon: "myspace" }, FREE).icon).toBeNull();
    expect(sanitizeLinkCustomization({ icon: "" }, FREE).icon).toBeNull();
    expect(sanitizeLinkCustomization({ icon: null }, PREMIUM).sanitized).toBe(false);
  });

  it("rör inte fält som saknas i indatan", () => {
    const res = sanitizeLinkCustomization({}, FREE);
    expect("customColor" in res).toBe(false);
    expect("icon" in res).toBe(false);
  });
});
