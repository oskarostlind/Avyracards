import { NextResponse } from "next/server";

/**
 * Tillfällig endpoint för debug-loggning från klient (t.ex. TestFlight).
 * Loggar syns i Vercel → Project → Logs (filtrera på /api/debug-log).
 * Ta bort denna fil och alla anrop till den när felsökningen är klar.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // eslint-disable-next-line no-console -- debug endpoint
    console.log("[debug-log]", JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
