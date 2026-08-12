import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAppleMerchantId,
  getIapProductIds,
  isAppleIapConfigured,
  isApplePayConfigured,
  isAppleSignInConfigured,
  isIosDebugEnabled,
  isIosNativePaymentsEnabled,
} from "@/lib/ios-native";
import { getIosNativeDebugReport } from "@/lib/ios-native-debug";

export async function GET(req: Request) {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY ??
    null;

  // Endpointen är avsiktligt öppen — appen hämtar produkt-ID:n innan köp och
  // publishableKey är publik per Stripes design. Debugrapporten är det INTE:
  // den innehåller issuer-ID, nyckel-ID och vilka hemligheter som är satta.
  // Tidigare räckte ?debug=1 för att vem som helst skulle få ut den, oavsett
  // NEXT_PUBLIC_IOS_DEBUG. Nu krävs både flaggan och en inloggad admin.
  const { searchParams } = new URL(req.url);
  const debugRequested =
    searchParams.get("debug") === "1" || isIosDebugEnabled();

  let wantsDebug = false;
  if (debugRequested) {
    const session = await auth();
    wantsDebug = session?.user?.role === "ADMIN";
  }

  const payload: Record<string, unknown> = {
    enabled: isIosNativePaymentsEnabled(),
    signInWithApple: isAppleSignInConfigured(),
    applePay: isApplePayConfigured(),
    iap: isAppleIapConfigured(),
    merchantId: getAppleMerchantId(),
    publishableKey,
    products: getIapProductIds(),
    bundleId: process.env.APPLE_CLIENT_ID ?? "se.avyracards.app",
  };

  if (wantsDebug) {
    payload.debug = getIosNativeDebugReport();
  }

  return NextResponse.json(payload);
}