import { prisma } from "@/lib/prisma";

import {
  STATS_TZ,
  STATS_VERSION,
  buildSeries,
  seriesDays,
  startOfStockholmDay,
  stockholmDay,
  type Kpi,
  type RevenueBlock,
  type Series,
  type StatsResponse,
} from "./contract";
import { getStripeRevenue, type StripeRevenue } from "./revenue-stripe";

/**
 * Mission Control-statistik för Avyracards (ARCHITECTURE.md §4.2).
 * Samma räkningar som /admin/statistics (src/app/admin/statistics/page.tsx) så att
 * siffrorna går att jämföra, men alla dagar i Europe/Stockholm. Bara aggregat — inga
 * id:n, namn eller e-postadresser lämnar funktionen.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

type DayRow = { day: string; n: number };

/** Prisma DateTime utan @db = timestamp(3) i UTC → konvertera UTC → Stockholm före ::date. */
async function usersPerDay(since: Date) {
  return prisma.$queryRaw<DayRow[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm')::date, 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS n
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
  `;
}

async function profileViewsPerDay(since: Date) {
  return prisma.$queryRaw<DayRow[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm')::date, 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS n
    FROM "AnalyticsEvent"
    WHERE "type" = 'VIEW' AND "createdAt" >= ${since}
    GROUP BY 1
  `;
}

async function cardsClaimedPerDay(since: Date) {
  return prisma.$queryRaw<DayRow[]>`
    SELECT to_char(("claimedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Stockholm')::date, 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS n
    FROM "Card"
    WHERE "claimedAt" >= ${since}
    GROUP BY 1
  `;
}

/** Profilägare med minst en VIEW sedan `since` (samma uttryck som "aktiva profiler" i admin). */
async function activeProfilesSince(since: Date): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(DISTINCT "profileOwnerId")::int AS n
    FROM "AnalyticsEvent"
    WHERE "type" = 'VIEW' AND "createdAt" >= ${since}
  `;
  return Number(rows[0]?.n ?? 0);
}

const toRows = (rows: DayRow[]) => rows.map((r) => ({ day: r.day, value: Number(r.n) }));

/** Kör en DB-del; vid fel → fallback + fast warning i stället för att fälla hela svaret. */
async function safe<T>(name: string, fallback: T, fn: () => Promise<T>, warnings: string[]): Promise<T> {
  try {
    return await fn();
  } catch {
    warnings.push(`db: ${name} misslyckades`);
    return fallback;
  }
}

/** Bygger revenue-blocket av Stripe-delen (eller ett tomt block när Stripe saknas). */
export function buildRevenueBlock(stripe: StripeRevenue | null, now: Date): RevenueBlock {
  if (!stripe) {
    return {
      currency: "SEK",
      gross31d: 0,
      net31d: null,
      mrr: null,
      activeSubscriptions: null,
      bySource: [],
      series: [buildSeries("revenue_gross", "Intäkter (brutto)", [], now, "minor")],
    };
  }
  const gross: Series = { ...stripe.grossSeries, key: "revenue_gross", label: "Intäkter (brutto)" };
  const net: Series = { ...stripe.netSeries, key: "revenue_net", label: "Intäkter (netto)" };
  return {
    currency: "SEK",
    gross31d: stripe.gross31d,
    net31d: stripe.net31d,
    mrr: stripe.mrr,
    activeSubscriptions: stripe.activeSubscriptions,
    bySource: [
      {
        source: "stripe",
        gross31d: stripe.gross31d,
        net31d: stripe.net31d,
        lagDays: 0,
        hint: "kortordrar + premium via webben; App Store-köp räknas som antal (KPI)",
      },
    ],
    series: [gross, net, stripe.grossSeries],
  };
}

export async function collectStats(now: Date = new Date()): Promise<StatsResponse> {
  const warnings: string[] = [];
  const days = seriesDays(now);
  const windowStart = startOfStockholmDay(days[0]);
  const todayStart = startOfStockholmDay(stockholmDay(now));
  const since7d = new Date(now.getTime() - 7 * DAY_MS);
  const since30d = new Date(now.getTime() - 30 * DAY_MS);

  const [
    totalUsers,
    new1d,
    new7d,
    new30d,
    active7d,
    active30d,
    premiumUsers,
    cardsTotal,
    cardsClaimed,
    ordersPaid30d,
    appleIapCount,
    usersRows,
    viewRows,
    claimedRows,
    stripe,
  ] = await Promise.all([
    safe("users_total", 0, () => prisma.user.count(), warnings),
    safe("users_new1d", 0, () => prisma.user.count({ where: { createdAt: { gte: todayStart } } }), warnings),
    safe("users_new7d", 0, () => prisma.user.count({ where: { createdAt: { gte: since7d } } }), warnings),
    safe("users_new30d", 0, () => prisma.user.count({ where: { createdAt: { gte: since30d } } }), warnings),
    safe<number | null>("active7d", null, () => activeProfilesSince(since7d), warnings),
    safe<number | null>("active30d", null, () => activeProfilesSince(since30d), warnings),
    safe("premium_users", 0, () => prisma.user.count({ where: { isPremium: true } }), warnings),
    safe("cards_total", 0, () => prisma.card.count(), warnings),
    safe("cards_claimed", 0, () => prisma.card.count({ where: { status: "CLAIMED" } }), warnings),
    safe(
      "orders_paid_30d",
      0,
      () => prisma.order.count({ where: { createdAt: { gte: since30d }, status: { in: ["PAID", "SHIPPED"] } } }),
      warnings,
    ),
    safe("apple_iap_count", 0, () => prisma.appleIapTransaction.count(), warnings),
    safe<DayRow[]>("users_new_series", [], () => usersPerDay(windowStart), warnings),
    safe<DayRow[]>("profile_views_series", [], () => profileViewsPerDay(windowStart), warnings),
    safe<DayRow[]>("cards_claimed_series", [], () => cardsClaimedPerDay(windowStart), warnings),
    getStripeRevenue(now),
  ]);

  warnings.push(...stripe.warnings);
  if (stripe.revenue) warnings.push(...stripe.revenue.warnings);

  const kpis: Kpi[] = [
    { key: "premium_users", label: "Premium-användare", value: premiumUsers, unit: "count" },
    { key: "cards_total", label: "Kort totalt", value: cardsTotal, unit: "count" },
    { key: "cards_claimed", label: "Aktiverade kort", value: cardsClaimed, unit: "count" },
    {
      key: "orders_paid_30d",
      label: "Betalda ordrar 30 d",
      value: ordersPaid30d,
      unit: "count",
      hint: "status PAID/SHIPPED, senaste 30 dygnen",
    },
    {
      key: "apple_iap_count",
      label: "App Store-köp",
      value: appleIapCount,
      unit: "count",
      hint: "antal App Store-transaktioner totalt; belopp via ASC i portalen",
    },
  ];

  const series: Series[] = [
    buildSeries("users_new", "Nya användare", toRows(usersRows), now, "count"),
    buildSeries("profile_views", "Profilvisningar", toRows(viewRows), now, "count"),
    buildSeries("cards_claimed", "Aktiverade kort", toRows(claimedRows), now, "count"),
  ];

  const response: StatsResponse = {
    version: STATS_VERSION,
    project: "avyracards",
    generatedAt: now.toISOString(),
    tz: STATS_TZ,
    users: {
      noun: "Användare",
      total: totalUsers,
      new1d,
      new7d,
      new30d,
      // User saknar lastActive — "aktiva" = profiler som visats (VIEW) i perioden.
      active7d,
      active30d,
    },
    kpis,
    series,
    revenue: buildRevenueBlock(stripe.revenue, now),
  };
  if (warnings.length > 0) response.warnings = warnings;
  return response;
}
