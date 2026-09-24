import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/seo";

/**
 * Bara de statiska, publika sidorna. Publika profiler (/u/[username]) listas
 * medvetet INTE: de är användargenererade, ofta tunna, och en ny domän ska
 * inte spädas ut med tusentals nästan tomma sidor. De hittas ändå via
 * delade länkar, och tunna profiler får noindex i sin egen generateMetadata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
