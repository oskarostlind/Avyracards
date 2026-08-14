/**
 * Central konfiguration för språkstödet.
 *
 * Medvetet val: vi kör INTE next-intl med locale-prefix i URL:en
 * (`/sv/...`, `/en/...`). Publika profil-URL:er (`/u/[username]`) och
 * kort-URL:er (`/c/[cardCode]`) är tryckta på fysiska NFC-kort och delade
 * i sociala medier — de får inte byta form. Språket bor därför i en cookie
 * som läses på servern, och URL:erna är oförändrade.
 */

export const locales = ["sv", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sv";

/** Cookie-namn. Läses på servern i layouten, skrivs från klienten. */
export const LOCALE_COOKIE = "avyra_locale";

/** Ett år — språkvalet ska sitta kvar. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const localeLabels: Record<Locale, string> = {
  sv: "Svenska",
  en: "English",
};

/** Flagg-emoji används i språkväljaren; håller den kompakt i mobilvyn. */
export const localeFlags: Record<Locale, string> = {
  sv: "🇸🇪",
  en: "🇬🇧",
};

/** BCP-47-taggar för `<html lang>` och `Intl`-formatterare. */
export const localeTags: Record<Locale, string> = {
  sv: "sv-SE",
  en: "en-GB",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Plockar bästa språk ur en Accept-Language-header. Används bara som
 * fallback när cookien saknas (första besöket), aldrig för att övertrumfa
 * ett aktivt val.
 */
export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;

  const parsed = header
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const q = rest.find((r) => r.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of parsed) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return defaultLocale;
}
