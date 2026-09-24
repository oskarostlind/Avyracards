/**
 * Central SEO-konfiguration. Allt som handlar om kanonisk värd, App Store-
 * länkar och vilka rutter som är publika bor här — inte utspritt i sidor.
 *
 * Kanonisk värd är APEX (avyracards.se), inte www. Det är den domänen som
 * står tryckt på korten, som wallet-passen använder (`CANONICAL_HOST` i
 * src/lib/wallet/pass-content.ts) och som NEXT_PUBLIC_BASE_URL pekar på.
 * Hårdkodat med flit: läser man en env-variabel som används för något annat
 * riskerar canonical att peka på en redirect.
 */
export const SITE_URL = "https://avyracards.se";
export const SITE_NAME = "AvyraCards";

/** App Store-ID för AvyraCards (bundle se.avyracards.app). */
export const APP_STORE_ID = "6760271330";

/**
 * Apples kampanjlänkar (`ct=`) syns i App Store Connect → Analytics →
 * Sources → Campaigns bara om `pt=` (provider token) också skickas med.
 * Provider-token hittas i ASC under Users and Access → (team) → Provider ID,
 * eller via App Analytics → Campaigns → "Generate Campaign Link".
 * Tom sträng = länken fungerar ändå, men installationerna hamnar under
 * "Web Referrer" i stället för under kampanjnamnet.
 */
export const APP_STORE_PROVIDER_TOKEN = "";

export function appStoreUrl(campaign?: string): string {
  const base = `https://apps.apple.com/se/app/avyracards/id${APP_STORE_ID}`;
  if (!campaign) return base;
  const params = new URLSearchParams();
  if (APP_STORE_PROVIDER_TOKEN) params.set("pt", APP_STORE_PROVIDER_TOKEN);
  params.set("ct", campaign);
  params.set("mt", "8");
  return `${base}?${params.toString()}`;
}

/**
 * Publika, indexerbara rutter. Hamnar i sitemap.xml. Lägg till varje ny
 * publik sida här — annars är den föräldralös för Google.
 */
export const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/social", priority: 0.9, changeFrequency: "monthly" },
  { path: "/business", priority: 0.9, changeFrequency: "monthly" },
  { path: "/get-started", priority: 0.8, changeFrequency: "monthly" },
  { path: "/order", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/register", priority: 0.5, changeFrequency: "yearly" },
  { path: "/login", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Sökvägar som aldrig ska crawlas. `/c/` är kort-redirecten (varje kort-URL
 * ger en 307 eller en aktiveringssida med token), `/report` innehåller ett
 * formulär mot enskilda profiler.
 */
export const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/dashboard",
  "/profile",
  "/checkout",
  "/activate",
  "/c/",
  "/report",
  "/forgot-password",
  "/reset-password",
  "/verify-sent",
  "/verify-resend",
  "/register/activate",
];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
