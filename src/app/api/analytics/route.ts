import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["VIEW", "CLICK"]),
  profileOwnerId: z.string(),
  linkId: z.string().optional(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const data = result.data;

    // 1. Försök hämta från Vercel Headers först (Snabbast)
    let country = req.headers.get("x-vercel-ip-country");
    let city = req.headers.get("x-vercel-ip-city");
    
    // Hämta IP för att kunna använda externt API
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0]; // Ta första IPt om det finns flera

    // 2. FALLBACK: Om stad saknas (Hobby Plan) och vi har ett IP -> Fråga externt API
    // OBS: Detta gör anropet långsammare. Använd med försiktighet.
    if (!city && ip && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        // Vi sätter en timeout på 1s så vi inte segar ner hela appen om APIet är nere
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1500) });
        if (geoRes.ok) {
           const geoData = await geoRes.json();
           if (geoData.city) {
             city = geoData.city; 
             // Vi kan också fylla i land om det saknades
             if (!country) country = geoData.country_code; 
             console.log("📍 Hämtade stad via externt API:", city);
           }
        }
      } catch (e) {
        console.warn("Kunde inte hämta geo-data externt (timeout eller fel).");
      }
    }

    // Fixa encoding (Malm%C3%B6 -> Malmö)
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}