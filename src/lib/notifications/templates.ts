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

/**
 * Delade stilbitar. Mail får inte ha externa stylesheets eller webbfonter —
 * allt måste vara inline, och layouten byggs med tabeller eftersom Outlook
 * (Word-renderaren) inte kan flexbox/grid.
 */
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TEXT_STYLE = `margin:0 0 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:#334155;`;
const MUTED_STYLE = `margin:0 0 14px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#64748b;`;

/** Brödtextstycke med mailens standardtypografi. Innehållet måste vara HTML-säkert. */
function paragraph(innerHtml: string, extraStyle = ""): string {
  return `<p style="${TEXT_STYLE}${extraStyle}">${innerHtml}</p>`;
}

function layout(options: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Texten mailklienten visar efter ämnesraden i inkorgen. */
  preheader?: string;
  locale: Locale;
  t: Translator;
}): string {
  const site = baseUrl();

  // "Bulletproof button": bakgrunden ligger på <td> (bgcolor + style) så att
  // knappen syns även i klienter som struntar i länkens background-color.
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px;">
          <tr>
            <td align="center" bgcolor="#7c3aed" style="border-radius:8px;">
              <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:14px 30px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(
                options.ctaLabel
              )}</a>
            </td>
          </tr>
        </table>`
      : "";

  const preheader = options.preheader
    ? `
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#f1f5f9;">${escapeHtml(
    options.preheader
  )}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${options.locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(
    options.heading
  )}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${FONT_STACK};">${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td align="center" bgcolor="#0f172a" style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:24px;">
              <img src="${site}/avyra-logo.png" width="120" alt="AvyraCards" style="display:block;border:0;width:120px;max-width:120px;height:auto;">
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:32px;">
              <h1 style="margin:0 0 16px;font-family:${FONT_STACK};font-size:24px;font-weight:700;line-height:1.3;color:#0f172a;">${escapeHtml(
                options.heading
              )}</h1>
              ${options.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 12px 8px;">
              <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">${escapeHtml(
                options.t("email.autoFooter")
              )}</p>
              <p style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;"><a href="${site}" style="color:#94a3b8;text-decoration:none;">AvyraCards &middot; avyracards.se</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
      preheader: lead,
      bodyHtml: `
              ${paragraph(greetingHtml(input.name, t))}
              ${paragraph(escapeHtml(lead))}
              ${expiryLine ? paragraph(escapeHtml(expiryLine)) : ""}
              ${paragraph(`<strong style="color:#0f172a;">${escapeHtml(t("email.premium.included"))}</strong>`, "margin-top:24px;")}
              <ul style="margin:0;padding-left:20px;font-family:${FONT_STACK};font-size:15px;line-height:1.8;color:#334155;">
                ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("\n                ")}
              </ul>`,
    }),
  };
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  imageUrl: string | null;
}

/**
 * Produktbilder ligger antingen på en absolut URL (Vercel Blob/CDN) eller som
 * en rot-relativ sökväg i /public. Mailklienter har ingen bas-URL att lösa
 * relativa sökvägar mot, så allt annat än de två formen ger `null` — bättre
 * ingen bild än en trasig bildikon i inkorgen.
 */
function resolveImageUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${baseUrl()}${value}`;
  return null;
}

/** En rad per beställd variant: miniatyr + namn + "× antal". */
function renderOrderItemsHtml(items: OrderEmailItem[]): string {
  if (items.length === 0) return "";

  const rows = items
    .map((item, index) => {
      const image = resolveImageUrl(item.imageUrl);
      const divider = index < items.length - 1 ? "border-bottom:1px solid #e2e8f0;" : "";
      const label = `<span style="font-family:${FONT_STACK};font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(
        item.name
      )}</span><br><span style="font-family:${FONT_STACK};font-size:14px;color:#64748b;">&times; ${
        item.quantity
      }</span>`;

      if (!image) {
        return `
                <tr>
                  <td colspan="2" style="padding:14px 0;${divider}">${label}</td>
                </tr>`;
      }

      return `
                <tr>
                  <td width="72" valign="top" style="padding:14px 16px 14px 0;width:72px;${divider}">
                    <img src="${escapeHtml(
                      image
                    )}" width="72" height="72" alt="" style="display:block;border:0;width:72px;height:72px;border-radius:8px;object-fit:cover;background-color:#f1f5f9;">
                  </td>
                  <td valign="middle" style="padding:14px 0;${divider}">${label}</td>
                </tr>`;
    })
    .join("");

  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0 4px;border-collapse:collapse;">${rows}
              </table>`;
}

