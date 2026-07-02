import { readFileSync } from "node:fs";
import path from "node:path";
import {
  getAppleClientId,
  getAppleMerchantId,
  getIapProductIds,
  isAppleIapConfigured,
  isApplePayConfigured,
  isAppleSignInConfigured,
  isIosDebugEnabled,
  isIosNativePaymentsEnabled,
  MIN_IOS_BUILD_WITH_APPLE_SIGN_IN,
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

const PBXPROJ_PATH = path.join(
  process.cwd(),
  "ios",
  "App",
  "App.xcodeproj",
  "project.pbxproj"
);

let cachedBuildNumber: string | null = null;

/**
 * Reads CURRENT_PROJECT_VERSION straight from the Xcode project instead of a
 * manually-set IOS_BUILD_NUMBER env var, so this can't drift out of sync with
 * the actual native build (scripts/bump-ios-build.mjs bumps this file on
 * every push, but nobody was updating the Vercel env var to match).
 */
function getIosBuildNumber(): string {
  if (cachedBuildNumber) {
    return cachedBuildNumber;
  }

  try {
    const contents = readFileSync(PBXPROJ_PATH, "utf8");
    const matches = [...contents.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)];
    if (matches.length > 0) {
      const highest = Math.max(...matches.map((match) => Number(match[1])));
      cachedBuildNumber = String(highest);
      return cachedBuildNumber;
    }
  } catch {
    // Fall back below — e.g. local dev without the ios/ folder tracked in the bundle.
  }

  cachedBuildNumber = process.env.IOS_BUILD_NUMBER ?? "12";
  return cachedBuildNumber;
}

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

  const buildNumber = getIosBuildNumber();
  const configuredBuild = Number.parseInt(buildNumber, 10);
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
    buildNumber,
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
