import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Delad SMTP-transport (Strato).
 *
 * Tidigare byggdes transporten på modulnivå i `src/lib/email.ts`, vilket innebar
 * att bara det faktum att någon importerade en mailfunktion öppnade en anslutning
 * och (i dev) körde en `verify()`. När fler delar av systemet ska skicka mail
 * behöver konfigurationen ligga på ett ställe och skapas lat.
 */

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function getMailerConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER ?? process.env.STRATO_SMTP_USER;
  const pass = process.env.SMTP_PASS ?? process.env.STRATO_SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from: process.env.SMTP_FROM ?? `AvyraCards <${user}>`,
  };
}

export function isMailerConfigured(): boolean {
  return getMailerConfig() !== null;
}

let cachedTransporter: Transporter | null = null;
let cachedFor: string | null = null;

function getTransporter(config: MailerConfig): Transporter {
  // Nyckeln gör att en ändrad env-variabel (t.ex. mellan tester) inte serveras
  // från en gammal transport.
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (cachedTransporter && cachedFor === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  cachedFor = key;
  return cachedTransporter;
}

/**
 * Skickar ett mail. Kastar om SMTP inte är konfigurerat eller om sändningen
 * misslyckas — använd `sendMailSafe` för mail som inte får fälla anropet.
 */
export async function sendMail(input: MailInput): Promise<void> {
  const config = getMailerConfig();
  if (!config) {
    throw new Error("SMTP-konfigurationen är inte komplett.");
  }

  await getTransporter(config).sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

/**
 * Som `sendMail`, men kastar aldrig. Avsedd för systemnotifikationer: ett
 * mailserverfel ska aldrig kunna få en betalning eller en orderuppdatering att
 * se ut att misslyckas för användaren.
 */
export async function sendMailSafe(
  input: MailInput
): Promise<{ sent: boolean; reason?: string }> {
  if (!isMailerConfigured()) {
    console.warn("[mailer] SMTP saknas — hoppar över mail:", input.subject);
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
