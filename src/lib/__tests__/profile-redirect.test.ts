import { describe, it, expect } from "vitest";
import { resolveRedirectUrl } from "@/lib/profile-redirect";

const links = [
  { id: "a", url: "instagram.com/x", isActive: true },
  { id: "b", url: "example.com", isActive: true },
  { id: "c", url: "hidden.com", isActive: false },
];

describe("resolveRedirectUrl", () => {
  it("ny användare (redirectEnabled utan vald länk) redirectas INTE till första länken", () => {
    expect(resolveRedirectUrl({ redirectEnabled: true, redirectLinkId: null }, links)).toBeNull();
  });
  it("vald länk + påslaget → den valda länken, inte första", () => {
    expect(resolveRedirectUrl({ redirectEnabled: true, redirectLinkId: "b" }, links)).toBe("example.com");
  });
  it("avslaget → ingen redirect även om en länk är vald", () => {
    expect(resolveRedirectUrl({ redirectEnabled: false, redirectLinkId: "b" }, links)).toBeNull();
  });
  it("vald länk som raderats eller ligger i andra läget → ingen redirect", () => {
    expect(resolveRedirectUrl({ redirectEnabled: true, redirectLinkId: "zzz" }, links)).toBeNull();
  });
  it("vald länk som är inaktiv → ingen redirect", () => {
    expect(resolveRedirectUrl({ redirectEnabled: true, redirectLinkId: "c" }, links)).toBeNull();
  });
});
