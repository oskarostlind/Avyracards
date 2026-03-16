import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { sendPushNotification } from "@/lib/push";

const schema = z.object({
  type: z.enum(["VIEW", "CLICK"]),
  profileOwnerId: z.string(),
  linkId: z.string().optional(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  source: z.string().optional(),
});

const IP_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minut
const IP_RATE_LIMIT_MAX = 60; // max ~60 events/IP/minut

type RateEntry = {
  windowStart: number;
  count: number;
};

const ipRateLimitStore = new Map<string, RateEntry>();

function consumeRateLimit(key: string) {
  const now = Date.now();
  const existing = ipRateLimitStore.get(key);

  if (!existing || now - existing.windowStart > IP_RATE_LIMIT_WINDOW_MS) {
    ipRateLimitStore.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (existing.count >= IP_RATE_LIMIT_MAX) {
    return false;
  }

  existing.count += 1;
  return true;
}

const GEO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 timme

type GeoEntry = {
  country: string | null;
  city: string | null;
  expiresAt: number;
};

const geoCache = new Map<string, GeoEntry>();

export async function POST(req: NextRequest) { // <-- BYT TILL NextRequest
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const data = result.data;

    // --- LOGIK: EXKLUDERA EGEN TRAFIK ---
    const session = await auth();
    
    if (session?.user?.id === data.profileOwnerId) {
        console.log("🙈 Ignorerar egen trafik från profilägaren.");
        return NextResponse.json({ success: true, ignored: true });
    }
    // ----------------------------------------

    // --- NY GEODATA INHÄMTNING ---
    // Vercel berikar requestet med geo-objekt för NextRequest
    let country = req.geo?.country || req.headers.get("x-vercel-ip-country");
    let city = req.geo?.city || req.headers.get("x-vercel-ip-city");
    
    // Fallback: Försök läsa av Cloudflare/generell header om Vercel's saknas
    if (!country) country = req.headers.get('cf-ipcountry');

    const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || undefined;

    if (ip) {
      const cached = geoCache.get(ip);
      if (cached && cached.expiresAt > Date.now()) {
        if (!city) city = cached.city || null;
        if (!country) country = cached.country || null;
      }
    }

    const rateKey = `${ip || "unknown"}:${data.profileOwnerId}`;
    const allowed = consumeRateLimit(rateKey);

    if (!allowed) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    // FALLBACK: Om stad saknas (och vi har ett giltigt IP) -> Fråga externt API
    if (!city && ip && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1500) });
        if (geoRes.ok) {
           const geoData = await geoRes.json();
           if (geoData.city) {
             city = geoData.city; 
             if (!country) country = geoData.country_code; 
              geoCache.set(ip, {
                city: city || null,
                country: country || null,
                expiresAt: Date.now() + GEO_CACHE_TTL_MS,
              });
           }
        }
      } catch (e) {
        // Tyst felhantering
      }
    }

    if (city) city = decodeURIComponent(city);

    const userExists = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: { id: true },
    });

    if (!userExists) return NextResponse.json({ success: true, ignored: true });

    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        profileOwnerId: data.profileOwnerId,
        linkId: data.linkId,
        referrer: data.referrer,
        device: data.device,
        source: data.source || "direct",
        country: country || null,
        city: city || null,
      },
    });

    // Push-notis om användaren har token och valt att få notis för denna händelsetyp
    const ownerRow = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
    });
    const owner = ownerRow
      ? {
          pushToken: (ownerRow as { pushToken?: string | null }).pushToken ?? null,
          notifyOnProfileView: (ownerRow as { notifyOnProfileView?: boolean }).notifyOnProfileView ?? true,
          notifyOnLinkClick: (ownerRow as { notifyOnLinkClick?: boolean }).notifyOnLinkClick ?? false,
          notifyOnContactSave: (ownerRow as { notifyOnContactSave?: boolean }).notifyOnContactSave ?? true,
        }
      : null;
    const source = data.source || "direct";
    const isVcard = source.toLowerCase() === "vcard";
    const hasToken = Boolean(owner?.pushToken?.trim());
    const shouldNotify =
      hasToken &&
      ((data.type === "VIEW" && owner?.notifyOnProfileView) ||
        (data.type === "CLICK" && isVcard && owner?.notifyOnContactSave) ||
        (data.type === "CLICK" && !isVcard && owner?.notifyOnLinkClick));
    // #region agent log
    console.log(
      JSON.stringify({
        type: "push_debug",
        eventType: data.type,
        source,
        isVcard,
        hasOwner: Boolean(owner),
        hasToken,
        notifyOnProfileView: owner?.notifyOnProfileView,
        notifyOnLinkClick: owner?.notifyOnLinkClick,
        notifyOnContactSave: owner?.notifyOnContactSave,
        shouldNotify,
      })
    );
    // #endregion
    const token = owner?.pushToken?.trim();
    if (shouldNotify && token) {
      const [title, body] =
        data.type === "VIEW"
          ? ["Profilvisning", "Någon har öppnat din profil."]
          : isVcard
            ? ["Sparade kontakt", "Någon sparade ditt visitkort."]
            : ["Länkklick", "Någon klickade på en länk på din profil."];
      // #region agent log
      console.log(JSON.stringify({ type: "push_debug", action: "calling_send", title }));
      // #endregion
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