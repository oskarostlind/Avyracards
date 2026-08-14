import { isMailerConfigured, sendMail } from "@/lib/mailer";
import { createTranslator, type Translator } from "@/i18n/translate";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * De här mailen triggas alltid av en inloggnings-/registreringsåtgärd som
 * användaren själv gör, så anroparen kan läsa språket ur cookien (getLocale())
 * och skicka med det. Utan argument blir det svenska.
 */
function translatorFor(locale: Locale = defaultLocale): Translator {
  return createTranslator(getMessages(locale), getMessages(defaultLocale), locale);
}

/**
 * Auth-relaterade mail. Transporten (Resend) ligger i `@/lib/mailer` så att
 * systemnotifikationer (se `@/lib/notifications`) och de här delar samma
 * avsändare och samma konfiguration.
 */

// --- FUNKTION 1: VERIFIERINGSMAIL ---
export async function sendVerificationEmail(to: string, token: string, locale: Locale = defaultLocale) {
  const t = translatorFor(locale);
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
    subject: t("email.verify.subject"),
    text: t("email.verify.text", { url: verifyUrl }),
    html: `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><title>${t("email.verify.title")}</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <h2 style="color:#4CAF50; margin-top:0;">${t("email.verify.heading")}</h2>
    <p style="color:#333;">${t("email.verify.body")}</p>
    <p style="text-align:center; margin: 30px 0;">
      <a href="${verifyUrl}" target="_blank" style="display:inline-block; padding:12px 24px; background-color:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">${t("email.verify.cta")}</a>
    </p>
    <p style="color:#555; font-size:14px;">${t("email.verify.ignore")}</p>
  </div>
</body>
</html>
    `,
  });
}

// --- FUNKTION 2: LÖSENORDSÅTERSTÄLLNING ---
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  locale: Locale = defaultLocale,
) {
  const t = translatorFor(locale);
  if (!isMailerConfigured()) {
    console.error("[email] RESEND_API_KEY saknas — kan inte skicka återställningsmail");
    return { success: false, error: "Mail är inte konfigurerat" };
  }

  try {
    await sendMail({
      to: email,
      subject: t("email.reset.subject"),
      text: t("email.reset.text", { url: resetLink }),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${t("email.reset.heading")}</h2>
          <p>${t("email.reset.body1")}</p>
          <p>${t("email.reset.body2")}</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            ${t("email.reset.cta")}
          </a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            ${t("email.reset.ignore")}
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
