import { describe, expect, it } from "vitest";

import { getProfileData } from "@/lib/profile-mapper";

/**
 * Regressionstester för profil-mappern (ClickUp 86c6rbe2j).
 * Mappern driver både publik profil och preview — buggar här syns direkt för besökare.
 */

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    username: "oskar",
    name: "Oskar Östlind",
    bio: "Bygger AvyraCards",
    avatarUrl: "https://blob.example/avatar.jpg",
    businessAvatarUrl: null,
    phoneNumber: "+46701234567",
    contactEmail: "oskar@example.com",
    jobTitle: "Grundare",
    companyName: "Avyra AB",
    location: "Stockholm",
    businessHeadline: null,
    businessPhone: null,
    businessEmail: null,
    companyWebsite: null,
    bookingUrl: null,
    links: [],
    ...overrides,
  };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "link-1",
    title: "Instagram",
    url: "https://instagram.com/avyracards",
    icon: null,
    mode: "SOCIAL",
    isActive: true,
    order: 0,
    userId: "user-1",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe("getProfileData – SOCIAL", () => {
  it("använder avatarUrl och bio", () => {
    const data = getProfileData(baseUser(), "SOCIAL");

    expect(data.image).toBe("https://blob.example/avatar.jpg");
    expect(data.headline).toBe("Bygger AvyraCards");
    expect(data.displayName).toBe("Oskar Östlind");
    expect(data.mode).toBe("SOCIAL");
  });

  it("faller tillbaka på username när namn saknas", () => {
    const data = getProfileData(baseUser({ name: null }), "SOCIAL");
    expect(data.displayName).toBe("oskar");
  });

  it("lägger vCard-knappen först och sedan telefon/e-post", () => {
    const data = getProfileData(baseUser(), "SOCIAL");
    expect(data.actions.map((a) => a.type)).toEqual(["vcard", "phone", "email"]);
    expect(data.actions[0].url).toBe("/api/vcard/oskar?mode=social");
    expect(data.actions[0].primary).toBe(true);
  });

  it("döljer vCard-knappen när showSaveContact är av", () => {
    const data = getProfileData(
      baseUser({ themeSettings: { showSaveContact: false } }),
      "SOCIAL"
    );

    expect(data.showSaveContact).toBe(false);
    expect(data.actions.some((a) => a.type === "vcard")).toBe(false);
  });

  it("visar bara aktiva länkar i rätt läge", () => {
    const data = getProfileData(
      baseUser({
        links: [
          link({ id: "a", mode: "SOCIAL" }),
          link({ id: "b", mode: "BUSINESS" }),
          link({ id: "c", mode: "SOCIAL", isActive: false }),
        ],
      }),
      "SOCIAL"
    );

    expect(data.links.map((l) => l.id)).toEqual(["a"]);
  });

  it("behandlar länkar utan mode som SOCIAL", () => {
    const data = getProfileData(
      baseUser({ links: [link({ id: "legacy", mode: null })] }),
      "SOCIAL"
    );

    expect(data.links.map((l) => l.id)).toEqual(["legacy"]);
  });
});

describe("getProfileData – länkanpassning", () => {
  it("normaliserar href så knappen alltid är klickbar", () => {
    const data = getProfileData(
      baseUser({ links: [link({ url: "oskarostlind.se" })] }),
      "SOCIAL"
    );

    expect(data.links[0].href).toBe("https://oskarostlind.se");
    expect(data.links[0].url).toBe("oskarostlind.se");
  });

  it("löser ut ikonen automatiskt när icon är null", () => {
    const data = getProfileData(
      baseUser({ links: [link({ url: "https://snapchat.com/add/oskar", icon: null })] }),
      "SOCIAL"
    );

    expect(data.links[0].iconSlug).toBe("snapchat");
  });

  it("låter manuellt ikonval slå auto-detekteringen", () => {
    const data = getProfileData(
      baseUser({ links: [link({ url: "https://instagram.com/x", icon: "github" })] }),
      "SOCIAL"
    );

    expect(data.links[0].icon).toBe("github");
    expect(data.links[0].iconSlug).toBe("github");
  });

  it("släpper bara igenom giltiga hexfärger", () => {
    const data = getProfileData(
      baseUser({
        links: [
          link({ id: "a", customColor: "#FF0000" }),
          link({ id: "b", customColor: "rgb(1,2,3)" }),
          link({ id: "c", customColor: null }),
        ],
      }),
      "SOCIAL"
    );

    expect(data.links.map((l) => l.customColor)).toEqual(["#ff0000", null, null]);
  });
});

describe("getProfileData – BUSINESS", () => {
  it("föredrar businessAvatarUrl men faller tillbaka på avatarUrl", () => {
    const withBusiness = getProfileData(
      baseUser({ businessAvatarUrl: "https://blob.example/business.jpg" }),
      "BUSINESS"
    );
    expect(withBusiness.image).toBe("https://blob.example/business.jpg");

    const withoutBusiness = getProfileData(baseUser(), "BUSINESS");
    expect(withoutBusiness.image).toBe("https://blob.example/avatar.jpg");
  });

  it("använder businessHeadline och faller annars tillbaka på jobTitle", () => {
    expect(
      getProfileData(baseUser({ businessHeadline: "Hjälper B2B växa" }), "BUSINESS").headline
    ).toBe("Hjälper B2B växa");

    expect(getProfileData(baseUser(), "BUSINESS").headline).toBe("Grundare");
  });

  it("normaliserar boknings- och webblänkar utan protokoll", () => {
    const data = getProfileData(
      baseUser({
        businessPhone: "+46812345678",
        businessEmail: "info@avyra.se",
        bookingUrl: "cal.com/avyra",
        companyWebsite: "https://avyracards.se",
      }),
      "BUSINESS"
    );

    const byType = Object.fromEntries(data.actions.map((a) => [a.type, a.url]));
    expect(byType.booking).toBe("https://cal.com/avyra");
    expect(byType.website).toBe("https://avyracards.se");
    expect(byType.phone).toBe("tel:+46812345678");
    expect(byType.email).toBe("mailto:info@avyra.se");
  });

  it("tar inte med sociala kontaktfält i business-läget", () => {
    const data = getProfileData(baseUser(), "BUSINESS");
    expect(data.actions.map((a) => a.type)).toEqual(["vcard"]);
  });

  it("hanterar användare helt utan länkar", () => {
    const data = getProfileData(baseUser({ links: undefined }), "BUSINESS");
    expect(data.links).toEqual([]);
  });
});
