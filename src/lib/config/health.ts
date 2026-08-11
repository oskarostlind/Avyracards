/**
 * Konfigurationsdiagnostik (arkitektur-backlogg punkt 7).
 *
 * Bygger en rapport över om de miljövariabler systemet är beroende av faktiskt
 * är satta, och om de är rimliga för den miljö vi kör i. Rapporten innehåller
 * ALDRIG ett hemligt värde — bara status och en förklarande text — och är
 * därför säker att visa i admin-UI:t.
 *
 * Anledningen till att detta behövs: flera funktioner (systemmail, native IAP,
 * wallet, Stripe) faller tillbaka tyst när konfigurationen saknas. Tyst
 * fallback är rätt beteende i drift, men det gör också att man inte upptäcker
 * en saknad variabel förrän en kund hör av sig.
 */

import {
  getAppEnvironment,
  getStripeModeReport,
  isProductionEnvironment,
  type AppEnvironment,
  type EnvSource,
} from "./environment";

export type CheckStatus = "ok" | "warn" | "error" | "off";

export interface ConfigCheck {
  /** Stabil identifierare, används i tester och som React-key. */
  id: string;
  label: string;
  status: CheckStatus;
  /** Kort förklaring på svenska. Får aldrig innehålla ett hemligt värde. */
  detail: string;
}

export interface ConfigGroup {
  id: string;
  title: string;
  checks: ConfigCheck[];
}

export interface ConfigReport {
  environment: AppEnvironment;
  /** Sämsta status bland alla kontroller. */
  worst: CheckStatus;
  errorCount: number;
  warnCount: number;
  groups: ConfigGroup[];
}

