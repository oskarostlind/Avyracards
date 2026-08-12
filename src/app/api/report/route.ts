import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createProfileReport } from "@/lib/moderation";
import { isReportReason } from "@/lib/moderation-shared";

export const runtime = "nodejs";

const reportSchema = z.object({
  username: z.string().min(1).max(64),
  reason: z.string().refine(isReportReason, "Ogiltig anledning"),
  details: z.string().max(2000).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

/**
 * Guideline 1.2: alla som ser en publik profil måste kunna rapportera den —
 * även utloggade besökare som scannat ett NFC-kort. Endpointen kräver därför
 * ingen session, men är rate-limitad per IP så att den inte kan användas för
 * att spamma moderationen.
 */
export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const limit = consumeRateLimit(`report:${ip}`, {
      windowMs: 60 * 60 * 1000,
      max: 10,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "För många rapporter. Försök igen om en stund." },
        { status: 429 }
      );
    }

    const parsed = reportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltig rapport" }, { status: 400 });
    }

    const reported = await prisma.user.findUnique({
      where: { username: parsed.data.username.toLowerCase() },
      select: { id: true, username: true },
    });

    if (!reported) {
      // Svara neutralt: rapportformuläret ska inte gå att använda för att
      // ta reda på vilka användarnamn som finns.
      return NextResponse.json({ success: true });
    }

    const session = await auth();

    await createProfileReport({
      reportedUserId: reported.id,
      reportedUsername: reported.username,
      reporterUserId: session?.user?.id ?? null,
      reporterEmail: parsed.data.email || session?.user?.email || null,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REPORT]", error);
    return NextResponse.json(
      { error: "Kunde inte skicka rapporten." },
      { status: 500 }
    );
  }
}
