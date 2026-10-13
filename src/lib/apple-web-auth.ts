/**
 * Hjälpare för Sign in with Apple på webben (Apple JS, popup-läge).
 * Ligger separat från apple-auth.ts eftersom den här filen körs i webbläsaren
 * och inte får dra med sig jose/servernycklar i klientbundlen.
 */

/** Services ID för webben. Saknas den visas ingen Apple-knapp alls. */
export function getPublicAppleServicesId(): string | null {
  // Måste stå som bokstavlig process.env.NEXT_PUBLIC_… för att Next ska
  // baka in värdet i klientbundlen vid build.
  const value = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID?.trim();
  return value ? value : null;
}

/**
 * Apple JS-skriptet styr språket i popup-fönstret via sökvägen. Svenska
 * användare får "Logga in med Apple ID" på svenska, övriga engelska.
 */
export function getAppleJsScriptUrl(locale: string): string {
  const appleLocale = locale === "sv" ? "sv_SE" : "en_US";
  return `https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/${appleLocale}/appleid.auth.js`;
}

/**
 * Redirect URI som registreras på Services ID:t i Apple-portalen. I popup-läge
 * navigerar Apple aldrig dit — svaret kommer via postMessage till sidan — men
 * URI:n måste vara registrerad och ligga på samma origin som sidan, annars
 * vägrar popupen. Den används också vid kodväxlingen (måste matcha exakt).
 */
export const APPLE_WEB_REDIRECT_PATH = "/api/auth/apple/callback";

export function getAppleWebRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}${APPLE_WEB_REDIRECT_PATH}`;
}

function randomHex(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AppleWebNonce {
  /** Skickas till vår server, som hashar och jämför med token. */
  rawNonce: string;
  /** sha256(rawNonce) i hex — skickas till Apple och kommer tillbaka i token. */
  hashedNonce: string;
  /** CSRF-skydd för popupen; jämförs med authorization.state i svaret. */
  state: string;
}

export async function createAppleWebNonce(): Promise<AppleWebNonce> {
  const rawNonce = randomHex(32);
  return {
    rawNonce,
    hashedNonce: await sha256Hex(rawNonce),
    state: randomHex(16),
  };
}
