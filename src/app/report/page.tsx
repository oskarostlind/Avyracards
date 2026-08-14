import type { Metadata } from "next";
import { StandaloneReportForm } from "@/components/public-profile/standalone-report-form";
import { getT } from "@/i18n/server";
import { MODERATION_CONTACT_EMAIL } from "@/lib/moderation-shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return {
    title: `${t("moderation.pageTitle")} | AvyraCards`,
    description: t("moderation.pageMetaDescription"),
  };
}

/**
 * Publicerad, alltid nåbar rapportväg (Guideline 1.2). Rapportknappen finns på
 * varje profil, men Apple vill också se en fast kontakt-/rapportsida som går
 * att länka till från App Store Connect och från våra villkor.
 */
export default function ReportPage({
  searchParams,
}: {
  searchParams: { u?: string };
}) {
  const t = getT();

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">{t("moderation.pageTitle")}</h1>
      <p className="mt-3 text-slate-300">{t("moderation.pageIntro")}</p>

      <StandaloneReportForm defaultUsername={searchParams.u ?? ""} />

      <p className="mt-10 text-sm text-slate-400">
        {t("moderation.pageMailBefore")}{" "}
        <a href={`mailto:${MODERATION_CONTACT_EMAIL}`} className="underline">
          {MODERATION_CONTACT_EMAIL}
        </a>{" "}
        {t("moderation.pageMailAfter")}
      </p>
    </main>
  );
}
