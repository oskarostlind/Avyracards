import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Regressionstester för iOS-flaggorna (ClickUp 86c6rbe2j).
 *
 * Guideline 3.1.1: när NEXT_PUBLIC_IOS_NATIVE_PAYMENTS är på måste premium
 * gå via native IAP — inga Stripe-checkoutlänkar för premium i appen.
 * De här testerna låser fast att flaggan tolkas strikt (bara "true" räknas),
 * så att ett stavfel i env inte tyst öppnar Stripe-vägen i iOS-appen igen.
 */

const ENV_KEYS = [
  "NEXT_PUBLIC_IOS_NATIVE_PAYMENTS",
  "NEXT_PUBLIC_IOS_DEBUG",
  "APPLE_IAP_PREMIUM_MONTHLY",
  "APPLE_IAP_PREMIUM_6MO",
  "APPLE_IAP_KEY_ID",
  "APPLE_IAP_ISSUER_ID",
  "APPLE_IAP_PRIVATE_KEY",
  "APPLE_CLIENT_ID",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function load() {
  return import("@/lib/ios-native");
}

describe("isIosNativePaymentsEnabled", () => {
  it("är av när flaggan saknas", async () => {
    const { isIosNativePaymentsEnabled } = await load();
    expect(isIosNativePaymentsEnabled()).toBe(false);
  });

  it("är på endast för exakt strängen 'true'", async () => {
    const { isIosNativePaymentsEnabled } = await load();

    process.env.NEXT_PUBLIC_IOS_NATIVE_PAYMENTS = "true";
    expect(isIosNativePaymentsEnabled()).toBe(true);

    for (const value of ["TRUE", "1", "yes", "false", ""]) {
      process.env.NEXT_PUBLIC_IOS_NATIVE_PAYMENTS = value;
      expect(isIosNativePaymentsEnabled()).toBe(false);
    }
  });
});

describe("IAP-produktkonfiguration", () => {
  it("returnerar null för produkter som inte är konfigurerade", async () => {
    const { getIapProductIds, resolveIapProductId, isAppleIapConfigured } = await load();

    expect(getIapProductIds()).toEqual({ monthly: null, sixMonths: null });
    expect(resolveIapProductId("monthly")).toBeNull();
    expect(resolveIapProductId("sixMonths")).toBeNull();
    expect(isAppleIapConfigured()).toBe(false);
  });

  it("mappar produktnycklar till rätt product id", async () => {
    process.env.APPLE_IAP_PREMIUM_MONTHLY = "se.avyracards.premium.monthly";
    process.env.APPLE_IAP_PREMIUM_6MO = "se.avyracards.premium.6mo";

    const { resolveIapProductId } = await load();

    expect(resolveIapProductId("monthly")).toBe("se.avyracards.premium.monthly");
    expect(resolveIapProductId("sixMonths")).toBe("se.avyracards.premium.6mo");
  });

  it("kräver både produkter och signeringsnycklar för att räknas som konfigurerad", async () => {
    process.env.APPLE_IAP_PREMIUM_MONTHLY = "se.avyracards.premium.monthly";
    process.env.APPLE_IAP_PREMIUM_6MO = "se.avyracards.premium.6mo";

    const partial = await load();
    expect(partial.isAppleIapConfigured()).toBe(false);

    process.env.APPLE_IAP_KEY_ID = "key";
    process.env.APPLE_IAP_ISSUER_ID = "issuer";
    process.env.APPLE_IAP_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----";

    const full = await load();
    expect(full.isAppleIapConfigured()).toBe(true);
  });
});

describe("getAppleClientId", () => {
  it("faller tillbaka på bundle-id:t när env saknas", async () => {
    const { getAppleClientId } = await load();
    expect(getAppleClientId()).toBe("se.avyracards.app");
  });
});
