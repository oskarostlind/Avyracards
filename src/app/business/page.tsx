import type { Metadata } from "next";
import { BusinessView } from "@/components/landing/business-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo-metadata";
import { webPageSchema } from "@/lib/seo-schema";

export function generateMetadata(): Metadata {
  return pageMetadata({ key: "business", path: "/business", smartBanner: true });
}

export default function BusinessLandingPage() {
  const { locale, t } = getI18n();

  return (
    <>
      <JsonLd
        data={webPageSchema({
          path: "/business",
          name: t("seo.business.title"),
          description: t("seo.business.description"),
          locale,
        })}
      />
      <BusinessView />
    </>
  );
}
