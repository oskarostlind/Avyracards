/**
 * Google Play Billing (Android-appen) — server-side verifiering av
 * Premium-prenumerationen via Google Play Developer API
 * (purchases.subscriptionsv2). Motsvarigheten till apple-iap.ts; iOS-flödet
 * och Stripe berörs inte.
 *
 * Klienten (android-play-premium-button.tsx) köper via @capgo/native-purchases
 * och skickar purchaseToken hit. Vi litar aldrig på klientens påstående —
 * status och utgångstid hämtas från Google och speglas på User
 * (premiumSource GOOGLE_PLAY, premiumExpiresAt).
 *
 * Env:
 *   GOOGLE_PLAY_PREMIUM_SUB        prenumerations-id i Play Console ("premium")
 *   GOOGLE_PLAY_PREMIUM_BASE_PLAN  baserplanens id ("monthly")
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  servicekonto som bjudits in i Play Console
 *                                  (Visa ekonomisk data + Hantera beställningar
 *                                  och prenumerationer). Faller tillbaka på
 *                                  FIREBASE_SERVICE_ACCOUNT_JSON.
 *   GOOGLE_PLAY_PACKAGE_NAME       default "se.avyracards.app"
 *
 * Saknas något av detta är Play Billing avstängt: config-endpointen svarar
 * enabled:false och Android-appen visar exakt samma "kan inte köpas ännu"-text
 * som innan.
 */

import { JWT } from "google-auth-library";
import { PremiumSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendSystemNotification } from "@/lib/notifications";
import { notifyAdmins } from "@/lib/admin-alerts";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

export function getPlayPackageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "se.avyracards.app";
}

export interface PlayPremiumConfig {
  subscriptionId: string | null;
  basePlanId: string | null;
}

export function getPlayPremiumConfig(): PlayPremiumConfig {
  return {
    subscriptionId: process.env.GOOGLE_PLAY_PREMIUM_SUB?.trim() || null,
    basePlanId: process.env.GOOGLE_PLAY_PREMIUM_BASE_PLAN?.trim() || null,
  };
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/** Läser servicekontot (rå JSON eller base64). null om det saknas/är trasigt. */
export function parseServiceAccount(raw: string | undefined | null): ServiceAccount | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const text = value.startsWith("{") ? value : Buffer.from(value, "base64").toString("utf8");
    const json = JSON.parse(text) as Partial<ServiceAccount>;
    if (!json.client_email || !json.private_key) return null;
    return {
      client_email: json.client_email,
      private_key: json.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function getPlayServiceAccount(): ServiceAccount | null {
  return (
    parseServiceAccount(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) ??
    parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  );
}

export function isGooglePlayConfigured(): boolean {
  const cfg = getPlayPremiumConfig();
  return Boolean(cfg.subscriptionId && cfg.basePlanId && getPlayServiceAccount());
}

let jwtClient: JWT | null = null;

async function getAccessToken(): Promise<string> {
  const sa = getPlayServiceAccount();
  if (!sa) throw new Error("google_play_service_account_missing");
  if (!jwtClient) {
    jwtClient = new JWT({ email: sa.client_email, key: sa.private_key, scopes: [SCOPE] });
  }
  const { token } = await jwtClient.getAccessToken();
  if (!token) throw new Error("google_play_auth_failed");
  return token;
}

interface SubscriptionV2Response {
  subscriptionState?: string;
  latestOrderId?: string;
  acknowledgementState?: string;
  testPurchase?: Record<string, unknown>;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    offerDetails?: { basePlanId?: string };
  }>;
}

export interface PlaySubscription {
  productId: string | null;
  basePlanId: string | null;
  state: string;
  expiresAt: Date | null;
  orderId: string | null;
  acknowledged: boolean;
  test: boolean;
}

/** Tolkar svaret från subscriptionsv2.get. Exporterad för test. */
export function parseSubscriptionV2(
  js: SubscriptionV2Response,
  knownProductId: string | null
): PlaySubscription {
  const item =
    js.lineItems?.find((l) => knownProductId && l.productId === knownProductId) ??
    js.lineItems?.[0];
  const expiry = item?.expiryTime ? new Date(item.expiryTime) : null;
  return {
    productId: item?.productId ?? null,
    basePlanId: item?.offerDetails?.basePlanId ?? null,
    state: js.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED",
    expiresAt: expiry && !Number.isNaN(expiry.getTime()) ? expiry : null,
    orderId: js.latestOrderId ?? null,
    acknowledged: js.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    test: Boolean(js.testPurchase),
  };
}

/** Hämtar prenumerationen från Google. Kastar vid nätverks-/API-fel. */
export async function fetchPlaySubscription(purchaseToken: string): Promise<PlaySubscription> {
  const token = await getAccessToken();
  const url =
    `${API}/${encodeURIComponent(getPlayPackageName())}/purchases/subscriptionsv2/tokens/` +
    encodeURIComponent(purchaseToken);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`play_api_${res.status}: ${text.slice(0, 300)}`);
  }
  const js = (await res.json()) as SubscriptionV2Response;
  return parseSubscriptionV2(js, getPlayPremiumConfig().subscriptionId);
}

