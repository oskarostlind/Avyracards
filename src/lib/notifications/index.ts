import { sendMailSafe } from "@/lib/mailer";
import {
  renderCardOrderConfirmed,
  renderCardOrderShipped,
  renderPremiumActivated,
  type PremiumActivationSource,
  type RenderedEmail,
} from "@/lib/notifications/templates";

/**
 * Central notifieringstjänst för systemkritiska händelser.
 *
 * Regler:
 * - Anropen kastar aldrig. En order eller en betalning får inte se ut att
 *   misslyckas för att mailservern har en dålig dag.
 * - Anroparen bestämmer *om* händelsen inträffat (t.ex. att premium faktiskt
 *   gick från av till på). Den här modulen ansvarar bara för utskicket.
 * - Mallarna ligger i `templates.ts` och är rena funktioner.
 */

export type SystemNotification =
  | {
      type: "premium_activated";
      to: string | null | undefined;
      name?: string | null;
      source: PremiumActivationSource;
      expiresAt?: Date | null;
    }
  | {
      type: "card_order_confirmed";
      to: string | null | undefined;
      name?: string | null;
      orderId: string;
      quantity: number;
      amountTotal: number;
      currency: string;
    }
  | {
      type: "card_order_shipped";
      to: string | null | undefined;
      name?: string | null;
      orderId: string;
      quantity: number;
      shippingCity?: string | null;
      trackingNumber?: string | null;
    };

export interface NotificationResult {
  sent: boolean;
  reason?: "no_recipient" | "not_configured" | "send_failed" | "unknown_type";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidRecipient(email: string | null | undefined): boolean {
  return typeof email === "string" && EMAIL_PATTERN.test(email.trim());
}

/** Bygger mailet för en händelse. Exporterad för test. */
export function renderNotification(
  notification: SystemNotification
): RenderedEmail | null {
  switch (notification.type) {
    case "premium_activated":
      return renderPremiumActivated({
        name: notification.name,
        source: notification.source,
        expiresAt: notification.expiresAt ?? null,
      });
    case "card_order_confirmed":
      return renderCardOrderConfirmed({
        name: notification.name,
        orderId: notification.orderId,
        quantity: notification.quantity,
        amountTotal: notification.amountTotal,
        currency: notification.currency,
      });
    case "card_order_shipped":
      return renderCardOrderShipped({
        name: notification.name,
        orderId: notification.orderId,
        quantity: notification.quantity,
        shippingCity: notification.shippingCity ?? null,
        trackingNumber: notification.trackingNumber ?? null,
      });
    default:
      return null;
  }
}

export async function sendSystemNotification(
  notification: SystemNotification
): Promise<NotificationResult> {
  try {
    if (!isValidRecipient(notification.to)) {
      // Gästbeställningar utan mail och konton utan verifierad adress är
      // förväntade fall — inte fel värda en stacktrace.
      console.warn(
        `[notifications] Ingen giltig mottagare för ${notification.type} — hoppar över.`
      );
      return { sent: false, reason: "no_recipient" };
    }

    const rendered = renderNotification(notification);
    if (!rendered) {
      return { sent: false, reason: "unknown_type" };
    }

    const result = await sendMailSafe({
      to: (notification.to as string).trim(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return result.sent
      ? { sent: true }
      : {
          sent: false,
          reason: result.reason === "not_configured" ? "not_configured" : "send_failed",
        };
  } catch (error) {
    // Sista skyddsnätet: inget anrop hit får kunna kasta vidare.
    console.error("[notifications] Oväntat fel:", error);
    return { sent: false, reason: "send_failed" };
  }
}
