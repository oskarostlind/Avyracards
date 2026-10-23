// stats-contract.ts — Mission Control stats-kontrakt v1. Inga personuppgifter: bara aggregerade tal.
// Kopia av kontraktet i marketing-portal (src/lib/mission/stats-contract.ts). Ändras kontraktet
// bumpas STATS_VERSION och alla kopior uppdateras samtidigt.
export const STATS_VERSION = 1 as const;

export const STATS_TZ = "Europe/Stockholm" as const;

/** "YYYY-MM-DD" i Europe/Stockholm. */
export type Day = string;

export type SeriesPoint = { day: Day; value: number };

export type Unit = "count" | "minor" | "pct";

export type Series = {
  /** Stabil nyckel, snake_case, t.ex. "users_new", "quotes", "revenue_gross". */
  key: string;
  label: string; // svensk visningstext
  unit?: Unit; // default "count". "minor" = minsta valutaenhet (öre) för intäkter.
  /** Exakt 31 punkter: de senaste 30 hela Stockholm-dagarna + dagens (partiella) dag, stigande, noll-fyllda. */
  points: SeriesPoint[];
};

export type Kpi = {
  key: string;
  label: string;
  value: number; // alltid ett tal; valuta i minor units (öre)
  unit?: Unit;
  hint?: string; // kort förklaring, visas som title/underrad
};

export type UsersBlock = {
  noun: string;
  total: number;
  new1d: number; // registrerade idag (Stockholm-dag, partiell)
  new7d: number; // rullande: createdAt >= now − 7×24 h
  new30d: number; // rullande: createdAt >= now − 30×24 h
  active7d: number | null; // null = mäts inte
  active30d: number | null;
};

export type RevenueSource = "stripe" | "admob" | "appstore";

export type RevenueBlock = {
  currency: "SEK";
  gross31d: number; // öre, summa av series.points (gross)
  net31d: number | null;
  mrr: number | null; // öre, från aktiva Stripe-prenumerationer
  activeSubscriptions: number | null;
  bySource: { source: RevenueSource; gross31d: number; net31d: number | null; lagDays: number; hint?: string }[];
  /** "revenue_gross", "revenue_net" och per källa "revenue_stripe" | "revenue_admob" | "revenue_appstore". unit "minor". */
  series: Series[];
};

export type StatsResponse = {
  version: typeof STATS_VERSION;
  project: string;
  generatedAt: string; // ISO-8601
  tz: typeof STATS_TZ;
  users: UsersBlock | null;
  kpis: Kpi[];
  series: Series[];
  revenue: RevenueBlock | null;
  sites?: Record<string, { users: null; kpis: Kpi[]; series: Series[] }>;
  /** Ickefatala fel per källa (fasta texter/felkoder, aldrig användardata). */
  warnings?: string[];
};

/** Antal punkter i varje serie: idag − 30 … idag. */
export const SERIES_DAYS = 31;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STATS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Kalenderdag i Stockholm, "YYYY-MM-DD". */
export const stockholmDay = (d: Date): Day => dayFormatter.format(d);

/** Lägger till n kalenderdagar på en "YYYY-MM-DD" (ren datumaritmetik, påverkas inte av sommartid). */
export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** De 31 dagarna idag − 30 … idag (Stockholm), stigande. */
export function seriesDays(now: Date = new Date()): Day[] {
  const today = stockholmDay(now);
  return Array.from({ length: SERIES_DAYS }, (_, i) => addDays(today, i - (SERIES_DAYS - 1)));
}

/** 31 dagar: idag − 30 … idag (Stockholm), noll-fyllda. */
export function emptySeries(now: Date = new Date()): SeriesPoint[] {
  return seriesDays(now).map((day) => ({ day, value: 0 }));
}

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STATS_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Stockholms UTC-offset i ms vid ett visst ögonblick (+1 h vintertid, +2 h sommartid). */
function stockholmOffsetMs(instant: number): number {
  const parts = Object.fromEntries(
    offsetFormatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - (instant - (instant % 1000));
}

/** Start av Stockholm-dag (00:00 lokal tid) som UTC-Date, för WHERE created_at >= …. */
export function startOfStockholmDay(day: Day): Date {
  const [y, m, d] = day.split("-").map(Number);
  const midnightAsUtc = Date.UTC(y, m - 1, d);
  let instant = midnightAsUtc - stockholmOffsetMs(midnightAsUtc);
  // Offseten kan skilja sig mellan gissningen och svaret runt sommartidsbytet — räkna om en gång.
  instant = midnightAsUtc - stockholmOffsetMs(instant);
  return new Date(instant);
}

/** Bygger en 31-punktsserie ur glesa dag-rader (dagar utanför fönstret ignoreras). */
export function buildSeries(
  key: string,
  label: string,
  rows: Iterable<{ day: Day; value: number }>,
  now: Date = new Date(),
  unit?: Unit,
): Series {
  const byDay = new Map<Day, number>();
  for (const row of rows) byDay.set(row.day, (byDay.get(row.day) ?? 0) + Number(row.value));
  const points = seriesDays(now).map((day) => ({ day, value: byDay.get(day) ?? 0 }));
  return unit ? { key, label, unit, points } : { key, label, points };
}

export const sumPoints = (s: Series): number => s.points.reduce((acc, p) => acc + p.value, 0);