function present(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * En variabel som krävs i produktion men är valfri lokalt: saknad i produktion
 * är ett fel, saknad i övriga miljöer är bara "av".
 */
function requiredInProduction(
  id: string,
  label: string,
  value: string | undefined,
  prod: boolean,
  opts: { setDetail: string; missingDetail: string },
): ConfigCheck {
  if (present(value)) {
    return { id, label, status: "ok", detail: opts.setDetail };
  }
  return {
    id,
    label,
    status: prod ? "error" : "off",
    detail: opts.missingDetail,
  };
}

export function buildConfigReport(env: EnvSource = process.env): ConfigReport {
  const environment = getAppEnvironment(env);
  const prod = isProductionEnvironment(env);
  const stripe = getStripeModeReport(env);

  const groups: ConfigGroup[] = [];

  // --- Plattform ---
  const baseUrl = env.NEXT_PUBLIC_BASE_URL;
  const baseUrlCheck: ConfigCheck = (() => {
    if (!present(baseUrl)) {
      return {
        id: "base-url",
        label: "NEXT_PUBLIC_BASE_URL",
        status: prod ? "error" : ("off" as CheckStatus),
        detail: prod
          ? "Saknas. Länkar i mail och QR-koder byggs på den här adressen."
          : "Inte satt lokalt — faller tillbaka på relativa länkar.",
      };
    }
    if (prod && (baseUrl!.startsWith("http://") || baseUrl!.includes("localhost"))) {
      return {
        id: "base-url",
        label: "NEXT_PUBLIC_BASE_URL",
        status: "error",
        detail: "Pekar på http eller localhost i produktion — mail och QR-koder blir felaktiga.",
      };
    }
    return { id: "base-url", label: "NEXT_PUBLIC_BASE_URL", status: "ok", detail: "Satt." };
  })();

  groups.push({
    id: "platform",
    title: "Plattform",
    checks: [
      baseUrlCheck,
      requiredInProduction("nextauth-secret", "NEXTAUTH_SECRET", env.NEXTAUTH_SECRET, prod, {
        setDetail: "Satt.",
        missingDetail: "Saknas — sessioner kan inte signeras stabilt.",
      }),
      requiredInProduction("database-url", "DATABASE_URL", env.DATABASE_URL, prod, {
        setDetail: "Satt.",
        missingDetail: "Saknas — ingen databasanslutning.",
      }),
      requiredInProduction("blob-token", "BLOB_READ_WRITE_TOKEN", env.BLOB_READ_WRITE_TOKEN, prod, {
        setDetail: "Satt — profilbildsuppladdning fungerar.",
        missingDetail: "Saknas — uppladdning av profilbild misslyckas.",
      }),
    ],
  });

  // --- Betalningar ---
  const stripeChecks: ConfigCheck[] = [];
  if (stripe.secret === "missing") {
    stripeChecks.push({
      id: "stripe-secret",
      label: "STRIPE_SECRET_KEY",
      status: prod ? "error" : "off",
      detail: "Saknas — betalningar går inte att genomföra.",
    });
  } else if (!stripe.matchesEnvironment) {
    stripeChecks.push({
      id: "stripe-secret",
      label: "STRIPE_SECRET_KEY",
      status: prod ? "error" : "warn",
      detail: prod
        ? `Testnyckel i produktion (läge: ${stripe.secret}) — riktiga betalningar registreras inte.`
        : `Live-nyckel i ${environment} — riktiga kortbetalningar kan dras här.`,
    });
  } else {
    stripeChecks.push({
      id: "stripe-secret",
      label: "STRIPE_SECRET_KEY",
      status: "ok",
      detail: `Läge: ${stripe.secret} — matchar miljön.`,
    });
  }

  stripeChecks.push({
    id: "stripe-consistency",
    label: "Stripe-nycklar i samma läge",
    status: stripe.consistent ? "ok" : "error",
    detail: stripe.consistent
      ? "Hemlig och publik nyckel hör till samma läge."
      : `Hemlig nyckel är "${stripe.secret}" och publik nyckel "${stripe.publishable}" — checkout misslyckas.`,
  });

  stripeChecks.push(
    requiredInProduction("stripe-webhook", "STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET, prod, {
      setDetail: "Satt — webhooken kan verifieras.",
      missingDetail: "Saknas — premium aktiveras inte automatiskt efter betalning.",
    }),
  );

  const iosNative = env.NEXT_PUBLIC_IOS_NATIVE_PAYMENTS;
  stripeChecks.push({
    id: "ios-native-payments",
    label: "NEXT_PUBLIC_IOS_NATIVE_PAYMENTS",
    status: iosNative === "true" ? "ok" : prod ? "error" : "off",
    detail:
      iosNative === "true"
        ? "På — premium köps via Apples IAP i iOS-appen (App Store-krav 3.1.1)."
        : iosNative === undefined || iosNative === ""
          ? "Inte satt. I iOS-appen visas då Stripe-checkout för premium, vilket bryter mot App Store-riktlinje 3.1.1."
          : `Satt till "${iosNative}" — bara exakt "true" räknas som på. Just nu visas Stripe-checkout i iOS-appen.`,
  });

  groups.push({ id: "payments", title: "Betalningar", checks: stripeChecks });

  // --- Apple IAP ---
  const iapIds = present(env.APPLE_IAP_PREMIUM_MONTHLY) && present(env.APPLE_IAP_PREMIUM_6MO);
  const iapCreds =
    present(env.APPLE_IAP_KEY_ID) &&
    present(env.APPLE_IAP_ISSUER_ID) &&
    present(env.APPLE_IAP_PRIVATE_KEY);
  groups.push({
    id: "apple-iap",
    title: "Apple In-App Purchase",
    checks: [
      {
        id: "iap-products",
        label: "Produkt-ID:n",
        status: iapIds ? "ok" : iosNative === "true" ? "error" : "off",
        detail: iapIds
          ? "Båda produkt-ID:na är satta."
          : "APPLE_IAP_PREMIUM_MONTHLY och/eller APPLE_IAP_PREMIUM_6MO saknas — köpknappen i appen hittar ingen produkt.",
      },
      {
        id: "iap-credentials",
        label: "Serververifiering",
        status: iapCreds ? "ok" : iosNative === "true" ? "error" : "off",
        detail: iapCreds
          ? "Nyckel, issuer och privat nyckel är satta — kvitton kan verifieras."
          : "APPLE_IAP_KEY_ID / APPLE_IAP_ISSUER_ID / APPLE_IAP_PRIVATE_KEY saknas — köp kan inte verifieras mot Apple.",
      },
    ],
  });

  // --- Systemmail (Resend) ---
  const resendOk = present(env.RESEND_API_KEY);
  // MAIL_FROM med SMTP_FROM som fallback — samma kedja som src/lib/mailer.ts.
  const mailFrom = env.MAIL_FROM ?? env.SMTP_FROM;
  const fromDomain = mailFrom?.match(/@([^\s>]+)/)?.[1]?.toLowerCase() ?? null;
  const fromOnVerifiedDomain = fromDomain === null || fromDomain === "avyracards.se";
  groups.push({
    id: "mail",
    title: "Systemmail (Resend)",
    checks: [
      {
        id: "resend",
        label: "RESEND_API_KEY",
        status: resendOk ? "ok" : prod ? "error" : "off",
        detail: resendOk
          ? "Satt. All utgående e-post går via Resend."
          : "Saknas — verifieringsmail, orderbekräftelser och premiumkvittenser skickas inte.",
      },
      {
        id: "mail-from",
        label: "Avsändare",
        status: fromOnVerifiedDomain ? "ok" : "warn",
        detail: fromOnVerifiedDomain
          ? `Skickas som ${mailFrom ?? "no-reply@avyracards.se (standard)"}. Domänen måste vara verifierad i Resend, annars avvisas utskicket.`
          : `Avsändardomänen (${fromDomain}) är inte avyracards.se — Resend avvisar utskick från overifierade domäner.`,
      },
      {
        id: "mail-reply-to",
        label: "MAIL_REPLY_TO",
        status: present(env.MAIL_REPLY_TO) ? "ok" : "off",
        detail: present(env.MAIL_REPLY_TO)
          ? "Satt — svar på systemmail går till den adressen."
          : "Inte satt — svar går till no-reply-adressen och försvinner.",
      },
    ],
  });

  // --- Wallet ---
  const appleWallet =
    present(env.APPLE_PASS_TYPE_ID) &&
    present(env.APPLE_TEAM_ID) &&
    present(env.WALLET_SIGNER_PEM) &&
    present(env.WALLET_WWDR_PEM);
  const googleWallet =
    present(env.GOOGLE_WALLET_ISSUER_ID) &&
    present(env.GOOGLE_CLIENT_EMAIL) &&
    present(env.GOOGLE_PRIVATE_KEY);
  groups.push({
    id: "wallet",
    title: "Wallet",
    checks: [
      {
        id: "apple-wallet",
        label: "Apple Wallet",
        status: appleWallet ? "ok" : "off",
        detail: appleWallet
          ? "Pass-typ, team-ID och certifikat är satta."
          : "Ofullständig — knappen \"Lägg till i Apple Wallet\" fungerar inte.",
      },
      {
        id: "google-wallet",
        label: "Google Wallet",
        status: googleWallet ? "ok" : "off",
        detail: googleWallet
          ? "Issuer-ID och tjänstekonto är satta."
          : "Ofullständig — knappen \"Lägg till i Google Wallet\" fungerar inte.",
      },
    ],
  });

  // --- Push ---
  groups.push({
    id: "push",
    title: "Push-notiser",
    checks: [
      {
        id: "firebase",
        label: "FIREBASE_SERVICE_ACCOUNT_JSON",
        status: present(env.FIREBASE_SERVICE_ACCOUNT_JSON) ? "ok" : "off",
        detail: present(env.FIREBASE_SERVICE_ACCOUNT_JSON)
          ? "Satt."
          : "Inte satt — push-notiser skickas inte.",
      },
    ],
  });

  // --- Miljöhygien ---
  const hygiene: ConfigCheck[] = [];
  if (env.NEXT_PUBLIC_IOS_DEBUG === "true" && prod) {
    hygiene.push({
      id: "ios-debug",
      label: "NEXT_PUBLIC_IOS_DEBUG",
      status: "warn",
      detail: "Debugläget är på i produktion — extra loggning exponeras i appen.",
    });
  } else {
    hygiene.push({
      id: "ios-debug",
      label: "NEXT_PUBLIC_IOS_DEBUG",
      status: "ok",
      detail: prod ? "Av i produktion." : "Påverkar bara iOS-appens loggning.",
    });
  }
  groups.push({ id: "hygiene", title: "Miljöhygien", checks: hygiene });

  const allChecks = groups.flatMap((g) => g.checks);
  const errorCount = allChecks.filter((c) => c.status === "error").length;
  const warnCount = allChecks.filter((c) => c.status === "warn").length;

  // "off" är informativt (funktionen är avstängd, inte trasig) och räknas
  // därför inte som ett problem.
  const worst: CheckStatus = errorCount > 0 ? "error" : warnCount > 0 ? "warn" : "ok";

  return { environment, worst, errorCount, warnCount, groups };
}
