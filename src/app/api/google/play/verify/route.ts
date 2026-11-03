import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  acknowledgePlaySubscription,
  fetchPlaySubscription,
  getPlayPremiumConfig,
  grantPremiumFromPlay,
  isGooglePlayConfigured,
} from "@/lib/google-play";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  purchaseToken: z.string().min(10).max(4096),
});

/**
 * Verifierar ett Google Play-köp (Android-appen). Klienten skickar
 * purchaseToken; status och utgång hämtas från Google Play Developer API och
 * premium sätts bara om Google säger att prenumerationen gäller.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGooglePlayConfigured()) {
      return NextResponse.json(
        { error: "Google Play Billing är inte konfigurerat ännu" },
        { status: 503 }
      );
    }

    const parsed = verifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
    }

    const purchaseToken = parsed.data.purchaseToken;
    const sub = await fetchPlaySubscription(purchaseToken);
    const { subscriptionId } = getPlayPremiumConfig();
    if (!sub.productId || sub.productId !== subscriptionId) {
      return NextResponse.json({ error: "Okänd produkt" }, { status: 400 });
    }

    const result = await grantPremiumFromPlay(session.user.id, purchaseToken, sub);
    if (!sub.acknowledged) {
      await acknowledgePlaySubscription(sub.productId, purchaseToken);
    }

    if (!result.granted && result.reason === "other_account") {
      return NextResponse.json(
        { error: "Köpet tillhör ett annat konto", code: "other_account" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      active: result.granted,
      productId: sub.productId,
      expiresAt: sub.expiresAt,
    });
  } catch (error) {
    console.error("[GOOGLE_PLAY_VERIFY]", error);
    return NextResponse.json(
      { error: "Kunde inte verifiera köpet" },
      { status: 500 }
    );
  }
}
