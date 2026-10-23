import { NextResponse } from "next/server";

import { isStatsAuthorized } from "@/lib/stats/auth";
import { collectStats } from "@/lib/stats/collect";

/**
 * GET /api/stats — aggregerad statistik för Mission Control (marketing-portalen).
 * Skyddad med `Authorization: Bearer <STATS_TOKEN>`; inga personuppgifter i svaret.
 * Middleware rör inte /api/* (se matcher i src/middleware.ts). iOS-appen laddar
 * live-sajten via Capacitor server.url, så routen påverkar inte native-bygget.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

const NO_STORE = { "Cache-Control": "no-store" };

let warnedMissingToken = false;

export async function GET(request: Request) {
  const token = process.env.STATS_TOKEN;
  if (!token && !warnedMissingToken) {
    warnedMissingToken = true;
    console.warn("[api/stats] STATS_TOKEN saknas — alla anrop nekas (401).");
  }

  if (!isStatsAuthorized(request.headers.get("authorization"), token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const stats = await collectStats();
    return NextResponse.json(stats, { headers: NO_STORE });
  } catch {
    console.error("[api/stats] collectStats misslyckades");
    return NextResponse.json({ error: "internal" }, { status: 500, headers: NO_STORE });
  }
}
