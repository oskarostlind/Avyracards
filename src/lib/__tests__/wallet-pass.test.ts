import { describe, expect, it } from "vitest";

import {
  buildWalletPassContent,
  normalizeWalletBaseUrl,
  walletRemoteImageUrl,
  WALLET_PASS_FIELDS,
  type WalletPassUser,
} from "@/lib/wallet/pass-content";
import {
  buildGoogleWalletObject,
  googleWalletClassId,
  googleWalletObjectId,
  normalizeGooglePrivateKey,
} from "@/lib/wallet/google";

function makeUser(overrides: Partial<WalletPassUser> = {}): WalletPassUser {
  return {
    id: "user-1",
    username: "oskar",
    name: "Oskar Östlind",
    bio: "Bygger AvyraCards",
    avatarUrl: "https://cdn.example.com/social.png",
    businessAvatarUrl: null,
    businessHeadline: null,
    jobTitle: null,
    profileMode: "SOCIAL",
    ...overrides,
  };
}

describe("normalizeWalletBaseUrl", () => {
  it("tvingar den kanoniska domänen även om env pekar på .com", () => {
    expect(normalizeWalletBaseUrl("https://avyracards.com")).toBe(
      "https://avyracards.se"
    );
  });

  it("faller tillbaka på .se när env saknas", () => {
    expect(normalizeWalletBaseUrl(undefined)).toBe("https://avyracards.se");
    expect(normalizeWalletBaseUrl("")).toBe("https://avyracards.se");
  });

  it("tar bort avslutande slash så länkarna inte får dubbel slash", () => {
    expect(normalizeWalletBaseUrl("https://avyracards.se/")).toBe(
      "https://avyracards.se"
    );
  });

  it("lämnar andra domäner (t.ex. preview-miljöer) orörda", () => {
    expect(normalizeWalletBaseUrl("https://preview.vercel.app")).toBe(
      "https://preview.vercel.app"
    );
  });
});

describe("buildWalletPassContent", () => {
  it("lägger source=wallet på QR-länken men inte på den visade länken", () => {
    const content = buildWalletPassContent(makeUser(), "https://avyracards.se");

    expect(content.profileUrl).toBe(
      "https://avyracards.se/u/oskar?source=wallet"
    );
    expect(content.displayUrl).toBe("avyracards.se/u/oskar");
    expect(content.displayUrl).not.toContain("source=");
  });

  it("använder bio som titel i SOCIAL-läge", () => {
    const content = buildWalletPassContent(makeUser());
    expect(content.headline).toBe("Bygger AvyraCards");
  });

  it("använder businessHeadline före jobTitle i BUSINESS-läge", () => {
    const content = buildWalletPassContent(
      makeUser({
        profileMode: "BUSINESS",
        businessHeadline: "VD",
        jobTitle: "Grundare",
      })
    );
    expect(content.headline).toBe("VD");
  });

  it("faller tillbaka på jobTitle när businessHeadline saknas", () => {
    const content = buildWalletPassContent(
      makeUser({ profileMode: "BUSINESS", jobTitle: "Grundare" })
    );
    expect(content.headline).toBe("Grundare");
  });

  it("använder businessAvatarUrl i BUSINESS-läge (samma bild som profilen)", () => {
    const content = buildWalletPassContent(
      makeUser({
        profileMode: "BUSINESS",
        businessAvatarUrl: "https://cdn.example.com/business.png",
      })
    );
    expect(content.imageUrl).toBe("https://cdn.example.com/business.png");
  });

  it("faller tillbaka på avatarUrl när business-bilden saknas", () => {
    const content = buildWalletPassContent(makeUser({ profileMode: "BUSINESS" }));
    expect(content.imageUrl).toBe("https://cdn.example.com/social.png");
  });

  it("släpper igenom base64-avatarer som null (Wallet kan inte hämta data-URI)", () => {
    expect(
      walletRemoteImageUrl(
        makeUser({ avatarUrl: "data:image/png;base64,AAAA" })
      )
    ).toBeNull();
  });

  it("har rimliga fallbacks när profilen är tom", () => {
    const content = buildWalletPassContent(
      makeUser({ name: null, bio: null, jobTitle: null, avatarUrl: null })
    );
    expect(content.displayName).toBe("oskar");
    expect(content.headline).toBe("Digital Profil");
    expect(content.imageUrl).toBeNull();
  });
});

describe("google wallet-id:n", () => {
  it("är deterministiska per användare, så ett sparat pass alltid går att hitta", () => {
    expect(googleWalletObjectId("abc", "123")).toBe("123.user-abc");
    expect(googleWalletObjectId("abc", "123")).toBe(
      googleWalletObjectId("abc", "123")
    );
  });

  it("binder objektet till klassversionen", () => {
    expect(googleWalletClassId("123")).toBe("123.standard_card_v7");
  });
});

describe("normalizeGooglePrivateKey", () => {
  it("tar bort omslutande citattecken och gör om \\n till radbrytningar", () => {
    expect(normalizeGooglePrivateKey('"line1\\nline2"')).toBe("line1\nline2");
  });

  it("returnerar null när nyckeln saknas eller är tom", () => {
    expect(normalizeGooglePrivateKey(undefined)).toBeNull();
    expect(normalizeGooglePrivateKey("")).toBeNull();
    expect(normalizeGooglePrivateKey("   ")).toBeNull();
  });
});

describe("buildGoogleWalletObject", () => {
  it("bygger ett objekt som matchar klassmallens fieldPaths", () => {
    const object = buildGoogleWalletObject(makeUser(), {
      baseUrl: "https://avyracards.se",
      issuerId: "123",
    });

    const textModules = object.textModulesData as Array<{ id: string }>;
    expect(textModules.map((t) => t.id)).toEqual(["titel", "profil"]);
    expect(object.id).toBe("123.user-user-1");
    expect(object.classId).toBe("123.standard_card_v7");
    expect(object.state).toBe("ACTIVE");
  });

  it("lägger tracking-länken i QR-koden", () => {
    const object = buildGoogleWalletObject(makeUser(), { issuerId: "123" });
    const barcode = object.barcode as { value: string };
    expect(barcode.value).toContain("?source=wallet");
  });

  it("faller tillbaka på AvyraCards-logotypen när profilbilden inte går att hämta", () => {
    const object = buildGoogleWalletObject(
      makeUser({ avatarUrl: "data:image/png;base64,AAAA" }),
      { issuerId: "123" }
    );
    const logo = object.logo as { sourceUri: { uri: string } };
    expect(logo.sourceUri.uri).toBe("https://avyracards.se/wallet/logo.png");
  });

  it("ger identiskt objekt för samma användare (synk får inte ändra formen)", () => {
    const user = makeUser();
    expect(buildGoogleWalletObject(user, { issuerId: "123" })).toEqual(
      buildGoogleWalletObject(user, { issuerId: "123" })
    );
  });
});

describe("WALLET_PASS_FIELDS", () => {
  it("täcker allt som buildWalletPassContent faktiskt läser", () => {
    // Regressionsskydd: läggs ett nytt fält till i passet men glöms bort här,
    // slutar passet uppdateras när just det fältet ändras.
    const fields = new Set<string>(WALLET_PASS_FIELDS);
    for (const key of [
      "name",
      "username",
      "bio",
      "avatarUrl",
      "businessAvatarUrl",
      "businessHeadline",
      "jobTitle",
      "profileMode",
    ]) {
      expect(fields.has(key)).toBe(true);
    }
  });
});
