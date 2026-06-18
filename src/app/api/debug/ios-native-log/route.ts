import { NextResponse } from "next/server";
import { isIosDebugEnabled } from "@/lib/ios-native";
import {
  appendIosNativeDebugLog,
  getIosNativeDebugLogs,
  type IosNativeDebugEntry,
} from "@/lib/ios-native-debug-store";

function isAllowed(req: Request): boolean {
  if (isIosDebugEnabled()) {
    return true;
  }
  return req.headers.get("X-Debug-Session-Id") === "390123";
}

export async function POST(req: Request) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Omit<IosNativeDebugEntry, "timestamp"> & {
    timestamp?: number;
  };

  appendIosNativeDebugLog({
    ...body,
    scope: body.scope ?? "SERVER",
    timestamp: body.timestamp,
    level: body.level ?? "info",
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? undefined;
  const scope = req.nextUrl.searchParams.get("scope") ?? undefined;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");

  let entries = getIosNativeDebugLogs(sessionId);
  if (scope) {
    entries = entries.filter((e) => e.scope === scope);
  }

  return NextResponse.json({
    entries: entries.slice(-Math.min(limit, 200)),
    count: entries.length,
  });
}
