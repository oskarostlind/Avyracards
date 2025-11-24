// src/lib/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? "587");
const secure = process.env.SMTP_SECURE === "true";

// Stöd både SMTP_* och STRATO_SMTP_* (enklare att byta senare)
const user = process.env.SMTP_USER ?? process.env.STRATO_SMTP_USER;
const pass = process.env.SMTP_PASS ?? process.env.STRATO_SMTP_PASS;

const from =
  process.env.SMTP_FROM ??
  (user ? `SocialCard <${user}>` : undefined);

if (!host || !user || !pass) {
  console.warn(
    "[email] SMTP-konfiguration saknas delvis (host/user/pass). " +
      "Verifieringsmail kommer inte kunna skickas."
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure, // true + 465 = SSL, false + 587 = STARTTLS
  auth: user && pass ? { user, pass } : undefined,
});

// Extra debug i dev – kollar om vi kan ansluta till SMTP-servern
if (process.env.NODE_ENV !== "production") {
  transporter
    .verify()
    .then(() => {
      console.log(
        `[email] SMTP-anslutning OK (${host}:${port}, secure=${secure})`
      );
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

  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Skickar verifieringsmail", {
      to,
      host,
      port,
      secure,
      from,
      verifyUrl,
    });
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Verifiera ditt SocialCard-konto",
    html: `
      <h2>Verifiera din e-post</h2>
      <p>Klicka på länken nedan för att aktivera ditt konto:</p>
      <p>
        <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
          Verifiera mitt konto
        </a>
      </p>
      <p>Om du inte har skapat ett konto kan du ignorera detta mail.</p>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Mail skickat, server-respons:", info);
  }
}
