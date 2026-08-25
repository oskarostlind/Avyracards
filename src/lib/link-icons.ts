/**
 * Ikon-registret för länkknappar.
 *
 * Två lager:
 *  1. Varumärkesikoner (path-data från Simple Icons) i `link-icons.data.ts`.
 *     Den filen är genererad — se scripts/generate-link-icons.mjs.
 *  2. Generiska ikoner som ritas med lucide-react, samma `iconMap` som resten
 *     av appen redan använder (src/components/icons/social-icons.tsx).
 *
 * Den här modulen är medvetet fri från JSX och React-importer så att
 * detektionslogiken går att testa i vitest (environment: "node") och kan
 * användas både på server och klient.
 *
 * `Link.icon` i databasen lagrar en slug härifrån. `null` betyder "automatisk",
 * dvs. att `detectLinkIconSlug()` får bestämma utifrån URL:en.
 */

import { BRAND_ICON_DATA } from "@/lib/link-icons.data";

export type LinkIconCategory =
  | "generic"
  | "social"
  | "video"
  | "music"
  | "portfolio"
  | "shop"
  | "payment"
  | "utility";

export interface LinkIconDef {
  /** Stabil slug — det som sparas i Link.icon. */
  slug: string;
  /** Visningsnamn i ikonväljaren. */
  title: string;
  category: LinkIconCategory;
  /** Varumärkesfärg, används som snabbval i färgväljaren. */
  hex?: string;
  /** SVG path-data i viewBox "0 0 24 24". Saknas för lucide-baserade poster. */
  path?: string;
  /** Nyckel i iconMap när ikonen ritas av lucide i stället för path-data. */
  lucide?: string;
  /** Domäner som auto-detekteras hit. Matchar även subdomäner. */
  domains?: string[];
  /** Extra ord som matchas mot hela URL:en + titeln när domänen inte räcker. */
  keywords?: string[];
}

/** Sluggen som används när inget varumärke känns igen. */
export const DEFAULT_LINK_ICON = "link";

type BrandMeta = Pick<LinkIconDef, "category" | "domains" | "keywords">;

/**
 * Domäner och kategorier per varumärke. Path/titel/färg kommer från den
 * genererade filen — här bor bara det som är vårt eget val.
 */
