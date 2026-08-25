import { describe, expect, it } from "vitest";

import {
  DEFAULT_LINK_ICON,
  LINK_ICONS,
  detectLinkIconSlug,
  getLinkIcon,
  isKnownLinkIcon,
  resolveLinkIconSlug,
} from "@/lib/link-icons";

describe("detectLinkIconSlug", () => {
  it("känner igen domäner utan protokoll och med www", () => {
    expect(detectLinkIconSlug("https://snapchat.com/add/oskar")).toBe("snapchat");
    expect(detectLinkIconSlug("snapchat.com/add/oskar")).toBe("snapchat");
    expect(detectLinkIconSlug("https://www.snapchat.com/add/oskar")).toBe("snapchat");
  });

  it("känner igen subdomäner", () => {
    expect(detectLinkIconSlug("https://open.spotify.com/artist/123")).toBe("spotify");
    expect(detectLinkIconSlug("https://oskar.substack.com")).toBe("substack");
  });

  it("hanterar korta delningslänkar", () => {
    expect(detectLinkIconSlug("https://youtu.be/abc123")).toBe("youtube");
    expect(detectLinkIconSlug("https://t.me/oskar")).toBe("telegram");
    expect(detectLinkIconSlug("https://wa.me/46701234567")).toBe("whatsapp");
    expect(detectLinkIconSlug("https://linktr.ee/oskar")).toBe("linktree");
  });

  it("mappar både x.com och twitter.com till X", () => {
    expect(detectLinkIconSlug("https://x.com/oskar")).toBe("x");
    expect(detectLinkIconSlug("https://twitter.com/oskar")).toBe("x");
  });

  it("väljer mest specifika domänen först", () => {
    expect(detectLinkIconSlug("https://drive.google.com/file/d/1")).toBe("googledrive");
    expect(detectLinkIconSlug("https://maps.app.goo.gl/xyz")).toBe("googlemaps");
    expect(detectLinkIconSlug("https://music.apple.com/se/artist/1")).toBe("applemusic");
  });

  it("använder LinkedIn-posten som ritas med lucide", () => {
    expect(detectLinkIconSlug("https://linkedin.com/in/oskar")).toBe("linkedin");
    expect(detectLinkIconSlug("https://lnkd.in/abc")).toBe("linkedin");
  });

  it("känner igen mailto och tel", () => {
    expect(detectLinkIconSlug("mailto:oskar@example.com")).toBe("email");
    expect(detectLinkIconSlug("tel:+46701234567")).toBe("phone");
  });

  it("faller tillbaka på nyckelord när domänen är okänd", () => {
    expect(detectLinkIconSlug("https://minsida.se/cv.pdf")).toBe("document");
    expect(detectLinkIconSlug("https://minsida.se", "Twitter")).toBe("x");
  });

  it("faller tillbaka på generisk länkikon", () => {
    expect(detectLinkIconSlug("https://oskarostlind.se")).toBe(DEFAULT_LINK_ICON);
    expect(detectLinkIconSlug("")).toBe(DEFAULT_LINK_ICON);
    expect(detectLinkIconSlug(null)).toBe(DEFAULT_LINK_ICON);
  });
});

describe("resolveLinkIconSlug", () => {
  it("låter manuell override slå auto-detektering", () => {
    expect(
      resolveLinkIconSlug({ url: "https://instagram.com/oskar", icon: "github" }),
    ).toBe("github");
  });

  it("faller tillbaka på auto när sluggen är okänd", () => {
    expect(
      resolveLinkIconSlug({ url: "https://instagram.com/oskar", icon: "myspace" }),
    ).toBe("instagram");
  });

  it("null betyder automatisk", () => {
    expect(resolveLinkIconSlug({ url: "https://github.com/oskar", icon: null })).toBe(
      "github",
    );
  });
});

describe("registret", () => {
  it("har unika slugs", () => {
    const slugs = LINK_ICONS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("varje ikon kan ritas – path eller lucide", () => {
    for (const icon of LINK_ICONS) {
      expect(Boolean(icon.path || icon.lucide), `${icon.slug} saknar ritdata`).toBe(true);
    }
  });

  it("isKnownLinkIcon avvisar okända slugs", () => {
    expect(isKnownLinkIcon("instagram")).toBe(true);
    expect(isKnownLinkIcon("myspace")).toBe(false);
    expect(isKnownLinkIcon(null)).toBe(false);
  });

  it("getLinkIcon faller tillbaka på generisk ikon", () => {
    expect(getLinkIcon("myspace").slug).toBe(DEFAULT_LINK_ICON);
  });
});