export function renderCardOrderConfirmed(input: {
  name?: string | null;
  orderId: string;
  quantity: number;
  amountTotal: number;
  currency: string;
  items?: OrderEmailItem[];
  /** Gratiskort från admin — då är summan ointressant och tonen en annan. */
  isGift?: boolean;
  locale?: Locale;
}): RenderedEmail {
  const locale = input.locale ?? defaultLocale;
  const t = translatorFor(locale);
  const url = `${baseUrl()}/dashboard`;
  const reference = input.orderId.slice(-8).toUpperCase();
  const cardsLabel = t("email.orderConfirmed.cards", { count: input.quantity });
  const amount = formatAmount(input.amountTotal, input.currency);
  const isGift = input.isGift === true;
  const items = input.items ?? [];

  const subject = isGift
    ? t("email.orderConfirmed.giftSubject", { reference })
    : t("email.orderConfirmed.subject", { reference });
  const heading = isGift
    ? t("email.orderConfirmed.giftHeading")
    : t("email.orderConfirmed.heading");
  const lead = isGift
    ? t("email.orderConfirmed.giftReceived", { cards: cardsLabel })
    : t("email.orderConfirmed.received", { cards: cardsLabel });

  // Summeringsraderna delas av tunna linjer; sista raden (summan) markeras med
  // en kraftigare bård och fet stil.
  const summaryRow = (label: string, value: string, isTotal = false) => {
    const border = `border-top:1px solid ${isTotal ? "#cbd5e1" : "#e2e8f0"};`;
    const cell = `padding:12px 0;font-family:${FONT_STACK};font-size:14px;${border}`;
    return `
                <tr>
                  <td style="${cell}color:${isTotal ? "#0f172a" : "#64748b"};font-weight:${
                    isTotal ? "700" : "400"
                  };">${escapeHtml(label)}</td>
                  <td align="right" style="${cell}text-align:right;color:#0f172a;font-weight:${
                    isTotal ? "700" : "600"
                  };">${escapeHtml(value)}</td>
                </tr>`;
  };

  return {
    subject,
    text: [
      greeting(input.name, t),
      "",
      lead,
      ...items.map((item) => `- ${item.name} x ${item.quantity}`),
      ...(items.length > 0 ? [""] : []),
      `${t("email.orderConfirmed.orderNumber")}: ${reference}`,
      `${t("email.orderConfirmed.quantity")}: ${input.quantity}`,
      ...(isGift ? [] : [`${t("email.orderConfirmed.amount")}: ${amount}`]),
      "",
      t("email.orderConfirmed.shippingInfo"),
      "",
      t("email.orderConfirmed.overview", { url }),
    ].join("\n"),
    html: layout({
      locale,
      t,
      heading,
      ctaLabel: t("email.orderConfirmed.cta"),
      ctaUrl: url,
      preheader: lead,
      bodyHtml: `
              ${paragraph(greetingHtml(input.name, t))}
              ${paragraph(escapeHtml(lead))}
              ${renderOrderItemsHtml(items)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0 24px;border-collapse:collapse;">${summaryRow(
                t("email.orderConfirmed.orderNumber"),
                reference
              )}${summaryRow(
                t("email.orderConfirmed.quantity"),
                String(input.quantity)
              )}${isGift ? "" : summaryRow(t("email.orderConfirmed.amount"), amount, true)}
              </table>
              ${paragraph(escapeHtml(t("email.orderConfirmed.shippingInfo")))}`,
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
      preheader: sentLine,
      bodyHtml: `
              ${paragraph(greetingHtml(input.name, t))}
              ${paragraph(escapeHtml(sentLine))}
              <p style="${MUTED_STYLE}">${escapeHtml(
                t("email.orderShipped.orderNumber", { reference })
              )}</p>
              ${
                trackingLine
                  ? paragraph(
                      `<strong style="color:#0f172a;">${escapeHtml(trackingLine)}</strong>`
                    )
                  : ""
              }
              ${paragraph(
                `<strong style="color:#0f172a;">${escapeHtml(t("email.orderShipped.howToTitle"))}</strong>`,
                "margin-top:24px;"
              )}
              <ol style="margin:0;padding-left:20px;font-family:${FONT_STACK};font-size:15px;line-height:1.8;color:#334155;">
                ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n                ")}
              </ol>`,
    }),
  };
}