const BRAND_META: Record<string, BrandMeta> = {
  // --- Sociala medier ---
  instagram: { category: "social", domains: ["instagram.com", "instagr.am", "ig.me"] },
  tiktok: { category: "social", domains: ["tiktok.com", "vm.tiktok.com"] },
  snapchat: { category: "social", domains: ["snapchat.com", "snap.com"] },
  facebook: { category: "social", domains: ["facebook.com", "fb.com", "fb.me", "m.me"] },
  x: { category: "social", domains: ["x.com", "twitter.com", "t.co"], keywords: ["twitter"] },
  threads: { category: "social", domains: ["threads.net", "threads.com"] },
  pinterest: { category: "social", domains: ["pinterest.com", "pinterest.se", "pin.it"] },
  reddit: { category: "social", domains: ["reddit.com", "redd.it"] },
  discord: { category: "social", domains: ["discord.com", "discord.gg", "discordapp.com"] },
  telegram: { category: "social", domains: ["telegram.org", "telegram.me", "t.me"] },
  whatsapp: { category: "social", domains: ["whatsapp.com", "wa.me", "chat.whatsapp.com"] },
  bluesky: { category: "social", domains: ["bsky.app", "bsky.social"] },
  mastodon: { category: "social", domains: ["mastodon.social", "mastodon.online", "mstdn.social"] },

  // --- Video ---
  youtube: { category: "video", domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"] },
  twitch: { category: "video", domains: ["twitch.tv"] },
  vimeo: { category: "video", domains: ["vimeo.com"] },

  // --- Musik ---
  spotify: { category: "music", domains: ["spotify.com", "spoti.fi", "open.spotify.com"] },
  applemusic: { category: "music", domains: ["music.apple.com"] },
  soundcloud: { category: "music", domains: ["soundcloud.com", "snd.sc"] },
  bandcamp: { category: "music", domains: ["bandcamp.com"] },

  // --- Portfolio & utveckling ---
  github: { category: "portfolio", domains: ["github.com", "github.io"] },
  gitlab: { category: "portfolio", domains: ["gitlab.com"] },
  behance: { category: "portfolio", domains: ["behance.net"] },
  dribbble: { category: "portfolio", domains: ["dribbble.com"] },
  figma: { category: "portfolio", domains: ["figma.com"] },
  medium: { category: "portfolio", domains: ["medium.com"] },
  substack: { category: "portfolio", domains: ["substack.com"] },
  notion: { category: "portfolio", domains: ["notion.so", "notion.site"] },
  wordpress: { category: "portfolio", domains: ["wordpress.com", "wordpress.org", "wp.com"] },

  // --- Handel ---
  etsy: { category: "shop", domains: ["etsy.com"] },
  shopify: { category: "shop", domains: ["shopify.com", "myshopify.com"] },

  // --- Betalning & stöd ---
  paypal: { category: "payment", domains: ["paypal.com", "paypal.me"] },
  venmo: { category: "payment", domains: ["venmo.com"] },
  cashapp: { category: "payment", domains: ["cash.app"] },
  patreon: { category: "payment", domains: ["patreon.com"] },
  kofi: { category: "payment", domains: ["ko-fi.com"] },
  buymeacoffee: { category: "payment", domains: ["buymeacoffee.com", "bmc.link"] },
  klarna: { category: "payment", domains: ["klarna.com"] },

  // --- Verktyg ---
  calendly: { category: "utility", domains: ["calendly.com"] },
  linktree: { category: "utility", domains: ["linktr.ee", "linktree.com"] },
  googledrive: { category: "utility", domains: ["drive.google.com", "docs.google.com"] },
  dropbox: { category: "utility", domains: ["dropbox.com", "db.tt"] },
  googlemaps: { category: "utility", domains: ["maps.google.com", "maps.app.goo.gl"], keywords: ["google.com/maps"] },
  strava: { category: "utility", domains: ["strava.com"] },
};

/**
 * Ikoner som saknas i Simple Icons (LinkedIn togs bort efter ett
 * varumärkesärende) plus de generiska val användaren ska kunna välja manuellt.
 * De ritas med lucide, precis som ikonerna i social-icons.tsx.
 */
const LUCIDE_ICONS: LinkIconDef[] = [
  {
    slug: "linkedin",
    title: "LinkedIn",
    category: "social",
    lucide: "linkedin",
    hex: "#0A66C2",
    domains: ["linkedin.com", "lnkd.in"],
  },
  { slug: DEFAULT_LINK_ICON, title: "Länk", category: "generic", lucide: "default" },
  { slug: "website", title: "Hemsida", category: "generic", lucide: "website", keywords: ["hemsida", "webbplats"] },
  { slug: "email", title: "E-post", category: "generic", lucide: "email" },
  { slug: "phone", title: "Telefon", category: "generic", lucide: "phone" },
  { slug: "calendar", title: "Bokning", category: "generic", lucide: "calendar", domains: ["bokadirekt.se", "cal.com", "boka.se"], keywords: ["boka"] },
  { slug: "meeting", title: "Videomöte", category: "generic", lucide: "meeting", domains: ["zoom.us", "meet.google.com", "teams.microsoft.com", "whereby.com"] },
  { slug: "document", title: "Dokument", category: "generic", lucide: "document", keywords: [".pdf"] },
  { slug: "location", title: "Plats", category: "generic", lucide: "location" },
  { slug: "job", title: "Jobb", category: "generic", lucide: "job" },
];

/** Hela registret. Varumärken först, generiska val sist — samma ordning som i väljaren. */
export const LINK_ICONS: LinkIconDef[] = [
  ...BRAND_ICON_DATA.map((brand): LinkIconDef => {
    const meta = BRAND_META[brand.slug] ?? { category: "generic" as LinkIconCategory };
    return {
      slug: brand.slug,
      title: brand.title,
      hex: brand.hex,
      path: brand.path,
      category: meta.category,
      domains: meta.domains,
      keywords: meta.keywords,
    };
  }),
  ...LUCIDE_ICONS,
];

const BY_SLUG: Record<string, LinkIconDef> = Object.fromEntries(
  LINK_ICONS.map((icon) => [icon.slug, icon]),
);

/**
 * Domän -> slug, sorterad med längsta domänen först. Annars hade
 * "maps.google.com" kunnat förlora mot en kortare, mindre specifik post.
 */
const DOMAIN_INDEX: { domain: string; slug: string }[] = LINK_ICONS.flatMap((icon) =>
  (icon.domains ?? []).map((domain) => ({ domain: domain.toLowerCase(), slug: icon.slug })),
).sort((a, b) => b.domain.length - a.domain.length);

/** Slugs som får sparas i Link.icon. */
export function isKnownLinkIcon(slug: string | null | undefined): boolean {
  return typeof slug === "string" && Object.prototype.hasOwnProperty.call(BY_SLUG, slug);
}

export function getLinkIcon(slug: string | null | undefined): LinkIconDef {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  return BY_SLUG[DEFAULT_LINK_ICON];
}

/**
 * Tar emot en råtext (URL eller titel) och plockar ut hostname.
 * Returnerar null när strängen inte går att tolka som en webbadress.
 */
function extractHostname(value: string): string | null {
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/**
 * Auto-detektering: domän i första hand, nyckelord i andra hand.
 * Faller tillbaka på den generiska länkikonen.
 */
export function detectLinkIconSlug(url?: string | null, title?: string | null): string {
  const raw = (url ?? "").trim();
  const lower = raw.toLowerCase();

  if (lower.startsWith("mailto:")) return "email";
  if (lower.startsWith("tel:")) return "phone";

  const hostname = raw ? extractHostname(raw) : null;
  if (hostname) {
    for (const entry of DOMAIN_INDEX) {
      if (hostname === entry.domain || hostname.endsWith(`.${entry.domain}`)) {
        return entry.slug;
      }
    }
  }

  const haystack = `${lower} ${(title ?? "").toLowerCase()}`.trim();
  if (haystack) {
    for (const icon of LINK_ICONS) {
      for (const keyword of icon.keywords ?? []) {
        if (haystack.includes(keyword.toLowerCase())) return icon.slug;
      }
    }
  }

  return DEFAULT_LINK_ICON;
}

export interface ResolvableLink {
  url?: string | null;
  title?: string | null;
  /** null/undefined = automatisk detektering. */
  icon?: string | null;
}

/** Slutgiltig slug för en länk: manuell override om den finns, annars auto. */
export function resolveLinkIconSlug(link: ResolvableLink): string {
  if (link.icon && isKnownLinkIcon(link.icon)) return link.icon;
  return detectLinkIconSlug(link.url, link.title);
}

export function resolveLinkIcon(link: ResolvableLink): LinkIconDef {
  return getLinkIcon(resolveLinkIconSlug(link));
}
