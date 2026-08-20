import { normalizeWalletBaseUrl } from "@/lib/wallet/pass-content";
import { createTranslator, type Translator } from "@/i18n/translate";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * Mailen renderas ofta utanför en request (Stripe-webhookar, IAP-verifiering),
 * och då finns ingen språkcookie att läsa. Anroparen får därför skicka med
 * språket när det är känt; annars faller vi tillbaka på svenska.
 *
 * OBS: för att webhook-drivna mail ska följa användarens val krävs att språket
 * lagras på User i databasen — det kräver en migrering och är medvetet inte
 * gjort här.
 */
function translatorFor(locale: Locale = defaultLocale): Translator {
  return createTranslator(getMessages(locale), getMessages(defaultLocale), locale);
}

/**
 * Mallar för systemkritiska mail (inte marknadsföring).
 *
 * Alla funktioner här är rena: in med data, ut med { subject, html, text }.
 * Det gör dem testbara utan att röra Resend, och gör att avsändandet (notifications/index)
 * bara behöver bry sig om vem mailet går till.
 */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type PremiumActivationSource =
  | "stripe"
  | "apple_iap"
  | "card_order"
  | "gift";

export function baseUrl(): string {
  return normalizeWalletBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
}

function greeting(name: string | null | undefined, t: Translator): string {
  const first = (name || "").trim().split(/\s+/)[0];
  return first ? t("email.greeting", { name: first }) : t("email.greetingNoName");
}

/**
 * Namnet kommer från användarens profil eller från Stripes leveransuppgifter —
 * alltså från fältet en användare själv fyller i. Det får aldrig gå orört in i
 * mailets HTML.
 */
function greetingHtml(name: string | null | undefined, t: Translator): string {
  return escapeHtml(greeting(name, t));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Öre → "249 kr" / "249,50 kr". Stripe-belopp lagras i minsta enhet.
 *
 * Tusentalsavgränsaren är ett vanligt mellanslag, inte hårt mellanslag (U+00A0):
 * flera mailklienter renderar U+00A0 fel i text/plain-delen.
 */
export const THOUSANDS_SEPARATOR = " ";

export function formatAmount(amountInMinorUnits: number, currency: string): string {
  const major = amountInMinorUnits / 100;
  const hasDecimals = Math.round(major * 100) % 100 !== 0;
  const formatted = major
    .toFixed(hasDecimals ? 2 : 0)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return `${formatted} ${currency.toLowerCase() === "sek" ? "kr" : currency.toUpperCase()}`;
}

function layout(options: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  locale: Locale;
  t: Translator;
}): string {
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<p style="text-align:center;margin:32px 0;">
      <a href="${options.ctaUrl}" style="display:inline-block;padding:13px 26px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${escapeHtml(
          options.ctaLabel
        )}</a>
    </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="${options.locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(
    options.heading
  )}</title></head>
<body style="margin:0;padding:24px;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:22px;color:#111111;">${escapeHtml(options.heading)}</h1>
    ${options.bodyHtml}
    ${cta}
    <hr style="border:none;border-top:1px solid #eeeeee;margin:32px 0 16px;">
    <p style="margin:0;font-size:12px;color:#888888;">
      ${escapeHtml(options.t("email.autoFooter"))}
    </p>
  </div>
</body>
</html>`;
}

const PREMIUM_SOURCE_KEY: Record<PremiumActivationSource, string> = {
  stripe: "email.premium.sourceStripe",
  apple_iap: "email.premium.sourceApple",
  card_order: "email.premium.sourceCardOrder",
  gift: "email.premium.sourceGift",
};

export function renderPremiumActivated(input: {
  name?: string | null;
  source: PremiumActivationSource;
  expiresAt?: Date | null;
  locale?: Locale;
}): RenderedEmail {
  const locale = input.locale ?? defaultLocale;
  const t = translatorFor(locale);
  const url = `${baseUrl()}/profile/themes`;
  const lead = t(PREMIUM_SOURCE_KEY[input.source] ?? PREMIUM_SOURCE_KEY.gift);

  const expiryLine = input.expiresAt
    ? t("email.premium.expiry", { date: input.expiresAt.toISOString().slice(0, 10) })
    : null;

  const bullets = [
    t("email.premium.bullet1"),
    t("email.premium.bullet2"),
    t("email.premium.bullet3"),
  ];

  return {
    subject: t("email.premium.subject"),
    text: [
      greeting(input.name, t),
      "",
      lead,
      expiryLine,
      "",
      t("email.premium.included"),
      ...bullets.map((b) => `- ${b}`),
      "",
      t("email.premium.openThemes", { url }),
    ]
      .filter((line) => line !== null)
      .join("\n"),
    html: layout({
      locale,
      t,
      heading: t("email.premium.heading"),
      ctaLabel: t("email.premium.cta"),
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name, t)}</p>
    <p style="color:#333333;line-height:1.6;">${escapeHtml(lead)}</p>
    ${
      expiryLine
        ? `<p style="color:#333333;line-height:1.6;">${escapeHtml(expiryLine)}</p>`
        : ""
    }
    <ul style="color:#333333;line-height:1.8;padding-left:20px;">
      ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("\n      ")}
    </ul>`,
    }),
  };
}

