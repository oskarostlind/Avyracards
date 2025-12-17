import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Uppdaterat schema för att inkludera 'source'
const schema = z.object({
  type: z.enum(["VIEW", "CLICK"]),
  profileOwnerId: z.string(),
  linkId: z.string().optional(),
  referrer: z.string().optional(),
  device: z.string().optional(),
  source: z.string().optional(), // T.ex. "nfc", "qr"
});

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (baseUrl && origin && !origin.includes(baseUrl)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    // --- HÄMTA GEODATA FRÅN HEADERS (Vercel Specifikt) ---
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    // -----------------------------------------------------

    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const data = result.data;

    const userExists = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: { id: true },
    });

    if (!userExists) {
       return NextResponse.json({ success: true, ignored: true });
    }

    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        profileOwnerId: data.profileOwnerId,
        linkId: data.linkId,
        referrer: data.referrer,
        device: data.device,
        source: data.source || "direct", // Spara källan
        country: country, // Spara land
        city: city,       // Spara stad
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}