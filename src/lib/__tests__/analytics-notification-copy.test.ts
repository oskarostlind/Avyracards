import { describe, expect, it } from "vitest";

import {
  buildAnalyticsNotificationCopy,
  getSourcePhrase,
  resolveNotificationKind,
} from "@/lib/analytics/notification-copy";
import { normalizeSource } from "@/lib/analytics/events";

describe("resolveNotificationKind", () => {
  it("skiljer vCard-klick från vanliga länkklick", () => {
    expect(resolveNotificationKind("VIEW", "instagram")).toBe("view");
    expect(resolveNotificationKind("CLICK", "vcard")).toBe("vcard");
    expect(resolveNotificationKind("CLICK", "VCard")).toBe("vcard");
    expect(resolveNotificationKind("CLICK", "nfc")).toBe("click");
    expect(resolveNotificationKind("CLICK", null)).toBe("click");
  });
});

describe("getSourcePhrase", () => {
  it("är skiftlägesokänslig mot lagrade värden", () => {
    // events.ts lagrar referrer-källor med versal ("Instagram"), explicita
    // källor med gemener ("nfc"). Båda ska hitta rätt.
    expect(getSourcePhrase("Instagram")).toEqual({ style: "from", label: "Instagram" });
    expect(getSourcePhrase("instagram")).toEqual({ style: "from", label: "Instagram" });
    expect(getSourcePhrase("nfc")).toEqual({ style: "via", label: "ditt NFC-kort" });
  });

  it("ger ingen fras för källor som inte säger varifrån besökaren kom", () => {
    expect(getSourcePhrase("direct")).toBeNull();
    expect(getSourcePhrase("Internal")).toBeNull();
    expect(getSourcePhrase("vcard")).toBeNull();
    expect(getSourcePhrase(null)).toBeNull();
    expect(getSourcePhrase("")).toBeNull();
  });

  it("hittar inte på en fras för okända värden", () => {
    expect(getSourcePhrase("nagot-helt-annat")).toBeNull();
  });
});

describe("buildAnalyticsNotificationCopy", () => {
  it("sätter källan mitt i meningen för sociala källor", () => {
    expect(buildAnalyticsNotificationCopy("VIEW", "Instagram")).toEqual({
      title: "Profilvisning",
      body: "Någon från Instagram har öppnat din profil.",
    });
  });

  it("sätter kanalen sist för fysiska källor", () => {
    expect(buildAnalyticsNotificationCopy("VIEW", "nfc").body).toBe(
      "Någon har öppnat din profil via ditt NFC-kort.",
    );
    expect(buildAnalyticsNotificationCopy("VIEW", "qr").body).toBe(
      "Någon har öppnat din profil via din QR-kod.",
    );
  });

  it("behåller den generiska texten för direkt trafik", () => {
    expect(buildAnalyticsNotificationCopy("VIEW", "direct").body).toBe(
      "Någon har öppnat din profil.",
    );
    expect(buildAnalyticsNotificationCopy("VIEW", null).body).toBe(
      "Någon har öppnat din profil.",
    );
  });

  it("hoppar över intern trafik som källa", () => {
    expect(buildAnalyticsNotificationCopy("VIEW", "Internal").body).toBe(
      "Någon har öppnat din profil.",
    );
  });

  it("formulerar länkklick och sparad kontakt med källa", () => {
    expect(buildAnalyticsNotificationCopy("CLICK", "LinkedIn")).toEqual({
      title: "Länkklick",
      body: "Någon från LinkedIn klickade på en länk på din profil.",
    });
    expect(buildAnalyticsNotificationCopy("CLICK", "vcard")).toEqual({
      title: "Sparade kontakt",
      body: "Någon sparade ditt visitkort.",
    });
  });

  it("slutar alltid med punkt och saknar aldrig text", () => {
    const sources = [
      "nfc", "qr", "wallet", "apple_wallet", "google_wallet", "ios_widget",
      "email_signature", "link_bio", "Instagram", "Facebook", "LinkedIn",
      "X (Twitter)", "TikTok", "YouTube", "Snapchat", "Pinterest", "Google",
      "Bing", "DuckDuckGo", "Webbplats", "Internal", "direct", "vcard", null,
    ];

    for (const type of ["VIEW", "CLICK"] as const) {
      for (const source of sources) {
        const copy = buildAnalyticsNotificationCopy(type, source);
        expect(copy.title.length, `${type}/${source}`).toBeGreaterThan(0);
        expect(copy.body.endsWith("."), `${type}/${source}`).toBe(true);
        expect(copy.body).not.toContain("{label}");
      }
    }
  });

  it("matchar de värden normalizeSource faktiskt producerar", () => {
    // Skyddsnät: om normalizeSource börjar lagra ett nytt värde ska notisen
    // inte tyst falla tillbaka på generisk text utan att någon märker det.
    const cases: Array<[string | undefined, string | undefined, "from" | "via" | null]> = [
      ["nfc", undefined, "via"],
      [undefined, "https://l.instagram.com/", "from"],
      [undefined, "https://www.linkedin.com/feed", "from"],
      [undefined, "https://avyracards.se/u/oskar", null],
      [undefined, undefined, null],
    ];

    for (const [rawSource, referrer, expected] of cases) {
      const stored = normalizeSource(rawSource, referrer);
      expect(getSourcePhrase(stored)?.style ?? null, stored).toBe(expected);
    }
  });
});
