import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // <--- Importera auth
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

    // --- NY LOGIK: EXKLUDERA EGEN TRAFIK ---
    const session = await auth();
    
    // Om användaren är inloggad OCH besöker sin egen profil -> Ignorera
    if (session?.user?.id === data.profileOwnerId) {
        console.log("🙈 Ignorerar egen trafik från profilägaren.");
        return NextResponse.json({ success: true, ignored: true });
    }
    // ----------------------------------------

    // 1. Försök hämta från Vercel Headers först (Snabbast)
    let country = req.headers.get("x-vercel-ip-country");
    let city = req.headers.get("x-vercel-ip-city");
    
    // Hämta IP för att kunna använda externt API
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0]; 

    // 2. FALLBACK: Om stad saknas (Hobby Plan) och vi har ett IP -> Fråga externt API
    if (!city && ip && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1500) });
        if (geoRes.ok) {
           const geoData = await geoRes.json();
           if (geoData.city) {
             city = geoData.city; 
             if (!country) country = geoData.country_code; 
           }
        }
      } catch (e) {
        // Tyst felhantering för geo-lookup
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}