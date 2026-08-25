/**
 * Validering av deeplinken som följer med en push-notis (`data.url`).
 *
 * Ligger i en egen modul utan Capacitor-import så att den kan enhetstestas i
 * Node-miljö — komponenten som använder den (src/components/push-deep-link.tsx)
 * går bara att ladda i en webbläsare.
 */

/** Sidor som flyttat, eller som notiser kan bära i kortform. */
const PATH_ALIASES: Record<string, string> = {
  "/analytics": "/dashboard/analytics",
};

/**
 * Notisens payload kommer utifrån. Vi navigerar därför BARA till relativa,
 * same-origin-sökvägar — aldrig till en absolut URL som någon annan valt.
 * "//evil.com" och "/\evil.com" tolkas av webbläsaren som protokoll-relativa
 * adresser och avvisas därför också.
 */
export function sanitizeDeepLink(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value.startsWith("/")) return null;
  if (/^\/[/\\]/.test(value)) return null;

  const [pathname] = value.split(/[?#]/, 1);
  const alias = PATH_ALIASES[pathname];
  if (alias) return alias + value.slice(pathname.length);

  return value;
}
