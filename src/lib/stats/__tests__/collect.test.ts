import { describe, expect, it, vi } from "vitest";

// collect.ts importerar Prisma-klienten; testerna rör bara de rena hjälparna.
const fakePrisma = vi.hoisted(() => ({}) as Record<string, unknown>);
vi.mock("@/lib/prisma", () => ({ prisma: fakePrisma }));

import { isStatsAuthorized } from "@/lib/stats/auth";
import { buildRevenueBlock, collectStats } from "@/lib/stats/collect";
import {
  SERIES_DAYS,
  addDays,
  buildSeries,
  emptySeries,
  startOfStockholmDay,
  stockholmDay,
} from "@/lib/stats/contract";
import { aggregateBalanceTransactions, computeMrr, type BalanceTxLike } from "@/lib/stats/revenue-stripe";

const unix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

describe("Stockholm-dagar", () => {
  it("räknar kalenderdag i Stockholm, inte UTC", () => {
    // 23:30 UTC en vinterdag = 00:30 nästa dag i Stockholm.
    expect(stockholmDay(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-15");
    // 22:30 UTC en sommardag = 00:30 nästa dag (UTC+2).
    expect(stockholmDay(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-15");
  });

  it("ger start av Stockholm-dag som UTC, även runt sommartidsbytet", () => {
    expect(startOfStockholmDay("2026-01-15").toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(startOfStockholmDay("2026-07-15").toISOString()).toBe("2026-07-14T22:00:00.000Z");
    // 29 mars 2026: klockan ställs fram 02:00 → midnatt är fortfarande UTC+1.
    expect(startOfStockholmDay("2026-03-29").toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(startOfStockholmDay("2026-03-30").toISOString()).toBe("2026-03-29T22:00:00.000Z");
    // 25 oktober 2026: klockan ställs tillbaka 03:00 → midnatt är fortfarande UTC+2.
    expect(startOfStockholmDay("2026-10-25").toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(startOfStockholmDay("2026-10-26").toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("addDays hanterar månads- och årsskiften", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("emptySeries har exakt 31 stigande dagar som slutar idag (Stockholm)", () => {
    const now = new Date("2026-10-23T22:30:00Z"); // 00:30 den 24:e i Stockholm
    const points = emptySeries(now);
    expect(points).toHaveLength(SERIES_DAYS);
    expect(points[30]).toEqual({ day: "2026-10-24", value: 0 });
    expect(points[0].day).toBe("2026-09-24");
    expect(points.every((p) => p.value === 0)).toBe(true);
  });

  it("buildSeries noll-fyller, summerar dubbletter och ignorerar dagar utanför fönstret", () => {
    const now = new Date("2026-10-23T10:00:00Z");
    const s = buildSeries(
      "users_new",
      "Nya användare",
      [
        { day: "2026-10-23", value: 2 },
        { day: "2026-10-23", value: 1 },
        { day: "2026-10-01", value: 5 },
        { day: "2026-09-01", value: 99 },
      ],
      now,
      "count",
    );
    expect(s.points).toHaveLength(31);
    expect(s.unit).toBe("count");
    expect(s.points.at(-1)).toEqual({ day: "2026-10-23", value: 3 });
    expect(s.points.find((p) => p.day === "2026-10-01")?.value).toBe(5);
    expect(s.points.reduce((a, p) => a + p.value, 0)).toBe(8);
  });
});

describe("Stripe-aggregering", () => {
  const txs: BalanceTxLike[] = [
    // 23:30 UTC 22 okt = 01:30 23 okt i Stockholm
    { type: "charge", amount: 14900, net: 14400, currency: "sek", created: unix("2026-10-22T23:30:00Z") },
    { type: "payment", amount: 9900, net: 9500, currency: "sek", created: unix("2026-10-23T08:00:00Z") },
    { type: "refund", amount: -9900, net: -9900, currency: "sek", created: unix("2026-10-23T09:00:00Z") },
    { type: "stripe_fee", amount: -500, net: -500, currency: "sek", created: unix("2026-10-23T09:00:00Z") },
    { type: "payout", amount: -100000, net: -100000, currency: "sek", created: unix("2026-10-23T09:00:00Z") },
    { type: "charge", amount: 1000, net: 900, currency: "eur", created: unix("2026-10-21T09:00:00Z") },
    { type: "charge", amount: 4900, net: 4600, currency: "sek", created: unix("2026-10-21T21:59:00Z") }, // 23:59 Stockholm
  ];

  it("summerar brutto/netto per Stockholm-dag och ignorerar payouts/avgifter/annan valuta", () => {
    const { gross, net, warnings } = aggregateBalanceTransactions(txs);
    expect(gross.get("2026-10-23")).toBe(14900 + 9900 - 9900);
    expect(net.get("2026-10-23")).toBe(14400 + 9500 - 9900);
    expect(gross.get("2026-10-21")).toBe(4900);
    expect(gross.has("2026-10-22")).toBe(false);
    expect(warnings).toEqual(["stripe: valuta eur ignorerad"]);
  });

  it("normaliserar MRR till månad och räknar trialing som aktiv men 0 kr", () => {
    const item = (unit_amount: number, interval: string, quantity = 1, currency = "sek", interval_count = 1) => ({
      quantity,
      price: { unit_amount, currency, recurring: { interval, interval_count } },
    });
    const { mrr, active, warnings } = computeMrr([
      { status: "active", items: { data: [item(4900, "month")] } },
      { status: "active", items: { data: [item(12000, "year", 2)] } }, // 24000/12 = 2000
      { status: "active", items: { data: [item(29400, "month", 1, "sek", 6)] } }, // 6 mån → 4900
      { status: "trialing", items: { data: [item(4900, "month")] } },
      { status: "canceled", items: { data: [item(4900, "month")] } },
      { status: "active", items: { data: [item(500, "month", 1, "usd")] } },
    ]);
    expect(mrr).toBe(4900 + 2000 + 4900);
    expect(active).toBe(5);
    expect(warnings).toEqual(["stripe: prenumerationsvaluta usd ignorerad i MRR"]);
  });
});

describe("revenue-blocket", () => {
  const now = new Date("2026-10-23T10:00:00Z");

  it("utan Stripe: tomt block med noll-fylld bruttoserie, inga källor", () => {
    const block = buildRevenueBlock(null, now);
    expect(block.bySource).toEqual([]);
    expect(block.mrr).toBeNull();
    expect(block.gross31d).toBe(0);
    expect(block.series.map((s) => s.key)).toEqual(["revenue_gross"]);
    expect(block.series[0].points).toHaveLength(31);
  });

  it("med Stripe: gross31d = summan av serien och nycklarna följer kontraktet", () => {
    const grossSeries = buildSeries("revenue_stripe", "Stripe", [{ day: "2026-10-23", value: 14900 }], now, "minor");
    const netSeries = buildSeries("revenue_stripe_net", "Stripe netto", [{ day: "2026-10-23", value: 14400 }], now, "minor");
    const block = buildRevenueBlock(
      { grossSeries, netSeries, gross31d: 14900, net31d: 14400, mrr: 4900, activeSubscriptions: 1, warnings: [] },
      now,
    );
    expect(block.series.map((s) => s.key)).toEqual(["revenue_gross", "revenue_net", "revenue_stripe"]);
    expect(block.series.every((s) => s.unit === "minor" && s.points.length === 31)).toBe(true);
    expect(block.gross31d).toBe(block.series[0].points.reduce((a, p) => a + p.value, 0));
    expect(block.bySource[0]).toMatchObject({ source: "stripe", gross31d: 14900, net31d: 14400, lagDays: 0 });
  });
});

describe("isStatsAuthorized", () => {
  it("släpper bara igenom rätt bearer-token", () => {
    expect(isStatsAuthorized("Bearer abc123", "abc123")).toBe(true);
    expect(isStatsAuthorized("bearer abc123", "abc123")).toBe(true);
    expect(isStatsAuthorized("Bearer abc124", "abc123")).toBe(false);
    expect(isStatsAuthorized("Bearer abc", "abc123")).toBe(false);
    expect(isStatsAuthorized("abc123", "abc123")).toBe(false);
    expect(isStatsAuthorized(null, "abc123")).toBe(false);
  });

  it("nekar allt när STATS_TOKEN saknas (fail closed)", () => {
    expect(isStatsAuthorized("Bearer ", undefined)).toBe(false);
    expect(isStatsAuthorized("Bearer x", "")).toBe(false);
  });
});

describe("collectStats", () => {
  it("bygger ett v1-svar utan personuppgifter, även när Stripe och en DB-del fallerar", async () => {
    const count = vi.fn().mockResolvedValue(7);
    Object.assign(fakePrisma, {
      user: { count },
      card: { count },
      order: { count },
      appleIapTransaction: { count: vi.fn().mockRejectedValue(new Error("boom user@example.com")) },
      $queryRaw: vi.fn().mockResolvedValue([{ day: "2026-10-23", n: 2 }]),
    });
    const prevKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const res = await collectStats(new Date("2026-10-23T10:00:00Z"));
      expect(res.version).toBe(1);
      expect(res.project).toBe("avyracards");
      expect(res.tz).toBe("Europe/Stockholm");
      expect(res.users).toMatchObject({ noun: "Användare", total: 7, new1d: 7, new7d: 7, new30d: 7 });
      expect(res.series.map((s) => s.key)).toEqual(["users_new", "profile_views", "cards_claimed"]);
      expect(res.series.every((s) => s.points.length === 31 && s.points[30].value === 2)).toBe(true);
      expect(res.kpis.map((k) => k.key)).toEqual([
        "premium_users",
        "cards_total",
        "cards_claimed",
        "orders_paid_30d",
        "apple_iap_count",
      ]);
      expect(res.revenue?.bySource).toEqual([]);
      expect(res.warnings).toEqual(["db: apple_iap_count misslyckades", "stripe: STRIPE_SECRET_KEY saknas"]);
      const json = JSON.stringify(res);
      expect(json).not.toContain("@");
      expect(json.length).toBeLessThan(20_000);
    } finally {
      if (prevKey !== undefined) process.env.STRIPE_SECRET_KEY = prevKey;
    }
  });
});
