/**
 * Miljödetektering och konfigurationshygien (arkitektur-backlogg punkt 7).
 *
 * Syftet är att ha ETT ställe som svarar på "vilken miljö kör vi i?" och
 * "är nycklarna för den miljön?". Innan detta låg svaret utspritt i
 * `process.env.NODE_ENV`-kontroller, och inget hindrade att t.ex. en Stripe
 * testnyckel användes i produktion eller en live-nyckel i en preview-deploy.
 *
 * Modulen läser bara miljövariabler — den skriver aldrig och den returnerar
 * aldrig ett hemligt värde, bara egenskaper om värdet (satt/inte satt, läge,
 * längd). Det gör den säker att exponera i ett admin-UI.
 */

export type AppEnvironment = "development" | "preview" | "production";

/** Läsbar vy av miljövariabler. `process.env` uppfyller den här formen. */
export type EnvSource = Record<string, string | undefined>;

/**
 * Vercel sätter `VERCEL_ENV` till production/preview/development och är den
 * enda källan som skiljer en preview-deploy från produktion — `NODE_ENV` är
 * "production" i båda. Lokalt saknas VERCEL_ENV och då gäller NODE_ENV.
 */
export function getAppEnvironment(env: EnvSource = process.env): AppEnvironment {
  const vercelEnv = env.VERCEL_ENV;
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return vercelEnv;
  }
  return env.NODE_ENV === "production" ? "production" : "development";
}

export function isProductionEnvironment(env: EnvSource = process.env): boolean {
  return getAppEnvironment(env) === "production";
}

export type KeyMode = "live" | "test" | "unknown" | "missing";

/** Avgör läge på en Stripe-nyckel utan att avslöja den. */
export function getStripeKeyMode(value: string | undefined | null): KeyMode {
  if (!value || value.trim() === "" || value === "sk_test_missing_key_placeholder") {
    return "missing";
  }
  if (/^(sk|pk|rk|whsec)_live/.test(value)) return "live";
  if (/^(sk|pk|rk)_test/.test(value)) return "test";
  // whsec_ utan live/test-prefix går inte att härleda läge ur.
  return "unknown";
}

export interface StripeModeReport {
  secret: KeyMode;
  publishable: KeyMode;
  webhookSecretSet: boolean;
  /** Hemlig och publik nyckel pekar på samma Stripe-konto-läge. */
  consistent: boolean;
  /** Läget matchar miljön (live i produktion, test i övrigt). */
  matchesEnvironment: boolean;
}

export function getStripeModeReport(env: EnvSource = process.env): StripeModeReport {
  const secret = getStripeKeyMode(env.STRIPE_SECRET_KEY);
  const publishable = getStripeKeyMode(
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? env.STRIPE_PUBLISHABLE_KEY,
  );
  const known = (m: KeyMode) => m === "live" || m === "test";
  const consistent = known(secret) && known(publishable) ? secret === publishable : false;
  const wantLive = isProductionEnvironment(env);
  const matchesEnvironment = known(secret) ? (wantLive ? secret === "live" : secret === "test") : false;

  return {
    secret,
    publishable,
    webhookSecretSet: Boolean(env.STRIPE_WEBHOOK_SECRET),
    consistent,
    matchesEnvironment,
  };
}
