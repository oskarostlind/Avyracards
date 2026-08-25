import { describe, expect, it } from "vitest";

import {
  coerceUrl,
  isValidLinkUrl,
  normalizeLinkUrl,
} from "@/utils/normalize-url";

describe("normalizeLinkUrl – lägger till protokoll", () => {
  it("lägger till https:// när schemat saknas", () => {
    expect(normalizeLinkUrl("oskarostlind.se")).toEqual({
      ok: true,
      url: "https://oskarostlind.se",
    });
  });

  it("behåller sökväg och query när https:// läggs till", () => {
    expect(normalizeLinkUrl("www.example.com/pris?id=2").url).toBe(
      "https://www.example.com/pris?id=2",
    );
  });

  it("lämnar https:// orört – inget avslutande snedstreck läggs på", () => {
    expect(normalizeLinkUrl("https://avyracards.se").url).toBe(
      "https://avyracards.se",
    );
  });

  it("lämnar http:// orört", () => {
    expect(normalizeLinkUrl("http://example.com/x").url).toBe(
      "http://example.com/x",
    );
  });

  it("trimmar whitespace runt adressen", () => {
    expect(normalizeLinkUrl("  \n oskarostlind.se \t ").url).toBe(
      "https://oskarostlind.se",
    );
  });

  it("tolkar värd:port som värd, inte som schema", () => {
    expect(normalizeLinkUrl("example.com:8080/api").url).toBe(
      "https://example.com:8080/api",
    );
  });

  it("accepterar versaler i schemat", () => {
    expect(normalizeLinkUrl("HTTPS://Example.com").url).toBe(
      "HTTPS://Example.com",
    );
  });
});

describe("normalizeLinkUrl – specialscheman", () => {
  it("släpper igenom mailto: orört", () => {
    expect(normalizeLinkUrl(" mailto:oskar@example.com ")).toEqual({
      ok: true,
      url: "mailto:oskar@example.com",
    });
  });

  it("släpper igenom tel: orört", () => {
    expect(normalizeLinkUrl("tel:+46701234567").url).toBe("tel:+46701234567");
  });

  it("avvisar tomt mailto:", () => {
    expect(normalizeLinkUrl("mailto:").ok).toBe(false);
  });
});

describe("normalizeLinkUrl – avvisar", () => {
  it("tom sträng", () => {
    expect(normalizeLinkUrl("   ")).toEqual({ ok: false, url: "", error: "empty" });
    expect(normalizeLinkUrl(null).error).toBe("empty");
    expect(normalizeLinkUrl(undefined).error).toBe("empty");
  });

  it("javascript: och andra scheman", () => {
    expect(normalizeLinkUrl("javascript:alert(1)").error).toBe("unsupported-scheme");
    expect(normalizeLinkUrl("data:text/html,<h1>hej</h1>").error).toBe("unsupported-scheme");
    expect(normalizeLinkUrl("ftp://example.com").error).toBe("unsupported-scheme");
  });

  it("hostname utan punkt", () => {
    expect(normalizeLinkUrl("localhost").ok).toBe(false);
    expect(normalizeLinkUrl("http://localhost:3000").ok).toBe(false);
    expect(normalizeLinkUrl("bara text").ok).toBe(false);
  });

  it("hostname med felplacerade punkter", () => {
    expect(normalizeLinkUrl(".example.com").ok).toBe(false);
    expect(normalizeLinkUrl("example.com.").ok).toBe(false);
    expect(normalizeLinkUrl("example..com").ok).toBe(false);
  });

  it("adress med mellanslag inuti", () => {
    expect(normalizeLinkUrl("https://example.com/min sida").ok).toBe(false);
  });
});

describe("isValidLinkUrl", () => {
  it("speglar normalizeLinkUrl", () => {
    expect(isValidLinkUrl("oskarostlind.se")).toBe(true);
    expect(isValidLinkUrl("javascript:void(0)")).toBe(false);
  });
});

describe("coerceUrl", () => {
  it("gissar https:// utan att validera", () => {
    expect(coerceUrl("example.com")).toBe("https://example.com");
    expect(coerceUrl("https://example.com")).toBe("https://example.com");
    expect(coerceUrl("mailto:a@b.se")).toBe("mailto:a@b.se");
    expect(coerceUrl("  ")).toBe("");
    expect(coerceUrl(null)).toBe("");
  });
});
