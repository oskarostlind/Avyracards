import nodemailer from "nodemailer";

// --- KONFIGURATION FÖR SMTP (Strato) ---
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
    "[email] SMTP-konfiguration saknas (host/user/pass). Mail kan inte skickas."
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
});

// Verifiera uppkoppling vid start (endast i dev/build)
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

// --- FUNKTION 1: VERIFIERINGSMAIL ---
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
    text: `Välkommen! Verifiera ditt konto här: ${verifyUrl}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verifiera ditt konto</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h2 style="color:#4CAF50; margin-top:0;">Välkommen till AvyraCards 🎉</h2>
    <p style="color:#333;">Tack för att du registrerat dig! Klicka nedan för att verifiera din e-post:</p>
    <p style="text-align:center; margin: 30px 0;">
      <a href="${verifyUrl}" target="_blank" style="display:inline-block; padding:12px 24px; background-color:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">Verifiera mitt konto</a>
    </p>
    <p style="color:#555; font-size:14px;">Om du inte skapat ett konto kan du ignorera detta.</p>
  </div>
</body>
</html>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Verifieringsmail skickat:", info.messageId);
  }
}

// --- FUNKTION 2: LÖSENORDSÅTERSTÄLLNING (Nu via SMTP!) ---
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  // Vi använder samma transporter och credentials som ovan
  if (!host || !user || !pass || !from) {
      console.error("SMTP config missing for reset email");
      return { success: false, error: "SMTP config missing" };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Återställ ditt lösenord - AvyraCards',
      text: `Återställ ditt lösenord här: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
    console.error("Failed to send reset email via SMTP:", error);
    return { success: false, error };
  }
}