import { describe, it, expect, beforeEach } from "vitest";

import {
  ANALYTICS_SCHEMA_VERSION,
  DEDUPE_WINDOW_MS,
  analyticsIngestSchema,
  buildAnalyticsEvent,
  buildDedupeKey,
  getReadableSource,
  isBotUserAgent,
  isDuplicateEvent,
  normalizeDevice,
  normalizeSource,
  __resetDedupeStore,
} from "../analytics/events";

beforeEach(() => {
  __resetDedupeStore();
});

describe("analyticsIngestSchema", () => {
  it("accepterar den payload klienterna skickar idag", () => {
    const parsed = analyticsIngestSchema.safeParse({
      type: "VIEW",
      profileOwnerId: "user_1",
      source: "nfc",
      device: "Mobile",
      referrer: "https://instagram.com/",
    });
    expect(parsed.success).toBe(true);
  });

  it("avvisar okända event-typer", () => {
    const parsed = analyticsIngestSchema.safeParse({
      type: "PURCHASE",
      profileOwnerId: "user_1",
    });
    expect(parsed.success).toBe(false);
  });

  it("avvisar tom profileOwnerId", () => {
    const parsed = analyticsIngestSchema.safeParse({ type: "VIEW", profileOwnerId: "" });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeSource", () => {
  it("låter explicit källa vinna över referrer", () => {
    expect(normalizeSource("nfc", "https://instagram.com/")).toBe("nfc");
    expect(normalizeSource("QR", undefined)).toBe("qr");
    expect(normalizeSource("vcard", undefined)).toBe("vcard");
  });

  it("härleder källa ur referrer när explicit källa saknas", () => {
    expect(normalizeSource(undefined, "https://l.instagram.com/?u=x")).toBe("Instagram");
    expect(normalizeSource(undefined, "https://www.linkedin.com/feed")).toBe("LinkedIn");
    expect(normalizeSource(undefined, "https://t.co/abc")).toBe("X (Twitter)");
    expect(normalizeSource(undefined, "https://www.google.com/")).toBe("Google");
  });

  it("känner igen intern navigering och okända webbplatser", () => {
    expect(normalizeSource(undefined, "https://avyracards.se/dashboard")).toBe("Internal");
    expect(normalizeSource(undefined, "https://nagonannan.se/blogg")).toBe("Webbplats");
  });

  it("faller tillbaka till direct utan källa och referrer", () => {
    expect(normalizeSource(undefined, undefined)).toBe("direct");
    expect(normalizeSource("   ", null)).toBe("direct");
  });

  it("accepterar härledda värden från äldre klienter", () => {
    expect(normalizeSource("Instagram", undefined)).toBe("Instagram");
    expect(normalizeSource("Webbplats", undefined)).toBe("Webbplats");
  });

  it("kastar godtycklig text från okända anropare", () => {
    // Skydd mot att någon spammar in egna källnamn i statistiken.
    expect(normalizeSource("<script>alert(1)</script>", undefined)).toBe("direct");
    expect(normalizeSource("Köp billiga följare", undefined)).toBe("direct");
  });
});

describe("normalizeDevice", () => {
  it("identifierar mobil, platta och dator ur user-agent", () => {
    expect(normalizeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe("Mobile");
    expect(normalizeDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("Tablet");
    expect(normalizeDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("Desktop");
  });

  it("klassar Android-platta som Tablet, inte Mobile", () => {
    // Regression: Android-plattor saknar "Mobile" i user-agent men matchade
    // tidigare /mobile/i-testet inte alls och blev "Desktop".
    expect(normalizeDevice("Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36")).toBe("Tablet");
    expect(normalizeDevice("Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36")).toBe("Mobile");
  });

  it("använder klientens gissning bara när user-agent inte räcker", () => {
    expect(normalizeDevice(null, "Mobile")).toBe("Mobile");
    expect(normalizeDevice(undefined, "tablet")).toBe("Tablet");
    expect(normalizeDevice(null, "Rymdskepp")).toBe("Unknown");
    expect(normalizeDevice(null, null)).toBe("Unknown");
  });
});

describe("isBotUserAgent", () => {
  it("flaggar länkförhandsvisare och crawlers", () => {
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("WhatsApp/2.23")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUserAgent("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBotUserAgent("curl/8.4.0")).toBe(true);
  });

  it("släpper igenom riktiga webbläsare", () => {
    expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe(false);
    expect(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15")).toBe(false);
    expect(isBotUserAgent(null)).toBe(false);
  });
});

describe("isDuplicateEvent", () => {
  const key = buildDedupeKey({ type: "VIEW", profileOwnerId: "u1", linkId: undefined }, "1.2.3.4");

  it("räknar första eventet men inte en omedelbar upprepning", () => {
    expect(isDuplicateEvent(key, 1_000)).toBe(false);
    expect(isDuplicateEvent(key, 1_500)).toBe(true);
  });

  it("släpper igenom igen när fönstret passerat", () => {
    expect(isDuplicateEvent(key, 1_000)).toBe(false);
    expect(isDuplicateEvent(key, 1_000 + DEDUPE_WINDOW_MS)).toBe(false);
  });

  it("håller isär olika länkar, profiler och IP-adresser", () => {
    const a = buildDedupeKey({ type: "CLICK", profileOwnerId: "u1", linkId: "l1" }, "1.2.3.4");
    const b = buildDedupeKey({ type: "CLICK", profileOwnerId: "u1", linkId: "l2" }, "1.2.3.4");
    const c = buildDedupeKey({ type: "CLICK", profileOwnerId: "u1", linkId: "l1" }, "5.6.7.8");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(isDuplicateEvent(a, 0)).toBe(false);
    expect(isDuplicateEvent(b, 0)).toBe(false);
    expect(isDuplicateEvent(c, 0)).toBe(false);
  });
});

describe("buildAnalyticsEvent", () => {
  const payload = { type: "VIEW" as const, profileOwnerId: "u1" };

  it("bygger ett normaliserat event med schemaversion", () => {
    const decision = buildAnalyticsEvent(
      { ...payload, referrer: "https://instagram.com/avyra", device: "Desktop" },
      {
        ip: "1.2.3.4",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148",
        country: "SE",
        city: "Stockholm",
        now: 0,
      },
    );

    expect(decision.keep).toBe(true);
    if (!decision.keep) return;
    expect(decision.event).toMatchObject({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      type: "VIEW",
      profileOwnerId: "u1",
      linkId: null,
      source: "Instagram",
      // Servern litar på user-agent, inte på klientens "Desktop".
      device: "Mobile",
      country: "SE",
      city: "Stockholm",
    });
  });

  it("kastar bot-trafik så att den aldrig hamnar i statistiken", () => {
    const decision = buildAnalyticsEvent(payload, {
      ip: "1.2.3.4",
      userAgent: "facebookexternalhit/1.1",
      now: 0,
    });
    expect(decision).toEqual({ keep: false, reason: "bot" });
  });

  it("kastar dubbletter inom dedup-fönstret", () => {
    const ctx = { ip: "1.2.3.4", userAgent: "Mozilla/5.0 (Macintosh)", now: 0 };
    expect(buildAnalyticsEvent(payload, ctx).keep).toBe(true);
    const second = buildAnalyticsEvent(payload, { ...ctx, now: 2_000 });
    expect(second).toEqual({ keep: false, reason: "duplicate" });
  });

  it("normaliserar tomma strängar till null", () => {
    const decision = buildAnalyticsEvent(
      { ...payload, referrer: "   " },
      { ip: "9.9.9.9", userAgent: "Mozilla/5.0 (Macintosh)", country: "  ", city: "", now: 0 },
    );
    expect(decision.keep).toBe(true);
    if (!decision.keep) return;
    expect(decision.event.referrer).toBeNull();
    expect(decision.event.country).toBeNull();
    expect(decision.event.city).toBeNull();
  });
});

describe("getReadableSource", () => {
  it("översätter explicita källor", () => {
    expect(getReadableSource("nfc", null)).toBe("NFC-kort");
    expect(getReadableSource("qr", null)).toBe("QR-kod");
    expect(getReadableSource("vcard", null)).toBe("Spara Kontakt-knappen");
    expect(getReadableSource("google_wallet", null)).toBe("Digital Plånbok");
  });

  it("skiljer Instagram Bio (link_bio) från vanlig Instagram-trafik", () => {
    // Tidigare mappades båda till "Instagram Bio", vilket gjorde att man inte
    // kunde se skillnad på bio-länken och delade länkar.
    expect(getReadableSource("link_bio", null)).toBe("Instagram Bio");
    expect(getReadableSource("Instagram", null)).toBe("Instagram");
  });

  it("faller tillbaka på referrer för historiska rader utan källa", () => {
    expect(getReadableSource(null, "https://www.facebook.com/")).toBe("Facebook");
    expect(getReadableSource("direct", "https://www.google.se/search")).toBe("Google Sök");
    expect(getReadableSource(null, null)).toBe("Direkt (Ingen data)");
  });

  it("visar värdnamnet för okända webbplatser", () => {
    expect(getReadableSource("Webbplats", null)).toBe("Annan webbplats");
    expect(getReadableSource("okänd", "https://www.exempel.se/sida")).toBe("Annan webbplats");
  });
});
