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
    // UPPDATERING: Fullständig HTML-struktur för bättre kompatibilitet
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifiera ditt konto</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h2 style="color:#4CAF50; margin-top:0;">Välkommen till SocialCard 🎉</h2>
    <p style="color:#333; line-height:1.6;">Tack för att du registrerat dig! Klicka på knappen nedan för att verifiera din e-postadress och aktivera ditt konto:</p>
    
    <p style="text-align:center; margin: 30px 0;">
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block; padding:12px 24px; background-color:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
        Verifiera mitt konto
      </a>
    </p>
    
    <p style="color:#555; font-size:14px; line-height:1.5;">Om du inte har skapat ett konto kan du ignorera detta meddelande.</p>
    
    <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />
    
    <p style="font-size:12px; color:#999; text-align:center;">
      Detta är ett automatiskt utskick från SocialCard. Går ej att svara på.
    </p>
  </div>
</body>
</html>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Mail skickat, server-respons:", info);
  }
}