/**
 * Kvitterar köpet — Google återbetalar okvitterade köp efter 3 dygn. Best
 * effort: pluginen kvitterar också på klienten.
 */
export async function acknowledgePlaySubscription(
  productId: string,
  purchaseToken: string
): Promise<void> {
  try {
    const token = await getAccessToken();
    const url =
      `${API}/${encodeURIComponent(getPlayPackageName())}/purchases/subscriptions/` +
      `${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
  } catch (error) {
    console.warn("[GOOGLE_PLAY] acknowledge misslyckades:", error);
  }
}

/**
 * Ger prenumerationen tillgång just nu? Aktiv, i grace period, eller uppsagd
 * men fortfarande inom betald period.
 */
export function playSubscriptionGrantsAccess(sub: PlaySubscription, now = Date.now()): boolean {
  if (sub.state === "SUBSCRIPTION_STATE_ACTIVE") return true;
  if (sub.state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD") return true;
  if (sub.state === "SUBSCRIPTION_STATE_CANCELED") {
    return Boolean(sub.expiresAt && sub.expiresAt.getTime() > now);
  }
  return false;
}

export type PlayGrantResult =
  | { granted: true; newlyActivated: boolean }
  | { granted: false; reason: "other_account" | "inactive" };

/** Sparar köpet och sätter premium om Google säger att det gäller. */
export async function grantPremiumFromPlay(
  userId: string,
  purchaseToken: string,
  sub: PlaySubscription
): Promise<PlayGrantResult> {
  const existing = await prisma.googlePlayPurchase.findUnique({
    where: { purchaseToken },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) {
    return { granted: false, reason: "other_account" };
  }

  await prisma.googlePlayPurchase.upsert({
    where: { purchaseToken },
    create: {
      purchaseToken,
      userId,
      productId: sub.productId ?? "",
      basePlanId: sub.basePlanId,
      orderId: sub.orderId,
      state: sub.state,
      testPurchase: sub.test,
      expiresAt: sub.expiresAt,
    },
    update: {
      basePlanId: sub.basePlanId,
      orderId: sub.orderId,
      state: sub.state,
      testPurchase: sub.test,
      expiresAt: sub.expiresAt,
    },
  });

  if (!playSubscriptionGrantsAccess(sub)) {
    return { granted: false, reason: "inactive" };
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumSource: PremiumSource.GOOGLE_PLAY,
      premiumGivenAt: before?.isPremium ? undefined : new Date(),
      premiumExpiresAt: sub.expiresAt,
    },
  });

  const newlyActivated = !before?.isPremium && !existing;
  if (newlyActivated) {
    // Samma mail + admin-notis som App Store-köp. Bara första gången per
    // token, så förnyelser och "Återställ köp" ger inga dubbla mail.
    await sendSystemNotification({
      type: "premium_activated",
      to: user.email,
      name: user.name,
      source: "google_play",
      // Prenumerationen förnyas automatiskt — ingen "gäller till"-rad.
      expiresAt: null,
    });
    await notifyAdmins({
      type: "premium_activated",
      email: user.email,
      username: user.username,
      source: "google_play",
    });
  }

  return { granted: true, newlyActivated };
}

/**
 * Lat förnyelsesynk: när en Google Play-prenumerants premiumExpiresAt har
 * passerat frågar vi Google om läget. Förnyad → ny utgångstid; slut →
 * premium av. Rör aldrig premium som kommer från en annan källa (Stripe,
 * App Store, gåva). Kastar aldrig.
 */
export async function syncGooglePlayPremiumIfDue(userId: string): Promise<void> {
  try {
    if (!isGooglePlayConfigured()) return;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumSource: true, premiumExpiresAt: true },
    });
    if (!user?.isPremium || user.premiumSource !== PremiumSource.GOOGLE_PLAY) return;
    if (user.premiumExpiresAt && user.premiumExpiresAt.getTime() > Date.now()) return;

    const latest = await prisma.googlePlayPurchase.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { purchaseToken: true },
    });
    if (!latest) return;

    const sub = await fetchPlaySubscription(latest.purchaseToken);
    await prisma.googlePlayPurchase.update({
      where: { purchaseToken: latest.purchaseToken },
      data: { state: sub.state, expiresAt: sub.expiresAt, orderId: sub.orderId },
    });

    if (playSubscriptionGrantsAccess(sub)) {
      await prisma.user.update({
        where: { id: userId },
        data: { premiumExpiresAt: sub.expiresAt },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: false, premiumExpiresAt: sub.expiresAt },
      });
    }
  } catch (error) {
    console.warn("[GOOGLE_PLAY] synk misslyckades:", error);
  }
}

/** Länk till Google Plays prenumerationshantering för Premium. */
export function playManageSubscriptionsUrl(subscriptionId: string | null): string {
  const pkg = encodeURIComponent(getPlayPackageName());
  return subscriptionId
    ? `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(subscriptionId)}&package=${pkg}`
    : `https://play.google.com/store/account/subscriptions?package=${pkg}`;
}
