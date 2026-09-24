import type { Translator } from "@/i18n/translate";
import type { Locale } from "@/i18n/config";
import { APP_STORE_ID, SITE_NAME, SITE_URL, SOCIAL_LINKS, appStoreUrl } from "@/lib/seo";

/** Organization + WebSite — samma på alla marknadssidor. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/avyra-logo.png`,
    email: "kontakt@avyracards.se",
    areaServed: "SE",
    sameAs: [appStoreUrl(), ...SOCIAL_LINKS.flatMap((l) => (l.url ? [l.url] : []))],
  };
}

export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * iOS-appen som MobileApplication. Betyg utelämnas med flit: aggregateRating
 * får bara sättas när det finns riktiga betyg i App Store (0 i skrivande stund).
 */
export function appSchema(t: Translator) {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: SITE_NAME,
    operatingSystem: "iOS",
    applicationCategory: "BusinessApplication",
    description: t("seo.defaultDescription"),
    installUrl: appStoreUrl("schema"),
    sameAs: `https://apps.apple.com/app/id${APP_STORE_ID}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SEK",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** FAQPage byggd av startsidans fem frågor — samma copy som visas på sidan. */
export function homeFaqSchema(t: Translator) {
  const items = [1, 2, 3, 4, 5].map((i) => ({
    "@type": "Question",
    name: t(`home.faq${i}Q`),
    acceptedAnswer: { "@type": "Answer", text: t(`home.faq${i}A`) },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items,
  };
}

/** WebPage-block för en undersida — ger sidan namn, språk och tillhörighet. */
export function webPageSchema(opts: { path: string; name: string; description: string; locale: Locale }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: `${SITE_URL}${opts.path}`,
    name: opts.name,
    description: opts.description,
    inLanguage: opts.locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
