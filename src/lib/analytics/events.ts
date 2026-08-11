/**
 * Centralt analytics-lager för AvyraCards.
 *
 * Syfte (arkitektur-backlogg punkt 1 + 2):
 *  - ETT event-schema med versionsnummer, i stället för att varje UI-komponent
 *    hittar på sitt eget payload-format.
 *  - Normaliseringen (källa, enhet, bot-detektering, dedup) sker på SERVERN,
 *    inte i klienten. Klienten skickar rådata; servern bestämmer vad som lagras.
 *  - Samma modul används både vid skrivning (ingest) och läsning (dashboard),
 *    så att "raw event" och "presenterad statistik" inte kan glida isär.
 *
 * OBS: värdena som lagras i `source` är medvetet BAKÅTKOMPATIBLA med den data
 * som redan ligger i databasen. Ändra dem inte utan en backfill-plan.
 */

import { z } from "zod";

/**
 * Höjs när formatet på ett lagrat event ändras på ett sätt som kräver backfill.
 * v1 = ursprungsformatet (AnalyticsEvent-tabellen som den ser ut idag).
 */
export const ANALYTICS_SCHEMA_VERSION = 1;

export type AnalyticsEventType = "VIEW" | "CLICK";

/** Payload som klienter (webb, iOS-app, widget) skickar in. */
export const analyticsIngestSchema = z.object({
  type: z.enum(["VIEW", "CLICK"]),
  profileOwnerId: z.string().min(1),
  linkId: z.string().optional(),
  referrer: z.string().optional(),
  /** Klientens gissning – servern normaliserar och kan skriva över. */
  device: z.string().optional(),
  /** Explicit källa, t.ex. ?source=nfc. Härledda värden accepteras också. */
  source: z.string().optional(),
});

export type AnalyticsIngestPayload = z.infer<typeof analyticsIngestSchema>;

/** Kontext som servern (och bara servern) kan fylla i. */
export type AnalyticsRequestContext = {
  ip?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  /** Millisekunder sedan epoch. Injiceras för testbarhet. */
  now?: number;
};

/** Ett färdignormaliserat event, redo att persisteras. */
export type NormalizedAnalyticsEvent = {
  schemaVersion: number;
  type: AnalyticsEventType;
  profileOwnerId: string;
  linkId: string | null;
  source: string;
  referrer: string | null;
  device: string;
  country: string | null;
  city: string | null;
};

export type AnalyticsDropReason =
  | "bot"
  | "duplicate"
  | "rate_limited"
  | "own_traffic"
  | "unknown_owner";

export type AnalyticsDecision =
  | { keep: true; event: NormalizedAnalyticsEvent }
  | { keep: false; reason: AnalyticsDropReason };

/* -------------------------------------------------------------------------- */
/* Källa                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Explicita källor som får passera oförändrade (satta via ?source= eller av
 * appen). Nyckeln är gemener, värdet är exakt så det lagras.
 */
const EXPLICIT_SOURCES: Record<string, string> = {
  nfc: "nfc",
  qr: "qr",
  vcard: "vcard",
  wallet: "wallet",
  apple_wallet: "apple_wallet",
  google_wallet: "google_wallet",
  ios_widget: "ios_widget",
  email_signature: "email_signature",
  link_bio: "link_bio",
  direct: "direct",
};

/**
 * Källor som härleds ur referrer. Skrivs med exakt samma strängar som den
 * tidigare klientsidiga logiken använde, så att historiken förblir jämförbar.
 */
const REFERRER_SOURCES: Array<{ match: string[]; source: string }> = [
  { match: ["instagram."], source: "Instagram" },
  { match: ["facebook.", "fb.com"], source: "Facebook" },
  { match: ["linkedin."], source: "LinkedIn" },
  { match: ["t.co/", "twitter.", "x.com"], source: "X (Twitter)" },
  { match: ["tiktok."], source: "TikTok" },
  { match: ["youtube.", "youtu.be"], source: "YouTube" },
  { match: ["snapchat."], source: "Snapchat" },
  { match: ["pinterest."], source: "Pinterest" },
  { match: ["google."], source: "Google" },
  { match: ["bing.com"], source: "Bing" },
  { match: ["duckduckgo."], source: "DuckDuckGo" },
];

