import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Google Play Billing (Android-appen). Låser fast att Play Billing bara slås
 * på när ALL konfiguration finns — saknas något ska Android-appen visa samma
 * "kan inte köpas ännu" som tidigare — och att Googles svar tolkas rätt.
 */

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/notifications", () => ({ sendSystemNotification: vi.fn() }));
vi.mock("@/lib/admin-alerts", () => ({ notifyAdmins: vi.fn() }));

const ENV_KEYS = [
  "GOOGLE_PLAY_PREMIUM_SUB",
  "GOOGLE_PLAY_PREMIUM_BASE_PLAN",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_PLAY_PACKAGE_NAME",
] as const;

const SA = JSON.stringify({
  client_email: "play@example.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
});

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
  return import("@/lib/google-play");
}

describe("isGooglePlayConfigured", () => {
  it("är av när env saknas helt", async () => {
    const { isGooglePlayConfigured } = await load();
    expect(isGooglePlayConfigured()).toBe(false);
  });

  it("kräver prenumeration, baserplan och servicekonto", async () => {
    const { isGooglePlayConfigured } = await load();
    process.env.GOOGLE_PLAY_PREMIUM_SUB = "premium";
    expect(isGooglePlayConfigured()).toBe(false);
    process.env.GOOGLE_PLAY_PREMIUM_BASE_PLAN = "monthly";
    expect(isGooglePlayConfigured()).toBe(false);
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = SA;
    expect(isGooglePlayConfigured()).toBe(true);
  });

  it("använder Firebase-servicekontot som reserv", async () => {
    const { isGooglePlayConfigured } = await load();
    process.env.GOOGLE_PLAY_PREMIUM_SUB = "premium";
    process.env.GOOGLE_PLAY_PREMIUM_BASE_PLAN = "monthly";
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = SA;
    expect(isGooglePlayConfigured()).toBe(true);
  });

  it("ett trasigt servicekonto räknas som saknat", async () => {
    const { isGooglePlayConfigured } = await load();
    process.env.GOOGLE_PLAY_PREMIUM_SUB = "premium";
    process.env.GOOGLE_PLAY_PREMIUM_BASE_PLAN = "monthly";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = "{inte json";
    expect(isGooglePlayConfigured()).toBe(false);
  });
});

describe("parseServiceAccount", () => {
  it("läser rå JSON och base64, och återställer radbrytningar i nyckeln", async () => {
    const { parseServiceAccount } = await load();
    const raw = parseServiceAccount(SA);
    expect(raw?.client_email).toBe("play@example.iam.gserviceaccount.com");
    expect(raw?.private_key).toContain("\nabc\n");
    const b64 = parseServiceAccount(Buffer.from(SA).toString("base64"));
    expect(b64?.client_email).toBe("play@example.iam.gserviceaccount.com");
  });
});

describe("parseSubscriptionV2 + playSubscriptionGrantsAccess", () => {
  it("tolkar en aktiv prenumeration", async () => {
    const { parseSubscriptionV2, playSubscriptionGrantsAccess } = await load();
    const sub = parseSubscriptionV2(
      {
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        latestOrderId: "GPA.1",
        acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
        lineItems: [
          {
            productId: "premium",
            expiryTime: "2099-01-01T00:00:00Z",
            offerDetails: { basePlanId: "monthly" },
          },
        ],
      },
      "premium"
    );
    expect(sub).toMatchObject({
      productId: "premium",
      basePlanId: "monthly",
      orderId: "GPA.1",
      acknowledged: false,
      test: false,
    });
    expect(playSubscriptionGrantsAccess(sub)).toBe(true);
  });

  it("uppsagd ger tillgång till periodslut, utgången aldrig", async () => {
    const { parseSubscriptionV2, playSubscriptionGrantsAccess } = await load();
    const now = Date.parse("2026-11-03T12:00:00Z");
    const canceled = parseSubscriptionV2(
      {
        subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
        lineItems: [{ productId: "premium", expiryTime: "2026-11-10T00:00:00Z" }],
      },
      "premium"
    );
    expect(playSubscriptionGrantsAccess(canceled, now)).toBe(true);
    expect(playSubscriptionGrantsAccess(canceled, Date.parse("2026-11-11T00:00:00Z"))).toBe(false);

    const expired = parseSubscriptionV2(
      { subscriptionState: "SUBSCRIPTION_STATE_EXPIRED", lineItems: [] },
      "premium"
    );
    expect(playSubscriptionGrantsAccess(expired, now)).toBe(false);

    const onHold = parseSubscriptionV2(
      { subscriptionState: "SUBSCRIPTION_STATE_ON_HOLD", lineItems: [] },
      "premium"
    );
    expect(playSubscriptionGrantsAccess(onHold, now)).toBe(false);
  });
});

describe("playManageSubscriptionsUrl", () => {
  it("pekar på Premium i AvyraCards-paketet", async () => {
    const { playManageSubscriptionsUrl } = await load();
    expect(playManageSubscriptionsUrl("premium")).toBe(
      "https://play.google.com/store/account/subscriptions?sku=premium&package=se.avyracards.app"
    );
  });
});
