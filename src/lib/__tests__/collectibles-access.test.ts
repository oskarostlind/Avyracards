import { describe, expect, it } from "vitest";
import {
  canAnimateCollectibleFrame,
  isCollectibleFrameLocked,
  isFrameLocked,
  sanitizeThemeSettings,
  validateThemeSettingsForRender,
} from "@/lib/feature-access";
import {
  FOUNDERS_DROP_ID,
  findCollectible,
  formatSerial,
  isCollectibleFrame,
  requiredDropForFrame,
} from "@/lib/collectibles-shared";
import { ANIMATED_FRAME_STYLES, CLASSIC_FRAME_STYLES, COLLECTIBLE_FRAME_STYLES } from "@/types/theme";

const FREE = { isPremium: false, isAdmin: false };
const PREMIUM = { isPremium: true, isAdmin: false };
const ADMIN = { isPremium: false, isAdmin: true };
const FREE_OWNER = { ...FREE, collectibles: [FOUNDERS_DROP_ID] };
const PREMIUM_OWNER = { ...PREMIUM, collectibles: [FOUNDERS_DROP_ID] };

describe("samlarramar — listor", () => {
  it("founders ligger bara i COLLECTIBLE_FRAME_STYLES", () => {
    expect(COLLECTIBLE_FRAME_STYLES).toContain("founders");
    expect(CLASSIC_FRAME_STYLES as readonly string[]).not.toContain("founders");
    expect(ANIMATED_FRAME_STYLES as readonly string[]).not.toContain("founders");
    expect(isCollectibleFrame("founders")).toBe(true);
    expect(isCollectibleFrame("gold")).toBe(false);
    expect(requiredDropForFrame("founders")).toBe(FOUNDERS_DROP_ID);
    expect(requiredDropForFrame("circle")).toBeNull();
  });
});

describe("isCollectibleFrameLocked / isFrameLocked", () => {
  it("låser founders för alla som inte äger droppet — även premium och admin", () => {
    for (const user of [FREE, PREMIUM, ADMIN, null, undefined]) {
      expect(isCollectibleFrameLocked("founders", user)).toBe(true);
      expect(isFrameLocked("founders", user)).toBe(true);
    }
  });

  it("låser upp founders för ägare oavsett premium", () => {
    expect(isFrameLocked("founders", FREE_OWNER)).toBe(false);
    expect(isFrameLocked("founders", PREMIUM_OWNER)).toBe(false);
  });

  it("ägande av ett annat drop räcker inte", () => {
    expect(isFrameLocked("founders", { ...PREMIUM, collectibles: ["summer-2027"] })).toBe(true);
  });

  it("ändrar inte låsen för vanliga ramar", () => {
    expect(isFrameLocked("gold", FREE_OWNER)).toBe(true);
    expect(isFrameLocked("gold", PREMIUM)).toBe(false);
    expect(isFrameLocked("circle", FREE)).toBe(false);
  });

  it("animerad version kräver premium, statisk gör det inte", () => {
    expect(canAnimateCollectibleFrame(FREE_OWNER)).toBe(false);
    expect(canAnimateCollectibleFrame(PREMIUM_OWNER)).toBe(true);
  });
});

describe("sanitizeThemeSettings med samlarramar", () => {
  it("nollar founders för icke-ägare och rapporterar collectible_frames", () => {
    const res = sanitizeThemeSettings({ frameStyle: "founders" }, "SOCIAL", PREMIUM);
    expect(res.settings.frameStyle).toBe("circle");
    expect(res.removed).toEqual(["collectible_frames"]);
    expect(res.sanitized).toBe(true);
  });

  it("sparar founders för ägare utan premium (statisk ram ingår)", () => {
    const res = sanitizeThemeSettings({ frameStyle: "founders" }, "SOCIAL", FREE_OWNER);
    expect(res.settings.frameStyle).toBe("founders");
    expect(res.removed).toEqual([]);
  });

  it("admin utan ägande får inte spara founders", () => {
    expect(sanitizeThemeSettings({ frameStyle: "founders" }, "BUSINESS", ADMIN).settings.frameStyle).toBe("circle");
  });

  it("saknat collectibles-fält räknas som inget ägande", () => {
    expect(sanitizeThemeSettings({ frameStyle: "founders" }, "SOCIAL", { isPremium: true }).settings.frameStyle).toBe("circle");
  });

  it("renderingsvalideringen behåller founders (ägandet kollas av renderaren)", () => {
    expect(validateThemeSettingsForRender({ frameStyle: "founders" }, "SOCIAL").frameStyle).toBe("founders");
  });
});

describe("formatSerial / findCollectible", () => {
  it("nollfyller till upplagans bredd, minst tre siffror", () => {
    expect(formatSerial(1)).toBe("001");
    expect(formatSerial(42, 100)).toBe("042");
    expect(formatSerial(100, 100)).toBe("100");
    expect(formatSerial(42, 1000)).toBe("0042");
    expect(formatSerial(7, 10)).toBe("007");
  });

  it("hittar rätt drop och tål null", () => {
    const list = [{ dropId: FOUNDERS_DROP_ID, serial: 3, maxSupply: 100 }];
    expect(findCollectible(list, FOUNDERS_DROP_ID)?.serial).toBe(3);
    expect(findCollectible(list, "other")).toBeNull();
    expect(findCollectible(null, FOUNDERS_DROP_ID)).toBeNull();
  });
});
