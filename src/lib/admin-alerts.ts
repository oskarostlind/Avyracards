import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

/**
 * Push-notiser till admin när något roligt händer i tjänsten — ny användare,
 * ny beställning, premium aktiverat, kort aktiverat. Skickas till alla konton
 * med rollen ADMIN som har en registrerad push-token (dvs. har appen på
 * telefonen och godkänt notiser).
 *
 * Regler:
 * - Kastar aldrig. En registrering får inte falla för att Firebase hickar.
 * - Kör inte i test/dev om inte ADMIN_PUSH_ALERTS uttryckligen är "true";
 *   stängs av i prod med ADMIN_PUSH_ALERTS=false.
 * - Deeplinkar (`url`) går till admin-sidorna, se src/lib/push-deep-link.ts.
 */

export type AdminAlert =
  | {
      type: "new_user";
      email: string;
      username?: string | null;
      /** Hur kontot skapades. */
      via: "email" | "apple";
    }
  | {
      type: "new_order";
      orderId: string;
      quantity: number;
      amountTotal: number;
      currency: string;
      customerEmail?: string | null;
      city?: string | null;
      source: "web" | "ios" | "admin_gift";
    }
  | {
      type: "premium_activated";
      email?: string | null;
      username?: string | null;
      source: "stripe" | "apple_iap" | "card_order" | "admin";
    }
  | {
      type: "card_claimed";
      cardCode?: string | null;
      username?: string | null;
    };

export interface RenderedAdminAlert {
  title: string;
  body: string;
  url: string;
}

function formatMoney(amount: number, currency: string): string {
  // Beloppen i Order är i minsta enhet (öre) precis som i Stripe.
  const major = amount / 100;
  const cur = currency.toUpperCase();
  const num = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return cur === "SEK" ? `${num} kr` : `${num} ${cur}`;
}

function who(email?: string | null, username?: string | null): string {
  if (username && email) return `@${username} (${email})`;
  return username ? `@${username}` : email ?? "okänd";
}

/** Bygger titel/text/deeplink för en händelse. Exporterad för test. */
export function renderAdminAlert(alert: AdminAlert): RenderedAdminAlert {
  switch (alert.type) {
    case "new_user":
      return {
        title: "🎉 Ny användare",
        body: `${who(alert.email, alert.username)} registrerade sig${
          alert.via === "apple" ? " med Apple" : ""
        }.`,
        url: "/admin/users",
      };
    case "new_order": {
      const qty = alert.quantity === 1 ? "1 kort" : `${alert.quantity} kort`;
      const isGift = alert.source === "admin_gift";
      return {
        title: isGift ? "🎁 Gratisorder skapad" : "💳 Ny beställning!",
        body: `${qty}${isGift ? "" : ` för ${formatMoney(alert.amountTotal, alert.currency)}`}${
          alert.city ? ` till ${alert.city}` : ""
        }${alert.customerEmail ? ` · ${alert.customerEmail}` : ""}${
          alert.source === "ios" ? " · via appen" : ""
        }`,
        url: "/admin/orders",
      };
    }
    case "premium_activated": {
      const via =
        alert.source === "apple_iap"
          ? "via App Store"
          : alert.source === "stripe"
            ? "via Stripe"
            : alert.source === "card_order"
              ? "via kortbeställning"
              : "via admin";
      return {
        title: "⭐ Premium aktiverat",
        body: `${who(alert.email, alert.username)} blev premium ${via}.`,
        url: "/admin/users",
      };
    }
    case "card_claimed":
      return {
        title: "📇 Kort aktiverat",
        body: `${alert.username ? `@${alert.username}` : "En användare"} aktiverade kort${
          alert.cardCode ? ` ${alert.cardCode}` : ""
        }.`,
        url: "/admin/orders",
      };
  }
}

export function isAdminAlertsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.ADMIN_PUSH_ALERTS?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  // Default: på i produktion, av lokalt/i test så att utvecklingsregistreringar
  // inte pingar telefonen.
  return env.NODE_ENV === "production";
}

/**
 * Skickar notisen till alla admins med push-token. Awaita alltid anropet i
 * route handlers — `void`-fire-and-forget fryser med lambdan på Vercel.
 */
export async function notifyAdmins(alert: AdminAlert): Promise<number> {
  try {
    if (!isAdminAlertsEnabled()) return 0;

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", pushToken: { not: null } },
      select: { pushToken: true },
    });

    const tokens = Array.from(
      new Set(
        admins
          .map((a) => a.pushToken?.trim())
          .filter((t): t is string => Boolean(t))
      )
    );
    if (tokens.length === 0) return 0;

    const rendered = renderAdminAlert(alert);
    const eventId = `admin-${alert.type}-${
      "orderId" in alert ? alert.orderId : Date.now()
    }`;

    await Promise.all(
      tokens.map((token) =>
        sendPushNotification(token, rendered.title, rendered.body, {
          url: rendered.url,
          eventId,
          kind: `admin_${alert.type}`,
        })
      )
    );

    return tokens.length;
  } catch (error) {
    console.error("[admin-alerts] Kunde inte skicka admin-notis:", error);
    return 0;
  }
}
