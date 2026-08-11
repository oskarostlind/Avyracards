import { isMailerConfigured, sendMail } from "@/lib/mailer";

/**
 * Auth-relaterade mail. Transporten (Resend) ligger i `@/lib/mailer` så att
 * systemnotifikationer (se `@/lib/notifications`) och de här delar samma
 * avsändare och samma konfiguration.
 */

// --- FUNKTION 1: VERIFIERINGSMAIL ---
export async function sendVerificationEmail(to: string, token: string) {
  if (!isMailerConfigured()) {
    throw new Error("RESEND_API_KEY saknas — verifieringsmail kan inte skickas.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL saknas");
  }

  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  await sendMail({
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
}

// --- FUNKTION 2: LÖSENORDSÅTERSTÄLLNING ---
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  if (!isMailerConfigured()) {
    console.error("[email] RESEND_API_KEY saknas — kan inte skicka återställningsmail");
    return { success: false, error: "Mail är inte konfigurerat" };
  }

  try {
    await sendMail({
      to: email,
      subject: "Återställ ditt lösenord - AvyraCards",
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
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[email] Kunde inte skicka återställningsmail:", error);
    return { success: false, error };
  }
}
