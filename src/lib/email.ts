import nodemailer from "nodemailer";
import { Resend } from "resend";

// --- KONFIGURATION FÖR SMTP (Verifiering) ---
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? "587");
const secure = process.env.SMTP_SECURE === "true";

const user = process.env.SMTP_USER ?? process.env.STRATO_SMTP_USER;
const pass = process.env.SMTP_PASS ?? process.env.STRATO_SMTP_PASS;

const from =
  process.env.SMTP_FROM ??
  (user ? `AvyraCards <${user}>` : undefined);

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

// --- KONFIGURATION FÖR RESEND (Lösenordsåterställning) ---
const resend = new Resend(process.env.RESEND_API_KEY);


// --- FUNKTION 1: VERIFIERINGSMAIL (Nodemailer) ---
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
    subject: "✨ Välkommen till AvyraCards – Verifiera ditt konto",
    text: `Hej!

Tack för att du registrerat dig hos AvyraCards. 
Klicka på länken nedan för att verifiera din e-postadress och aktivera ditt konto:

${verifyUrl}

Om du inte har skapat ett konto kan du ignorera detta meddelande.

Vänliga hälsningar,
Team AvyraCards
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifiera ditt konto</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h2 style="color:#4CAF50; margin-top:0;">Välkommen till AvyraCards 🎉</h2>
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
      Detta är ett automatiskt utskick från AvyraCards. Går ej att svara på.
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


// --- FUNKTION 2: LÖSENORDSÅTERSTÄLLNING (Resend) ---
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    // OBS: I produktion måste 'from' vara en verifierad domän i Resend (t.ex. support@avyracards.se)
    // 'onboarding@resend.dev' fungerar bara om du skickar till din egen mailadress under testning.
    await resend.emails.send({
      from: 'AvyraCards <onboarding@resend.dev>', 
      to: email,
      subject: 'Återställ ditt lösenord - AvyraCards',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Återställ ditt lösenord</h2>
          <p>Vi har mottagit en begäran om att återställa lösenordet för ditt AvyraCards-konto.</p>
          <p>Klicka på knappen nedan för att välja ett nytt lösenord:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Återställ lösenord
          </a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Om du inte begärde detta kan du ignorera detta mail. Länken gäller i 1 timme.
          </p>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return { success: false, error };
  }
}