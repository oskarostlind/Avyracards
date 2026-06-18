import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import {
  fetchAppStoreTransaction,
  grantPremiumFromIap,
  isKnownIapProduct,
  resolvePremiumExpiry,
} from "@/lib/apple-iap";
import { isAppleIapConfigured } from "@/lib/ios-native";
import { logIosNativeServer } from "@/lib/ios-native-server-debug";

const verifySchema = z.object({
  transactionId: z.string().min(1),
  environment: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAppleIapConfigured()) {
      return NextResponse.json(
        { error: "IAP är inte konfigurerat ännu" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
    }

    const transaction = await fetchAppStoreTransaction(
      parsed.data.transactionId,
      parsed.data.environment
    );

    if (!isKnownIapProduct(transaction.productId)) {
      return NextResponse.json({ error: "Okänd produkt" }, { status: 400 });
    }

    const purchasedAt = transaction.purchaseDate
      ? new Date(transaction.purchaseDate)
      : new Date();
    const expiresAt = resolvePremiumExpiry(
      transaction.productId,
      transaction.expiresDate
    );

    await grantPremiumFromIap({
      userId: session.user.id,
      transactionId: transaction.transactionId,
      productId: transaction.productId,
      environment: transaction.environment,
      purchasedAt,
      expiresAt,
    });

    logIosNativeServer("IAP", "api/apple/iap/verify:POST", "IAP verified", {
      productId: transaction.productId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      productId: transaction.productId,
      expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logIosNativeServer("IAP", "api/apple/iap/verify:catch", "IAP verify failed", {
      error: message,
    }, "error");
    console.error("[APPLE_IAP_VERIFY]", error);
    return NextResponse.json(
      { error: "Kunde inte verifiera köpet" },
      { status: 500 }
    );
  }
}
