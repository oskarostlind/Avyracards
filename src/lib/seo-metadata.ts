import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { APP_STORE_ID, SITE_NAME, SITE_URL } from "@/lib/seo";

type PageKey =
  | "home"
  | "social"
  | "business"
  | "getStarted"
  | "order"
  | "contact"
  | "privacy"
  | "terms"
  | "login"
  | "register";

type Options = {
  /** Nyckel under `seo.*` i meddelandeträdet. */
  key: PageKey;
  /** Sökväg utan värd, t.ex. "/business". Blir canonical + og:url. */
  path: string;
  /**
   * Visar Safaris Smart App Banner ("Öppna i App Store"). Bara på marknads-
   * sidor — inte på publika profiler, där mottagaren inte behöver någon app.
   */
  smartBanner?: boolean;
  /** Sätt false på sidor som inte ska indexeras (inloggning m.m.). */
  index?: boolean;
};

/**
 * Bygger metadata för en publik sida ur i18n-trädet: titel (rotlayoutens
 * mall lägger på " | AvyraCards"), beskrivning, canonical mot apex-domänen
 * och Open Graph/Twitter med samma texter.
 */
export function pageMetadata({ key, path, smartBanner = false, index = true }: Options): Metadata {
  const { t } = getI18n();
  const title = t(`seo.${key}.title`);
  const description = t(`seo.${key}.description`);
  const url = `${SITE_URL}${path}`;

  // Rotlayoutens title.template gäller bara UNDERLIGGANDE segment — app/page.tsx
  // ligger i samma segment som layouten och får därför ingen suffix. Startsidan
  // sätter hela titeln själv så att den ser ut som resten av sajten.
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: path === "/" ? { absolute: fullTitle } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
    },
    twitter: {
      title: fullTitle,
      description,
    },
    robots: index ? undefined : { index: false, follow: true },
    ...(smartBanner ? { itunes: { appId: APP_STORE_ID } } : {}),
  };
}