export function renderCardOrderConfirmed(input: {
  name?: string | null;
  orderId: string;
  quantity: number;
  amountTotal: number;
  currency: string;
  locale?: Locale;
}): RenderedEmail {
  const locale = input.locale ?? defaultLocale;
  const t = translatorFor(locale);
  const url = `${baseUrl()}/dashboard`;
  const reference = input.orderId.slice(-8).toUpperCase();
  const cardsLabel = t("email.orderConfirmed.cards", { count: input.quantity });
  const amount = formatAmount(input.amountTotal, input.currency);

  return {
    subject: t("email.orderConfirmed.subject", { reference }),
    text: [
      greeting(input.name, t),
      "",
      t("email.orderConfirmed.received", { cards: cardsLabel }),
      `${t("email.orderConfirmed.orderNumber")}: ${reference}`,
      `${t("email.orderConfirmed.amount")}: ${amount}`,
      "",
      t("email.orderConfirmed.shippingInfo"),
      "",
      t("email.orderConfirmed.overview", { url }),
    ].join("\n"),
    html: layout({
      locale,
      t,
      heading: t("email.orderConfirmed.heading"),
      ctaLabel: t("email.orderConfirmed.cta"),
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name, t)}</p>
    <p style="color:#333333;line-height:1.6;">${escapeHtml(
      t("email.orderConfirmed.received", { cards: cardsLabel })
    )}</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:6px 0;color:#666666;">${escapeHtml(
        t("email.orderConfirmed.orderNumber")
      )}</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${escapeHtml(
        reference
      )}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;">${escapeHtml(
        t("email.orderConfirmed.quantity")
      )}</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${input.quantity}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;">${escapeHtml(
        t("email.orderConfirmed.amount")
      )}</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${escapeHtml(
        amount
      )}</td></tr>
    </table>
    <p style="color:#333333;line-height:1.6;">${escapeHtml(
      t("email.orderConfirmed.shippingInfo")
    )}</p>`,
    }),
  };
}

export function renderCardOrderShipped(input: {
  name?: string | null;
  orderId: string;
  quantity: number;
  shippingCity?: string | null;
  trackingNumber?: string | null;
  locale?: Locale;
}): RenderedEmail {
  const locale = input.locale ?? defaultLocale;
  const t = translatorFor(locale);
  const url = `${baseUrl()}/dashboard`;
  const reference = input.orderId.slice(-8).toUpperCase();
  const destination = input.shippingCity?.trim()
    ? t("email.orderShipped.destination", { city: input.shippingCity.trim() })
    : "";
  const sentLine = t("email.orderShipped.sent", { count: input.quantity, destination });
  const trackingLine = input.trackingNumber?.trim()
    ? t("email.orderShipped.tracking", { number: input.trackingNumber.trim() })
    : null;
  const steps = [
    t("email.orderShipped.step1"),
    t("email.orderShipped.step2"),
    t("email.orderShipped.step3"),
  ];

  return {
    subject: t("email.orderShipped.subject", { reference }),
    text: [
      greeting(input.name, t),
      "",
      sentLine,
      t("email.orderShipped.orderNumber", { reference }),
      ...(trackingLine ? [trackingLine] : []),
      "",
      t("email.orderShipped.howToTitle"),
      ...steps.map((step, i) => `${i + 1}. ${step}`),
      "",
      t("email.orderShipped.overview", { url }),
    ].join("\n"),
    html: layout({
      locale,
      t,
      heading: t("email.orderShipped.heading"),
      ctaLabel: t("email.orderShipped.cta"),
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name, t)}</p>
    <p style="color:#333333;line-height:1.6;">${escapeHtml(sentLine)}</p>
    <p style="color:#666666;line-height:1.6;">${escapeHtml(
      t("email.orderShipped.orderNumber", { reference })
    )}</p>
    ${
      trackingLine
        ? `<p style="color:#333333;line-height:1.6;"><strong>${escapeHtml(trackingLine)}</strong></p>`
        : ""
    }
    <p style="color:#333333;line-height:1.6;margin-top:24px;"><strong>${escapeHtml(
      t("email.orderShipped.howToTitle")
    )}</strong></p>
    <ol style="color:#333333;line-height:1.8;padding-left:20px;">
      ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n      ")}
    </ol>`,
    }),
  };
}
