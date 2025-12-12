// src/lib/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? "587");
const secure = process.env.SMTP_SECURE === "true";

const user = process.env.SMTP_USER ?? process.env.STRATO_SMTP_USER;
const pass = process.env.SMTP_PASS ?? process.env.STRATO_SMTP_PASS;

const from =
  process.env.SMTP_FROM ??
  (user ? `SocialCard <${user}>` : undefined);

if (!host || !user || !pass) {
  console.warn(
    "[email] SMTP-konfiguration saknas (host/user/pass). Verifieringsmail kan inte skickas."
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
});

if (process.env.NODE_ENV !== "production") {
  transporter
    .verify()
    .then(() => {
      console.log(`[email] SMTP OK (${host}:${port}, secure=${secure})`);
    })
    .catch((err: unknown) => {
      console.error("[email] SMTP verify failed:", err);
    });
}

export async function sendVerificationEmail(to: string, token: string) {
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP-konfigurationen är inte komplett.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL saknas");
  }

  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  const info = await transporter.sendMail({
    from,
    to,
    subject: "✨ Välkommen till SocialCard – Verifiera ditt konto",
    text: `Hej!

Tack för att du registrerat dig hos SocialCard. 
Klicka på länken nedan för att verifiera din e-postadress och aktivera ditt konto:

${verifyUrl}

Om du inte har skapat ett konto kan du ignorera detta meddelande.

Vänliga hälsningar,
Team SocialCard
    `,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color:#4CAF50;">Välkommen till SocialCard 🎉</h2>
        <p>Tack för att du registrerat dig! Klicka på knappen nedan för att verifiera din e-postadress och aktivera ditt konto:</p>
        <p style="text-align:center;">
          <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block; padding:12px 24px; background-color:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
            Verifiera mitt konto
          </a>
        </p>
        <p>Om du inte har skapat ett konto kan du ignorera detta meddelande.</p>
        <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
        <p style="font-size:12px; color:#777;">Detta är ett automatiskt utskick från SocialCard. Svara inte på detta mail.</p>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Mail skickat, server-respons:", info);
  }
}