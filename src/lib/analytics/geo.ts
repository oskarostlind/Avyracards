/**
 * Lokal geo-uppslagning för analytics.
 *
 * Bakgrund: fallbacken hette tidigare ipapi.co — ett gratis-API med ~1000
 * anrop/dygn räknat PER KÄLL-IP. I produktion är käll-IP:t Vercels utgående
 * adress, delad av alla funktioner, så kvoten tog slut nästan direkt och
 * svaret blev 429. Felet swallowades tyst (`if (geoRes.ok)`), vilket är
 * anledningen till att statistiken visade "Okänd plats, SE" trots att
 * landskoden fanns.
 *
 * Nu slås staden upp lokalt i MaxMinds GeoLite2-City-databas. Ingen nätverks-
 * kostnad, ingen kvot och ingen latens värd namnet (~mikrosekunder efter att
 * filen är inläst).
 *
 * Databasen laddas ner med `npm run geo:download` (scripts/download-geolite2.mjs)
 * och ligger i `geodata/GeoLite2-City.mmdb`, som är gitignorerad. Saknas filen
 * degraderar modulen tyst: `lookupGeo()` returnerar null och anroparen behåller
 * det Vercel-headern gav.
 */

import path from "node:path";

import type { CityResponse, Reader } from "maxmind";

export type GeoLookupResult = {
  country: string | null;
  city: string | null;
};

/** Var databasen förväntas ligga. Kan flyttas med MAXMIND_DB_PATH. */
export function resolveGeoDbPath(): string {
  const fromEnv = process.env.MAXMIND_DB_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "geodata", "GeoLite2-City.mmdb");
}

type ReaderState =
  | { status: "ready"; reader: Reader<CityResponse> }
  | { status: "unavailable"; reason: string };

/**
 * Cachas per lambda-instans. Promise:et (inte resultatet) cachas så att två
 * samtidiga requests inte läser in ~70 MB var.
 */
let readerPromise: Promise<ReaderState> | null = null;

async function loadReader(): Promise<ReaderState> {
  const dbPath = resolveGeoDbPath();

  try {
    // Dynamisk import: modulen är bara intressant när ett event faktiskt
    // saknar stad, och `maxmind` ska inte dras in i klientbundlar.
    const mod = await import("maxmind");
    // `maxmind` är CommonJS. Beroende på bundler hamnar exporterna antingen
    // direkt på namespace-objektet eller under `default`.
    const open = mod.open ?? (mod as unknown as { default?: typeof mod }).default?.open;
    if (typeof open !== "function") {
      throw new Error("maxmind.open is not available");
    }

    const reader = await open<CityResponse>(dbPath, {
      // Uppslagningar cachas internt; 6000 noder räcker gott för vår volym.
      cache: { max: 6000 },
    });

    console.log(
      JSON.stringify({
        type: "analytics_geo_db_loaded",
        message: "GeoLite2 database ready",
        dbPath,
      }),
    );

    return { status: "ready", reader };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // Loggas EN gång per instans (promise:et cachas även vid fel), så en
    // saknad databasfil spammar inte loggen.
    console.warn(
      JSON.stringify({
        level: "warn",
        type: "analytics_geo_db_unavailable",
        message:
          "GeoLite2 database could not be opened — falling back to Vercel headers only",
        dbPath,
        error: reason,
      }),
    );
    return { status: "unavailable", reason };
  }
}

/** Endast för tester: tvingar fram en ny inläsning. */
export function __resetGeoReader() {
  readerPromise = null;
}

const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^::$/,
  /^f[cd][0-9a-f]{2}:/i, // unique local addresses
  /^fe80:/i, // link-local
];

/**
 * Loopback, RFC1918 och länklokala adresser går inte att slå upp. Vi filtrerar
 * dem här i stället för att låta varje anropare hitta på sin egen lista.
 */
export function isPrivateIp(ip: string | null | undefined): boolean {
  const value = normalizeIp(ip);
  if (!value) return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * `x-forwarded-for` kan innehålla port (`1.2.3.4:5678`), IPv6-brackets
 * (`[::1]:443`) och zon-id (`fe80::1%eth0`). mmdb-lib vill ha en ren adress.
 */
export function normalizeIp(ip: string | null | undefined): string | null {
  let value = ip?.trim();
  if (!value) return null;

  // [2001:db8::1]:443 → 2001:db8::1
  const bracketed = value.match(/^\[(.+)\](?::\d+)?$/);
  if (bracketed) {
    value = bracketed[1];
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(value)) {
    // IPv4 med port. IPv6 utan brackets kan inte skiljas från kolon-notation,
    // så den lämnas som den är.
    value = value.split(":")[0];
  }

  const zoneIndex = value.indexOf("%");
  if (zoneIndex !== -1) value = value.slice(0, zoneIndex);

  return value || null;
}

/**
 * Slår upp land och stad för en IP-adress.
 *
 * Returnerar null när databasen saknas, IP:t är privat/ogiltigt eller
 * uppslagningen inte gav något — aldrig ett kastat fel. Geodata är trevligt
 * att ha, aldrig kritiskt, och ett analytics-event ska aldrig gå förlorat för
 * att en valfri databasfil inte finns på disk.
 */
export async function lookupGeo(
  ip: string | null | undefined,
): Promise<GeoLookupResult | null> {
  const address = normalizeIp(ip);
  if (!address || isPrivateIp(address)) return null;

  try {
    readerPromise ??= loadReader();
    const state = await readerPromise;
    if (state.status !== "ready") return null;

    const result = state.reader.get(address);
    if (!result) return null;

    const city = result.city?.names?.en?.trim() || null;
    const country = result.country?.iso_code?.trim() || null;

    if (!city && !country) return null;

    return { country, city };
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        type: "analytics_geo_lookup_failed",
        message: "GeoLite2 lookup threw",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}

/** Är den lokala databasen tillgänglig? Används av diagnoslogg i routen. */
export async function isGeoDatabaseAvailable(): Promise<boolean> {
  readerPromise ??= loadReader();
  return (await readerPromise).status === "ready";
}
