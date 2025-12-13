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
    const body = await req.json();
    const data = schema.parse(body);

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
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}