export type IosPremiumProductKey = "monthly" | "sixMonths";

export interface IosIapProductConfig {
  monthly: string | null;
  sixMonths: string | null;
}

export function isIosNativePaymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IOS_NATIVE_PAYMENTS === "true";
}

export function getAppleMerchantId(): string | null {
  return process.env.APPLE_MERCHANT_ID ?? process.env.NEXT_PUBLIC_APPLE_MERCHANT_ID ?? null;
}

export function getAppleClientId(): string {
  return process.env.APPLE_CLIENT_ID ?? "se.avyracards.app";
}

export function getIapProductIds(): IosIapProductConfig {
  return {
    monthly: process.env.APPLE_IAP_PREMIUM_MONTHLY ?? null,
    sixMonths: process.env.APPLE_IAP_PREMIUM_6MO ?? null,
  };
}

export function resolveIapProductId(key: IosPremiumProductKey): string | null {
  const ids = getIapProductIds();
  return key === "monthly" ? ids.monthly : ids.sixMonths;
}

export function isAppleIapConfigured(): boolean {
  const ids = getIapProductIds();
  return Boolean(
    ids.monthly &&
      ids.sixMonths &&
      process.env.APPLE_IAP_KEY_ID &&
      process.env.APPLE_IAP_ISSUER_ID &&
      process.env.APPLE_IAP_PRIVATE_KEY
  );
}

export function isApplePayConfigured(): boolean {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY;
  return Boolean(getAppleMerchantId() && process.env.STRIPE_SECRET_KEY && publishableKey);
}

export function isAppleSignInConfigured(): boolean {
  return Boolean(
    process.env.APPLE_AUTH_KEY_ID &&
      process.env.APPLE_AUTH_PRIVATE_KEY &&
      getAppleClientId()
  );
}

export function isIosDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IOS_DEBUG === "true";
}
