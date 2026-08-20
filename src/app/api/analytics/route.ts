import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/push";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  analyticsIngestSchema,
  buildAnalyticsEvent,
  type AnalyticsDropReason,
} from "@/lib/analytics/events";
import { computeVisitorHash } from "@/lib/analytics/visitor-hash";

const IP_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minut
const IP_RATE_LIMIT_MAX = 60; // max ~60 events/IP/minut

const GEO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 timme

type GeoEntry = {
  country: string | null;
  city: string | null;
  expiresAt: number;
};

const geoCache = new Map<string, GeoEntry>();

function ignored(reason: AnalyticsDropReason) {
  return NextResponse.json({ success: true, ignored: true, reason });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = analyticsIngestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const data = result.data;

    // Profilägarens egen trafik ska aldrig räknas som en visning.
    const session = await auth();
    if (session?.user?.id === data.profileOwnerId) {
      return ignored("own_traffic");
    }

    let country = req.geo?.country || req.headers.get("x-vercel-ip-country");
    let city = req.geo?.city || req.headers.get("x-vercel-ip-city");

    // Fallback: Cloudflare/generell header om Vercels saknas.
    if (!country) country = req.headers.get("cf-ipcountry");

    const ip =
      req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || undefined;
    const userAgent = req.headers.get("user-agent");

    if (ip) {
      const cached = geoCache.get(ip);
      if (cached && cached.expiresAt > Date.now()) {
        if (!city) city = cached.city || null;
        if (!country) country = cached.country || null;
      }
    }

    const rateKey = `analytics:${ip || "unknown"}:${data.profileOwnerId}`;
    const { allowed } = consumeRateLimit(rateKey, {
      windowMs: IP_RATE_LIMIT_WINDOW_MS,
      max: IP_RATE_LIMIT_MAX,
    });

    if (!allowed) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    // Central normalisering: bot-filter, dedup, källa och enhet.
    // Körs före det externa geo-anropet så att vi inte betalar för trafik
    // som ändå kastas.
    const decision = buildAnalyticsEvent(data, { ip, userAgent, country, city });

    if (!decision.keep) {
      return ignored(decision.reason);
    }

    // FALLBACK: saknas stad (och vi har ett giltigt IP) -> fråga externt API.
    if (!decision.event.city && ip && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(1500),
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.city) {
            decision.event.city = decodeURIComponent(String(geoData.city));
            if (!decision.event.country && geoData.country_code) {
              decision.event.country = String(geoData.country_code);
            }
            geoCache.set(ip, {
              city: decision.event.city,
              country: decision.event.country,
              expiresAt: Date.now() + GEO_CACHE_TTL_MS,
            });
          }
        }
      } catch {
        // Tyst felhantering – geodata är inte kritisk.
      }
    } else if (decision.event.city) {
      decision.event.city = decodeURIComponent(decision.event.city);
    }

    const userExists = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: { id: true },
    });

    if (!userExists) return ignored("unknown_owner");

    await prisma.analyticsEvent.create({
      data: {
        type: decision.event.type,
        profileOwnerId: decision.event.profileOwnerId,
        linkId: decision.event.linkId ?? undefined,
        referrer: decision.event.referrer ?? undefined,
        device: decision.event.device,
        source: decision.event.source,
        country: decision.event.country,
        city: decision.event.city,
        // Dagligt roterande hash för unika besökare — ingen rå IP lagras.
        visitorHash: computeVisitorHash(ip, userAgent),
      },
    });

    // Push-notis om profilägaren har en token och valt att få notis för denna händelsetyp
    const ownerRow = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: {
        pushToken: true,
        notifyOnProfileView: true,
        notifyOnLinkClick: true,
        notifyOnContactSave: true,
      },
    });
    const isVcard = decision.event.source.toLowerCase() === "vcard";
    const token = ownerRow?.pushToken?.trim();
    const shouldNotify =
      Boolean(token) &&
      ((decision.event.type === "VIEW" && ownerRow?.notifyOnProfileView) ||
        (decision.event.type === "CLICK" && isVcard && ownerRow?.notifyOnContactSave) ||
        (decision.event.type === "CLICK" && !isVcard && ownerRow?.notifyOnLinkClick));

    if (shouldNotify && token) {
      const [title, body] =
        decision.event.type === "VIEW"
          ? ["Profilvisning", "Någon har öppnat din profil."]
          : isVcard
            ? ["Sparade kontakt", "Någon sparade ditt visitkort."]
            : ["Länkklick", "Någon klickade på en länk på din profil."];
      void sendPushNotification(token, title, body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        type: "api_analytics_error",
        message: "Failed to record analytics event",
        error: String(error),
      }),
    );
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
