import {
  getAppleClientId,
  getAppleMerchantId,
  getIapProductIds,
  isAppleIapConfigured,
  isApplePayConfigured,
  isAppleSignInConfigured,
  isIosDebugEnabled,
  isIosNativePaymentsEnabled,
} from "@/lib/ios-native";

function maskSecret(value: string | undefined | null, visibleTail = 4): string | null {
  if (!value) {
    return null;
  }
  if (value.length <= visibleTail) {
    return "****";
  }
  return `${"*".repeat(Math.min(value.length - visibleTail, 12))}${value.slice(-visibleTail)}`;
}

function envPresent(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

/** First iOS build with CODE_SIGN_ENTITLEMENTS linked (Sign in with Apple). */
export const MIN_IOS_BUILD_WITH_APPLE_SIGN_IN = 15;

export interface IosNativeDebugReport {
  generatedAt: string;
  appVersion: string;
  buildNumber: string;
  flags: {
    iosNativePayments: boolean;
    iosDebug: boolean;
    nodeEnv: string;
  };
  signInWithApple: {
    configured: boolean;
    clientId: string;
    keyId: string | null;
    privateKeyPresent: boolean;
  };
  applePay: {
    configured: boolean;
    merchantId: string | null;
    publishableKeyPresent: boolean;
    publishableKeyMasked: string | null;
    stripeSecretPresent: boolean;
  };
  iap: {
    configured: boolean;
    issuerId: string | null;
    keyId: string | null;
    privateKeyPresent: boolean;
    products: ReturnType<typeof getIapProductIds>;
  };
  wallet: {
    teamIdPresent: boolean;
    passTypeIdPresent: boolean;
  };
  legacyStoreKitVarsPresent: boolean;
  issues: string[];
  readyForTestFlight: boolean;
}

export function getIosNativeDebugReport(): IosNativeDebugReport {
  const products = getIapProductIds();
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY ??
    null;

  const issues: string[] = [];

  if (!isIosNativePaymentsEnabled()) {
    issues.push("NEXT_PUBLIC_IOS_NATIVE_PAYMENTS är inte true");
  }
  if (!isAppleSignInConfigured()) {
    issues.push("Sign in with Apple saknar APPLE_AUTH_KEY_ID eller APPLE_AUTH_PRIVATE_KEY");
  }
  if (!isAppleIapConfigured()) {
    issues.push("IAP saknar produkt-ID:n eller APPLE_IAP_KEY_ID/ISSUER_ID/PRIVATE_KEY");
  }
  if (!isApplePayConfigured()) {
    issues.push("Apple Pay saknar merchant ID, Stripe publishable key eller STRIPE_SECRET_KEY");
  }
  if (publishableKey?.includes("pk_test_...") || publishableKey?.includes("...")) {
    issues.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ser ut som en platshållare");
  }
  if (process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")) {
    issues.push("NEXT_PUBLIC_BASE_URL pekar på localhost (OK lokalt, uppdatera i Vercel prod)");
  }

  const legacyStoreKitVarsPresent = ["STOREKIT_ISSUER_ID", "STOREKIT_KEY_ID", "STOREKIT_PRIVATE_KEY"].some(
    envPresent
  );

  if (legacyStoreKitVarsPresent) {
    issues.push("Legacy STOREKIT_* finns i .env men används inte — använd APPLE_IAP_* istället");
  }

  const configuredBuild = Number.parseInt(process.env.IOS_BUILD_NUMBER ?? "", 10);
  if (!Number.isFinite(configuredBuild) || configuredBuild < MIN_IOS_BUILD_WITH_APPLE_SIGN_IN) {
    issues.push(
      `TestFlight-build måste vara ≥${MIN_IOS_BUILD_WITH_APPLE_SIGN_IN} (Sign in with Apple-entitlements). Uppdatera appen i TestFlight.`
    );
  }

  const signInWithApple = isAppleSignInConfigured();
  const applePay = isApplePayConfigured();
  const iap = isAppleIapConfigured();

  return {
    generatedAt: new Date().toISOString(),
    appVersion: process.env.IOS_APP_VERSION ?? "2.0",
    buildNumber: process.env.IOS_BUILD_NUMBER ?? "12",
    flags: {
      iosNativePayments: isIosNativePaymentsEnabled(),
      iosDebug: isIosDebugEnabled(),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
    signInWithApple: {
      configured: signInWithApple,
      clientId: getAppleClientId(),
      keyId: process.env.APPLE_AUTH_KEY_ID ?? null,
      privateKeyPresent: envPresent("APPLE_AUTH_PRIVATE_KEY"),
    },
    applePay: {
      configured: applePay,
      merchantId: getAppleMerchantId(),
      publishableKeyPresent: Boolean(publishableKey),
      publishableKeyMasked: maskSecret(publishableKey ?? undefined, 6),
      stripeSecretPresent: envPresent("STRIPE_SECRET_KEY"),
    },
    iap: {
      configured: iap,
      issuerId: process.env.APPLE_IAP_ISSUER_ID ?? null,
      keyId: process.env.APPLE_IAP_KEY_ID ?? null,
      privateKeyPresent: envPresent("APPLE_IAP_PRIVATE_KEY"),
      products,
    },
    wallet: {
      teamIdPresent: envPresent("APPLE_TEAM_ID"),
      passTypeIdPresent: envPresent("APPLE_PASS_TYPE_ID"),
    },
    legacyStoreKitVarsPresent,
    issues,
    readyForTestFlight:
      signInWithApple && applePay && iap && isIosNativePaymentsEnabled() && issues.length === 0,
  };
}
