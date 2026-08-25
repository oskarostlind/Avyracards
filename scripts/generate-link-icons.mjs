/**
 * Genererar src/lib/link-icons.data.ts från paketet `simple-icons`.
 *
 * Varför generera i stället för att importera paketet i runtime:
 * `simple-icons` innehåller 3000+ ikoner. Även med tree shaking drar det in ett
 * enormt modulträd i dev-kompileringen, och en enda slarvig `import * as` hade
 * lagt hela paketet i klientbundlen. Vi plockar i stället ut de ~45 varumärken
 * vi faktiskt mappar mot och committar path-datan (några kB) i repot.
 *
 * Kör (paketet behöver INTE ligga i package.json — installera tillfälligt):
 *   npm i --no-save simple-icons@16 && node scripts/generate-link-icons.mjs
 *
 * Eller peka direkt på en redan nedladdad kopia:
 *   SIMPLE_ICONS_PATH=/tmp/simple-icons/index.mjs node scripts/generate-link-icons.mjs
 *
 * Ikonerna är CC0 1.0 (Simple Icons). Varumärkena tillhör respektive ägare.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Kurerad lista — sociala medier, video, musik, portfolio/dev, handel, betalning.
// Ordningen här styr ordningen i ikonväljaren.
// OBS: linkedin, amazon och swish saknas i simple-icons (borttagna efter
// varumärkesärenden respektive aldrig tillagda). De ligger i stället som
// lucide-baserade poster i src/lib/link-icons.ts.
const SLUGS = [
  // Sociala medier
  "instagram", "tiktok", "snapchat", "facebook", "x", "threads",
  "pinterest", "reddit", "discord", "telegram", "whatsapp", "bluesky", "mastodon",
  // Video
  "youtube", "twitch", "vimeo",
  // Musik
  "spotify", "applemusic", "soundcloud", "bandcamp",
  // Portfolio & utveckling
  "github", "gitlab", "behance", "dribbble", "figma", "medium", "substack",
  "notion", "wordpress",
  // Handel
  "etsy", "shopify",
  // Betalning & stöd
  "paypal", "venmo", "cashapp", "patreon", "kofi", "buymeacoffee", "klarna",
  // Verktyg
  "calendly", "linktree", "googledrive", "dropbox", "googlemaps", "strava",
];

const icons = await import(process.env.SIMPLE_ICONS_PATH || "simple-icons");

const missing = [];
const rows = [];

for (const slug of SLUGS) {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = icons[key];
  if (!icon) {
    missing.push(`${slug} (${key})`);
    continue;
  }
  rows.push({
    slug,
    title: icon.title,
    hex: `#${icon.hex}`,
    path: icon.path,
  });
}

if (missing.length) {
  console.error("Hittade inte följande slugs i simple-icons:", missing.join(", "));
  process.exitCode = 1;
}

const header = `/**
 * GENERERAD FIL — redigera inte för hand.
 * Kör \`npx --yes --package=simple-icons@16 node scripts/generate-link-icons.mjs\`.
 *
 * Path-data från Simple Icons (https://simpleicons.org), licens CC0 1.0.
 * Varumärkena tillhör respektive ägare. Domän-mappning och kategorier bor i
 * src/lib/link-icons.ts — inte här.
 */

export interface BrandIconData {
  /** Stabil slug som sparas i Link.icon. */
  slug: string;
  /** Visningsnamn i ikonväljaren. */
  title: string;
  /** Varumärkets färg — används som snabbval i färgväljaren. */
  hex: string;
  /** SVG path-data, ritad i viewBox "0 0 24 24". */
  path: string;
}

export const BRAND_ICON_DATA: readonly BrandIconData[] = [
`;

const body = rows
  .map(
    (r) =>
      `  { slug: ${JSON.stringify(r.slug)}, title: ${JSON.stringify(r.title)}, hex: ${JSON.stringify(r.hex)}, path: ${JSON.stringify(r.path)} },`
  )
  .join("\n");

const out = `${header}${body}\n] as const;\n`;

const target = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/link-icons.data.ts"
);

writeFileSync(target, out, "utf8");
console.log(`Skrev ${rows.length} ikoner till ${target}`);
