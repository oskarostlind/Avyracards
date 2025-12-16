import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["VIEW", "CLICK"]),
  profileOwnerId: z.string(),
  linkId: z.string().optional(),
  referrer: z.string().optional(),
  device: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Basic Security: Origin Check
    // Förhindrar enkla script-anrop från andra domäner (CORS-liknande skydd i API-routen)
    const origin = req.headers.get("origin");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // Om vi har en baseUrl satt (prod), kontrollera att anropet kommer därifrån
    if (baseUrl && origin && !origin.includes(baseUrl)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const data = result.data;

    // 2. Integritets-check: Finns användaren vi försöker logga event för?
    // Detta förhindrar att DB fylls med event för påhittade IDn.
    const userExists = await prisma.user.findUnique({
      where: { id: data.profileOwnerId },
      select: { id: true }, // Select ID bara för att spara prestanda
    });

    if (!userExists) {
       // Returnera 200 ändå för att inte avslöja för scrapers vilka IDn som finns/inte finns
       return NextResponse.json({ success: true, ignored: true });
    }

    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        profileOwnerId: data.profileOwnerId,
        linkId: data.linkId,
        referrer: data.referrer,
        device: data.device,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Logga inte felet i detalj för analytics för att spara utrymme, returnera bara 400
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}