/** Härledda källor som klienter fortfarande kan skicka in (äldre appbyggen). */
const KNOWN_DERIVED_SOURCES = new Set(
  [...REFERRER_SOURCES.map((r) => r.source), "Internal", "Webbplats"].map((s) =>
    s.toLowerCase(),
  ),
);

const INTERNAL_HOSTS = ["avyracards.se", "localhost", "127.0.0.1"];

/**
 * Bestämmer vilken källa som ska lagras.
 *
 * Prioritet: explicit källa (nfc/qr/vcard/...) > referrer-härledd > klientens
 * egen härledning (bakåtkompatibilitet) > "direct".
 */
export function normalizeSource(
  rawSource: string | null | undefined,
  referrer: string | null | undefined,
): string {
  const trimmed = rawSource?.trim();

  if (trimmed) {
    const explicit = EXPLICIT_SOURCES[trimmed.toLowerCase()];
    if (explicit) return explicit;
  }

  const derived = deriveSourceFromReferrer(referrer);
  if (derived) return derived;

  // Äldre klienter härleder själva – acceptera bara kända värden, aldrig
  // godtycklig text från en okänd anropare.
  if (trimmed && KNOWN_DERIVED_SOURCES.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  return "direct";
}

function deriveSourceFromReferrer(
  referrer: string | null | undefined,
): string | null {
  const ref = referrer?.trim().toLowerCase();
  if (!ref) return null;

  for (const entry of REFERRER_SOURCES) {
    if (entry.match.some((needle) => ref.includes(needle))) {
      return entry.source;
    }
  }

  if (INTERNAL_HOSTS.some((host) => ref.includes(host))) return "Internal";

  return "Webbplats";
}

/* -------------------------------------------------------------------------- */
/* Enhet                                                                       */
/* -------------------------------------------------------------------------- */

const CLIENT_DEVICES = new Set(["mobile", "tablet", "desktop"]);

/**
 * Enhetstyp ur user-agent. Tablet testas före mobile eftersom Android-plattor
 * har både "Mobile" och "Tablet" i sin user-agent.
 */
export function normalizeDevice(
  userAgent: string | null | undefined,
  clientHint?: string | null,
): string {
  const ua = userAgent?.toLowerCase() ?? "";

  if (ua) {
    if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "Tablet";
    if (/mobi|iphone|ipod|android|windows phone/.test(ua)) return "Mobile";
    if (/macintosh|windows nt|x11|linux|cros/.test(ua)) return "Desktop";
  }

  const hint = clientHint?.trim().toLowerCase();
  if (hint && CLIENT_DEVICES.has(hint)) {
    return hint.charAt(0).toUpperCase() + hint.slice(1);
  }

  return "Unknown";
}

/* -------------------------------------------------------------------------- */
/* Bot-detektering                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Länkförhandsvisare och crawlers. De blåser upp visningsstatistiken varje
 * gång någon klistrar in sin profillänk i en chatt, vilket gör premium-
 * statistiken otillförlitlig.
 */
const BOT_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "linkedinbot",
  "embedly",
  "quora link preview",
  "pinterestbot",
  "redditbot",
  "skypeuripreview",
  "vkshare",
  "applebot",
  "headlesschrome",
  "phantomjs",
  "python-requests",
  "curl/",
  "wget/",
  "go-http-client",
  "axios/",
  "node-fetch",
  "postman",
  "lighthouse",
  "pagespeed",
  "uptime",
  "monitoring",
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim().toLowerCase();
  if (!ua) return false;
  return BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

/* -------------------------------------------------------------------------- */
/* Dedup                                                                       */
/* -------------------------------------------------------------------------- */

export const DEDUPE_WINDOW_MS = 10_000;

const dedupeStore = new Map<string, number>();
const DEDUPE_MAX_ENTRIES = 5_000;

export function buildDedupeKey(
  payload: Pick<AnalyticsIngestPayload, "type" | "profileOwnerId" | "linkId">,
  ip: string | null | undefined,
): string {
  return [
    payload.type,
    payload.profileOwnerId,
    payload.linkId ?? "-",
    ip ?? "unknown",
  ].join("|");
}

/**
 * Best effort-dedup: samma besökare, samma event, inom DEDUPE_WINDOW_MS räknas
 * en gång. Lagras i minnet per instans — i en serverless-miljö innebär det att
 * dubbletter kan slinka igenom när trafiken sprids över flera instanser. Det
 * är avsiktligt; ett fullständigt skydd kräver delad lagring (t.ex. Redis) och
 * är noterat i byggloggen.
 */
export function isDuplicateEvent(key: string, now: number = Date.now()): boolean {
  const previous = dedupeStore.get(key);

  if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) {
    return true;
  }

  dedupeStore.set(key, now);

  if (dedupeStore.size > DEDUPE_MAX_ENTRIES) {
    for (const [entryKey, timestamp] of dedupeStore) {
      if (now - timestamp >= DEDUPE_WINDOW_MS) dedupeStore.delete(entryKey);
    }
  }

  return false;
}

