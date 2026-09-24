import type { Metadata } from "next";
import { HomeView } from "@/components/landing/home-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo-metadata";
import { appSchema, homeFaqSchema, organizationSchema, websiteSchema } from "@/lib/seo-schema";

/**
 * Serverskal runt startsidan. Själva vyn är en klientkomponent (redirect
 * in i appen, FAQ-accordion), men metadata och JSON-LD måste sättas från
 * servern — en "use client"-fil kan inte exportera metadata alls.
 */
export function generateMetadata(): Metadata {
  return pageMetadata({ key: "home", path: "/", smartBanner: true });
}

export default function HomePage() {
  const { locale, t } = getI18n();

  return (
    <>
      <JsonLd data={[organizationSchema(), websiteSchema(locale), appSchema(t), homeFaqSchema(t)]} />
      <HomeView />
    </>
  );
}
