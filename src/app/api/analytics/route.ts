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
import {
  buildAnalyticsNotificationCopy,
  resolveNotificationKind,
} from "@/lib/analytics/notification-copy";
import { lookupGeo, normalizeIp, isPrivateIp } from "@/lib/analytics/geo";
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

/**
 * Vercel skickar `x-vercel-ip-city` percent-enkodad ("Ume%C3%A5"), medan
 * `req.geo` redan är avkodad. decodeURIComponent kastar på trasiga
 * %-sekvenser — och gjorde det tidigare mitt i request-flödet, vilket
 * innebar att HELA eventet försvann med 400 i stället för bara stadsnamnet.
 * Därför avkodas headern direkt vid inläsning, med fallback till råvärdet.
 */
function decodeHeaderValue(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (!raw.includes("%")) return raw;
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return raw;
  }
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

    // OBS: `req.geo` fylls bara i av Vercels edge-lager (middleware). I en
    // Node-runtime route handler är den normalt undefined, så headern nedan är
    // den som faktiskt bär datan i produktion. Båda läses för att koden ska
    // fungera likadant om routen någon gång flyttas till edge.
    const headerCountry = decodeHeaderValue(req.headers.get("x-vercel-ip-country"));
    const headerCity = decodeHeaderValue(req.headers.get("x-vercel-ip-city"));

    let country = req.geo?.country?.trim() || headerCountry;
    let city = req.geo?.city?.trim() || headerCity;

    // Fallback: Cloudflare/generell header om Vercels saknas.
    if (!country) country = decodeHeaderValue(req.headers.get("cf-ipcountry"));

    const rawIp =
      req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || undefined;
    const ip = normalizeIp(rawIp) ?? undefined;
    const userAgent = req.headers.get("user-agent");

    // Diagnostik: land men ingen stad är exakt fallet som gav "Okänd plats, SE"
    // i statistiken. Loggas strukturerat så att vi kan mäta hur ofta den lokala
    // GeoLite2-uppslagningen behöver rädda situationen.
    const geoHeaderGap = Boolean(country) && !city;
    if (geoHeaderGap) {
      console.log(
        JSON.stringify({
          type: "analytics_geo_header_gap",
          message: "Country header present but city missing",
          country,
          hasVercelGeo: Boolean(req.geo),
          hasCityHeader: Boolean(req.headers.get("x-vercel-ip-city")),
          hasIp: Boolean(ip),
          ipIsPrivate: isPrivateIp(ip),
        }),
      );
    }

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
    // Körs före geo-uppslagningen så att vi inte lägger arbete på trafik som
    // ändå kastas.
    const decision = buildAnalyticsEvent(data, { ip, userAgent, country, city });

    if (!decision.keep) {
      return ignored(decision.reason);
    }

    // FALLBACK: saknas stad -> slå upp lokalt i GeoLite2. Ersätter det gamla
    // anropet till ipapi.co, vars gratiskvot (~1000/dygn per käll-IP) tog slut
    // direkt i produktion eftersom alla lambdas delar utgående adress. Felen
    // swallowades tyst, vilket är varför stad nästan alltid saknades.
    if (!decision.event.city && ip) {
      const geo = await lookupGeo(ip);

      if (geo?.city) {
        decision.event.city = geo.city;
        // Landskoden från headern är mer tillförlitlig än databasen — skriv
        // bara över den när den saknas.
        if (!decision.event.country && geo.country) {
          decision.event.country = geo.country;
        }

        geoCache.set(ip, {
          city: decision.event.city,
          country: decision.event.country,
          expiresAt: Date.now() + GEO_CACHE_TTL_MS,
        });
      } else if (geoHeaderGap) {
        console.log(
          JSON.stringify({
            type: "analytics_geo_unresolved",
            message: "City still unknown after GeoLite2 lookup",
            country: decision.event.country,
          }),
        );
      }
    } else if (decision.event.city && ip) {
      // Headern räckte — fyll cachen så att efterföljande events från samma
      // besökare slipper både header-avkodning och databasuppslagning.
      geoCache.set(ip, {
        city: decision.event.city,
        country: decision.event.country,
        expiresAt: Date.now() + GEO_CACHE_TTL_MS,
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: { id: true },
    });

    if (!userExists) return ignored("unknown_owner");

    const created = await prisma.analyticsEvent.create({
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
      select: { id: true },
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
    const kind = resolveNotificationKind(decision.event.type, decision.event.source);
    const token = ownerRow?.pushToken?.trim();
    const shouldNotify =
      Boolean(token) &&
      ((kind === "view" && ownerRow?.notifyOnProfileView) ||
        (kind === "vcard" && ownerRow?.notifyOnContactSave) ||
        (kind === "click" && ownerRow?.notifyOnLinkClick));

    if (shouldNotify && token) {
      const { title, body: message } = buildAnalyticsNotificationCopy(
        decision.event.type,
        decision.event.source,
      );

      // `url` konsumeras av src/components/push-deep-link.tsx när notisen
      // trycks: appen navigerar till statistiken och highlightar just den
      // här händelsen.
      void sendPushNotification(token, title, message, {
        url: `/dashboard/analytics?event=${created.id}`,
        eventId: created.id,
        source: decision.event.source,
        type: decision.event.type,
      });
    }

    return NextResponse.json({ success: true, eventId: created.id });
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
