/** First iOS build with CODE_SIGN_ENTITLEMENTS linked (Sign in with Apple). */
export const MIN_IOS_BUILD_WITH_APPLE_SIGN_IN = 15;

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

/**
 * Services ID för Sign in with Apple på webben (t.ex. "se.avyracards.web").
 * Apple sätter `aud` i identity token till den klient som startade
 * inloggningen: bundle ID i iOS-appen, Services ID i webbläsaren. Servern
 * läser APPLE_SERVICES_ID i första hand men faller tillbaka på den publika
 * varianten, så att det räcker att sätta en env-var i Vercel.
 */
export function getAppleWebServicesId(): string | null {
  const value =
    process.env.APPLE_SERVICES_ID ?? process.env.NEXT_PUBLIC_APPLE_SERVICES_ID;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Alla `aud`-värden vi godtar i Apples identity token (native + webb). */
export function getAppleAllowedAudiences(): string[] {
  const ids = [getAppleClientId(), getAppleWebServicesId()].filter(
    (id): id is string => Boolean(id)
  );
  return Array.from(new Set(ids));
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
