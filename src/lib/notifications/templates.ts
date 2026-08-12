import { normalizeWalletBaseUrl } from "@/lib/wallet/pass-content";

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

function greeting(name?: string | null): string {
  const first = (name || "").trim().split(/\s+/)[0];
  return first ? `Hej ${first}!` : "Hej!";
}

/**
 * Namnet kommer från användarens profil eller från Stripes leveransuppgifter —
 * alltså från fältet en användare själv fyller i. Det får aldrig gå orört in i
 * mailets HTML.
 */
function greetingHtml(name?: string | null): string {
  return escapeHtml(greeting(name));
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
<html lang="sv">
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
      Det här är ett automatiskt meddelande om ditt AvyraCards-konto och går inte att svara på.
    </p>
  </div>
</body>
</html>`;
}

const PREMIUM_SOURCE_LEAD: Record<PremiumActivationSource, string> = {
  stripe: "Din premiumbetalning är genomförd och kontot är uppgraderat.",
  apple_iap: "Ditt köp via App Store är bekräftat och kontot är uppgraderat.",
  card_order:
    "Premium ingick i din kortbeställning och är nu aktiverat på ditt konto.",
  gift: "Du har fått premium aktiverat på ditt konto.",
};

export function renderPremiumActivated(input: {
  name?: string | null;
  source: PremiumActivationSource;
  expiresAt?: Date | null;
}): RenderedEmail {
  const url = `${baseUrl()}/profile/themes`;
  const lead = PREMIUM_SOURCE_LEAD[input.source] ?? PREMIUM_SOURCE_LEAD.gift;

  const expiryLine = input.expiresAt
    ? `Premium gäller till och med ${input.expiresAt.toISOString().slice(0, 10)}.`
    : null;

  const bullets = [
    "Alla teman och mallar, inklusive de låsta",
    "Statistik med fler detaljer",
    "Egen bakgrundsbild och möjlighet att dölja AvyraCards-loggan",
  ];

  return {
    subject: "Premium är aktiverat på ditt AvyraCards-konto",
    text: [
      greeting(input.name),
      "",
      lead,
      expiryLine,
      "",
      "Det här ingår:",
      ...bullets.map((b) => `- ${b}`),
      "",
      `Öppna dina teman: ${url}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    html: layout({
      heading: "Premium är aktiverat",
      ctaLabel: "Utforska premiumteman",
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name)}</p>
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
}): RenderedEmail {
  const url = `${baseUrl()}/dashboard`;
  const reference = input.orderId.slice(-8).toUpperCase();
  const cardsLabel = `${input.quantity} ${input.quantity === 1 ? "kort" : "kort"}`;
  const amount = formatAmount(input.amountTotal, input.currency);

  return {
    subject: `Tack för din beställning (${reference})`,
    text: [
      greeting(input.name),
      "",
      `Vi har tagit emot din beställning på ${cardsLabel}.`,
      `Ordernummer: ${reference}`,
      `Summa: ${amount}`,
      "",
      "Du får ett nytt mail så snart kortet skickas. När det kommer aktiverar du det genom att hålla telefonen mot kortet eller skanna QR-koden på baksidan.",
      "",
      `Din översikt: ${url}`,
    ].join("\n"),
    html: layout({
      heading: "Tack för din beställning",
      ctaLabel: "Till min översikt",
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name)}</p>
    <p style="color:#333333;line-height:1.6;">Vi har tagit emot din beställning på ${escapeHtml(
      cardsLabel
    )}.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:6px 0;color:#666666;">Ordernummer</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${escapeHtml(
        reference
      )}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;">Antal kort</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${input.quantity}</td></tr>
      <tr><td style="padding:6px 0;color:#666666;">Summa</td><td style="padding:6px 0;color:#111111;text-align:right;font-weight:600;">${escapeHtml(
        amount
      )}</td></tr>
    </table>
    <p style="color:#333333;line-height:1.6;">Du får ett nytt mail så snart kortet skickas. När det kommer aktiverar du det genom att hålla telefonen mot kortet eller skanna QR-koden på baksidan.</p>`,
    }),
  };
}

export function renderCardOrderShipped(input: {
  name?: string | null;
  orderId: string;
  quantity: number;
  shippingCity?: string | null;
}): RenderedEmail {
  const url = `${baseUrl()}/dashboard`;
  const reference = input.orderId.slice(-8).toUpperCase();
  const destination = input.shippingCity?.trim()
    ? ` till ${input.shippingCity.trim()}`
    : "";

  return {
    subject: `Din beställning är på väg (${reference})`,
    text: [
      greeting(input.name),
      "",
      `Nu är ${input.quantity === 1 ? "ditt kort" : "dina kort"} skickat${
        input.quantity === 1 ? "" : "a"
      }${destination}.`,
      `Ordernummer: ${reference}`,
      "",
      "Så aktiverar du kortet när det kommer:",
      "1. Håll telefonen mot kortet, eller skanna QR-koden på baksidan.",
      "2. Logga in med samma konto som du beställde med.",
      "3. Bekräfta aktiveringen — sedan pekar kortet på din profil.",
      "",
      `Din översikt: ${url}`,
    ].join("\n"),
    html: layout({
      heading: "Din beställning är på väg",
      ctaLabel: "Till min översikt",
      ctaUrl: url,
      bodyHtml: `
    <p style="color:#333333;line-height:1.6;">${greetingHtml(input.name)}</p>
    <p style="color:#333333;line-height:1.6;">Nu är ${
      input.quantity === 1 ? "ditt kort" : "dina kort"
    } skickat${input.quantity === 1 ? "" : "a"}${escapeHtml(destination)}.</p>
    <p style="color:#666666;line-height:1.6;">Ordernummer: <strong style="color:#111111;">${escapeHtml(
      reference
    )}</strong></p>
    <p style="color:#333333;line-height:1.6;margin-top:24px;"><strong>Så aktiverar du kortet när det kommer:</strong></p>
    <ol style="color:#333333;line-height:1.8;padding-left:20px;">
      <li>Håll telefonen mot kortet, eller skanna QR-koden på baksidan.</li>
      <li>Logga in med samma konto som du beställde med.</li>
      <li>Bekräfta aktiveringen — sedan pekar kortet på din profil.</li>
    </ol>`,
    }),
  };
}