/** Endast för tester. */
export function __resetDedupeStore() {
  dedupeStore.clear();
}

/* -------------------------------------------------------------------------- */
/* Ingest                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Ren funktion: rådata in, beslut ut. Ingen I/O, inga sidoeffekter utöver
 * dedup-fönstret — vilket gör hela ingest-logiken enhetstestbar.
 */
export function buildAnalyticsEvent(
  payload: AnalyticsIngestPayload,
  context: AnalyticsRequestContext = {},
): AnalyticsDecision {
  const now = context.now ?? Date.now();

  if (isBotUserAgent(context.userAgent)) {
    return { keep: false, reason: "bot" };
  }

  const dedupeKey = buildDedupeKey(payload, context.ip);
  if (isDuplicateEvent(dedupeKey, now)) {
    return { keep: false, reason: "duplicate" };
  }

  return {
    keep: true,
    event: {
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      type: payload.type,
      profileOwnerId: payload.profileOwnerId,
      linkId: payload.linkId ?? null,
      source: normalizeSource(payload.source, payload.referrer),
      referrer: payload.referrer?.trim() || null,
      device: normalizeDevice(context.userAgent, payload.device),
      country: context.country?.trim() || null,
      city: context.city?.trim() || null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Presentation (läsvägen)                                                     */
/* -------------------------------------------------------------------------- */

const READABLE_SOURCES: Record<string, string> = {
  nfc: "NFC-kort",
  qr: "QR-kod",
  wallet: "Digital Plånbok",
  apple_wallet: "Digital Plånbok",
  google_wallet: "Digital Plånbok",
  ios_widget: "Hem-skärm Widget",
  email_signature: "E-postsignatur",
  link_bio: "Instagram Bio",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  "x (twitter)": "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
  google: "Google Sök",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  internal: "Intern navigering",
  webbplats: "Annan webbplats",
  vcard: "Spara Kontakt-knappen",
  direct: "Direkt (Ingen data)",
};

/**
 * Översätter ett lagrat källvärde till något en användare kan läsa.
 * Fungerar även på historiska rader som skrevs innan den här modulen fanns.
 */
export function getReadableSource(
  source: string | null | undefined,
  referrer: string | null | undefined,
): string {
  const key = source?.trim().toLowerCase();

  if (key && key !== "direct") {
    const readable = READABLE_SOURCES[key];
    if (readable) return readable;
  }

  const derived = deriveSourceFromReferrer(referrer);
  if (derived) {
    return READABLE_SOURCES[derived.toLowerCase()] ?? derived;
  }

  if (key === "direct" || !key) return READABLE_SOURCES.direct;

  // Okänd källa: visa värdet som det är hellre än att tappa bort trafiken.
  try {
    if (referrer) return new URL(referrer).hostname.replace("www.", "");
  } catch {
    /* ignoreras – faller igenom till råvärdet nedan */
  }
  return source ?? READABLE_SOURCES.direct;
}
