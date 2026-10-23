import type Stripe from "stripe";

import { buildSeries, seriesDays, startOfStockholmDay, stockholmDay, type Day, type Series } from "./contract";

/**
 * Stripe-intäkter för Mission Control (ARCHITECTURE.md §3.4).
 * Läser bara amount/net/type/created/currency ur balance transactions och
 * pris/antal ur prenumerationer — aldrig kunduppgifter.
 */

/** Minsta fält vi läser ur en balance transaction (gör aggregeringen testbar utan Stripe). */
export type BalanceTxLike = Pick<Stripe.BalanceTransaction, "amount" | "net" | "type" | "created" | "currency">;

const GROSS_TYPES = new Set(["charge", "payment"]);
const NEGATIVE_TYPES = new Set(["refund", "payment_refund", "payment_failure_refund", "adjustment", "dispute"]);

export type StripeDaily = {
  /** öre per Stockholm-dag */
  gross: Map<Day, number>;
  net: Map<Day, number>;
  warnings: string[];
};

/** Summerar balance transactions per Stockholm-dag enligt §3.4. Okända typer ignoreras. */
export function aggregateBalanceTransactions(txs: Iterable<BalanceTxLike>): StripeDaily {
  const gross = new Map<Day, number>();
  const net = new Map<Day, number>();
  const otherCurrencies = new Set<string>();

  for (const tx of txs) {
    const type = String(tx.type);
    if (!GROSS_TYPES.has(type) && !NEGATIVE_TYPES.has(type)) continue;
    if (tx.currency !== "sek") {
      // Kontot avräknas i SEK; annan valuta förväntas inte. Räknas inte in hellre än fel.
      otherCurrencies.add(tx.currency);
      continue;
    }
    const day = stockholmDay(new Date(tx.created * 1000));
    gross.set(day, (gross.get(day) ?? 0) + tx.amount);
    net.set(day, (net.get(day) ?? 0) + tx.net);
  }

  const warnings = [...otherCurrencies].sort().map((cur) => `stripe: valuta ${cur} ignorerad`);
  return { gross, net, warnings };
}

/** Minsta fält vi läser ur en prenumeration. */
export type SubscriptionLike = {
  status: string;
  items: {
    data: Array<{
      quantity?: number | null;
      price: {
        unit_amount: number | null;
        currency: string;
        recurring: { interval: string; interval_count?: number | null } | null;
      };
    }>;
  };
};

/** Normaliserar ett pris till månadsbelopp (öre). */
function monthlyAmount(unitAmount: number, interval: string, intervalCount: number): number {
  const count = intervalCount > 0 ? intervalCount : 1;
  switch (interval) {
    case "year":
      return unitAmount / (12 * count);
    case "week":
      return (unitAmount * 4.33) / count;
    case "day":
      return (unitAmount * 30) / count;
    case "month":
    default:
      return unitAmount / count;
  }
}

/** MRR (öre) + antal aktiva prenumerationer. `trialing` räknas som aktiv men med 0 kr. */
export function computeMrr(subs: Iterable<SubscriptionLike>): { mrr: number; active: number; warnings: string[] } {
  let mrr = 0;
  let active = 0;
  const otherCurrencies = new Set<string>();

  for (const sub of subs) {
    if (sub.status !== "active" && sub.status !== "trialing") continue;
    active += 1;
    if (sub.status === "trialing") continue;
    for (const item of sub.items.data) {
      const price = item.price;
      if (price.unit_amount == null || !price.recurring) continue;
      if (price.currency !== "sek") {
        otherCurrencies.add(price.currency);
        continue;
      }
      mrr += monthlyAmount(price.unit_amount, price.recurring.interval, price.recurring.interval_count ?? 1) * (item.quantity ?? 1);
    }
  }

  const warnings = [...otherCurrencies].sort().map((cur) => `stripe: prenumerationsvaluta ${cur} ignorerad i MRR`);
  return { mrr: Math.round(mrr), active, warnings };
}

// ---------------------------------------------------------------------------
// Hämtning med processcache (1 h färsk, upp till 24 h gammal vid fel)
// ---------------------------------------------------------------------------

const FRESH_MS = 60 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const MAX_PAGES = 10;
const REQUEST_TIMEOUT_MS = 4000;
/** Total tidsbudget för Stripe-anropen så att hela svaret håller sig under 5 s. */
const TOTAL_BUDGET_MS = 4500;

type StripeSnapshot = {
  fetchedAt: number;
  gross: [Day, number][];
  net: [Day, number][];
  mrr: number;
  activeSubscriptions: number;
  warnings: string[];
};

const globalForStats = globalThis as unknown as { __avyraStatsStripeCache?: StripeSnapshot };

