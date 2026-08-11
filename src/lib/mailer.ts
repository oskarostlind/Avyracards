import { Resend } from "resend";

/**
 * Delad mailtransport — all utgående e-post går via Resend.
 *
 * Tidigare gick mailen via SMTP (Strato) med nodemailer. Resend ger levererbarhet
 * som går att följa upp (loggar, studsar, suppressions) i stället för en SMTP-server
 * som antingen svarar eller inte, och avsändardomänen är signerad med DKIM/SPF.
 *
 * Kräver:
 * - `RESEND_API_KEY`
 * - `MAIL_FROM` (valfritt) — annars `no-reply@avyracards.se`. Domänen måste vara
 *   verifierad i Resend, annars avvisas utskicket.
 */

export const DEFAULT_MAIL_FROM = "AvyraCards <no-reply@avyracards.se>";

export interface MailerConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function getMailerConfig(): MailerConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    // SMTP_FROM stöds som fallback så att en miljö som ännu inte fått den nya
    // variabeln satt inte tystnar helt.
    from: process.env.MAIL_FROM ?? process.env.SMTP_FROM ?? DEFAULT_MAIL_FROM,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
  };
}

export function isMailerConfigured(): boolean {
  return getMailerConfig() !== null;
}

let cachedClient: Resend | null = null;
let cachedForKey: string | null = null;

function getClient(apiKey: string): Resend {
  if (cachedClient && cachedForKey === apiKey) {
    return cachedClient;
  }
  cachedClient = new Resend(apiKey);
  cachedForKey = apiKey;
  return cachedClient;
}

/**
 * Skickar ett mail. Kastar om Resend inte är konfigurerat eller om utskicket
 * avvisas — använd `sendMailSafe` för mail som inte får fälla anropet.
 */
export async function sendMail(input: MailInput): Promise<{ id: string | null }> {
  const config = getMailerConfig();
  if (!config) {
    throw new Error("RESEND_API_KEY saknas — mail kan inte skickas.");
  }

  // Resend kastar inte på API-fel, det returnerar { data, error }. Utan den här
  // kontrollen hade ett avvisat mail sett ut som ett lyckat utskick.
  const { data, error } = await getClient(config.apiKey).emails.send({
    from: config.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(config.replyTo ? { replyTo: config.replyTo } : {}),
  });

  if (error) {
    throw new Error(
      `Resend avvisade utskicket: ${error.name ?? "okänt fel"} — ${error.message}`
    );
  }

  return { id: data?.id ?? null };
}

/**
 * Som `sendMail`, men kastar aldrig. Avsedd för systemnotifikationer: ett
 * mailfel ska aldrig kunna få en betalning eller en orderuppdatering att se ut
 * att misslyckas för användaren.
 */
export async function sendMailSafe(
  input: MailInput
): Promise<{ sent: boolean; reason?: string }> {
  if (!isMailerConfigured()) {
    console.warn("[mailer] RESEND_API_KEY saknas — hoppar över mail:", input.subject);
    return { sent: false, reason: "not_configured" };
  }

  try {
    await sendMail(input);
    return { sent: true };
  } catch (error) {
    console.error("[mailer] Kunde inte skicka mail:", input.subject, error);
    return { sent: false, reason: "send_failed" };
  }
}
