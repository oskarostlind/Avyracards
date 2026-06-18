import { NextResponse } from "next/server";
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

  const { searchParams } = new URL(req.url);
  const wantsDebug = searchParams.get("debug") === "1" || isIosDebugEnabled();

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