import type { Metadata } from "next";
import { SocialView } from "@/components/landing/social-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo-metadata";
import { webPageSchema } from "@/lib/seo-schema";

export function generateMetadata(): Metadata {
  return pageMetadata({ key: "social", path: "/social", smartBanner: true });
}

export default function SocialLandingPage() {
  const { locale, t } = getI18n();

  return (
    <>
      <JsonLd
        data={webPageSchema({
          path: "/social",
          name: t("seo.social.title"),
          description: t("seo.social.description"),
          locale,
        })}
      />
      <SocialView />
    </>
  );
}
