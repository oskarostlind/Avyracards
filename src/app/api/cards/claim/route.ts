import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { claimCard } from "@/lib/card-claim";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Kortkoden är 6 tecken och står tryckt på kortet — utan rate limiting går den
// att gissa sig fram till. Token krävs alltid (se card-claim.ts), men vi
// bromsar försöken ändå.
const claimRateLimit = { windowMs: 60_000, max: 10 };

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ip =
      req.ip ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const rate = consumeRateLimit(`card_claim:${ip}:${session.user.id}`, claimRateLimit);

    if (!rate.allowed) {
      return NextResponse.json(
        { message: "För många försök. Vänta en minut och försök igen." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Ogiltig JSON i förfrågan." }, { status: 400 });
    }

    const { cardCode, claimToken } = (body ?? {}) as {
      cardCode?: string;
      claimToken?: string;
    };

    const result = await claimCard({
      cardCode,
      claimToken,
      userId: session.user.id,
    });

    if (result.ok) {
      return NextResponse.json({ success: true });
    }

    const statusByReason: Record<typeof result.reason, number> = {
      missing_code: 400,
      missing_token: 400,
      not_found: 404,
      invalid_token: 403,
      already_claimed_by_user: 200,
      already_claimed: 409,
      disabled: 403,
      conflict: 409,
    };

    if (result.reason === "already_claimed_by_user") {
      return NextResponse.json({ success: true, alreadyOwned: true });
    }

    return NextResponse.json(
      { message: result.message },
      { status: statusByReason[result.reason] }
    );
  } catch (error) {
    console.error("[CLAIM_ERROR]", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