export type StripeRevenue = {
  grossSeries: Series;
  netSeries: Series;
  gross31d: number;
  net31d: number;
  mrr: number;
  activeSubscriptions: number;
  warnings: string[];
};

type StripeClientLike = Pick<Stripe, "balanceTransactions" | "subscriptions">;

async function fetchSnapshot(client: StripeClientLike, now: Date): Promise<StripeSnapshot> {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const opts = () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("timeout");
    return { timeout: Math.min(REQUEST_TIMEOUT_MS, remaining), maxNetworkRetries: 0 };
  };

  const since = Math.floor(startOfStockholmDay(seriesDays(now)[0]).getTime() / 1000);
  const warnings: string[] = [];

  const listTxs = async () => {
    const txs: BalanceTxLike[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await client.balanceTransactions.list(
        { created: { gte: since }, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) },
        opts(),
      );
      for (const tx of res.data) txs.push({ amount: tx.amount, net: tx.net, type: tx.type, created: tx.created, currency: tx.currency });
      if (!res.has_more || res.data.length === 0) return txs;
      startingAfter = res.data[res.data.length - 1].id;
    }
    warnings.push(`stripe: fler än ${MAX_PAGES * 100} transaktioner, summan är avkortad`);
    return txs;
  };

  const listSubs = async (status: "active" | "trialing") => {
    const subs: SubscriptionLike[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await client.subscriptions.list(
        { status, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) },
        opts(),
      );
      subs.push(...(res.data as unknown as SubscriptionLike[]));
      if (!res.has_more || res.data.length === 0) return subs;
      startingAfter = res.data[res.data.length - 1].id;
    }
    warnings.push("stripe: fler prenumerationer än vad som räknades");
    return subs;
  };

  const [txs, active, trialing] = await Promise.all([listTxs(), listSubs("active"), listSubs("trialing")]);
  const daily = aggregateBalanceTransactions(txs);
  const mrr = computeMrr([...active, ...trialing]);

  return {
    fetchedAt: Date.now(),
    gross: [...daily.gross.entries()],
    net: [...daily.net.entries()],
    mrr: mrr.mrr,
    activeSubscriptions: mrr.active,
    warnings: [...warnings, ...daily.warnings, ...mrr.warnings],
  };
}

function toRevenue(snap: StripeSnapshot, now: Date, extraWarnings: string[] = []): StripeRevenue {
  const toRows = (entries: [Day, number][]) => entries.map(([day, value]) => ({ day, value }));
  const grossSeries = buildSeries("revenue_stripe", "Stripe", toRows(snap.gross), now, "minor");
  const netSeries = buildSeries("revenue_stripe_net", "Stripe netto", toRows(snap.net), now, "minor");
  const sum = (s: Series) => s.points.reduce((acc, p) => acc + p.value, 0);
  return {
    grossSeries,
    netSeries,
    gross31d: sum(grossSeries),
    net31d: sum(netSeries),
    mrr: snap.mrr,
    activeSubscriptions: snap.activeSubscriptions,
    warnings: [...snap.warnings, ...extraWarnings],
  };
}

/**
 * Stripe-intäkter för de senaste 31 Stockholm-dagarna + MRR. Returnerar `null` + warning
 * när Stripe inte går att nå och ingen tillräckligt färsk cache finns — kastar aldrig.
 */
export async function getStripeRevenue(
  now: Date = new Date(),
): Promise<{ revenue: StripeRevenue | null; warnings: string[] }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { revenue: null, warnings: ["stripe: STRIPE_SECRET_KEY saknas"] };
  }

  const cached = globalForStats.__avyraStatsStripeCache;
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) {
    return { revenue: toRevenue(cached, now), warnings: [] };
  }

  try {
    // Importeras först här så att inget Stripe-anrop kan ske utan nyckel.
    const { stripe } = await import("@/lib/stripe");
    const snap = await fetchSnapshot(stripe, now);
    globalForStats.__avyraStatsStripeCache = snap;
    return { revenue: toRevenue(snap, now), warnings: [] };
  } catch (err) {
    const code = err instanceof Error && err.message === "timeout" ? "timeout" : stripeErrorCode(err);
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
      return { revenue: toRevenue(cached, now, [`stripe: ${code}, visar cache`]), warnings: [] };
    }
    return { revenue: null, warnings: [`stripe: ${code}`] };
  }
}

/** Fast felkod (aldrig felmeddelandets fritext, som kan innehålla id:n). */
function stripeErrorCode(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { type?: unknown; code?: unknown };
    if (typeof e.code === "string" && /^[a-z_]+$/.test(e.code)) return e.code;
    if (typeof e.type === "string" && /^[A-Za-z]+$/.test(e.type)) return e.type;
  }
  return "fel";
}

/** Endast för tester. */
export function __resetStripeCacheForTests() {
  delete globalForStats.__avyraStatsStripeCache;
}
