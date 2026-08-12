import type { Metadata } from "next";
import { StandaloneReportForm } from "@/components/public-profile/standalone-report-form";

export const metadata: Metadata = {
  title: "Rapportera innehåll | AvyraCards",
  description:
    "Rapportera en profil eller innehåll som bryter mot AvyraCards användarvillkor.",
};

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
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Rapportera innehåll</h1>
      <p className="mt-3 text-slate-300">
        Vi har nolltolerans mot stötande, olagligt eller kränkande innehåll. Alla
        rapporter granskas inom 24 timmar och innehåll som bryter mot villkoren
        tas bort — kontot kan stängas av permanent.
      </p>

      <StandaloneReportForm defaultUsername={searchParams.u ?? ""} />

      <p className="mt-10 text-sm text-slate-400">
        Föredrar du att mejla? Skriv till{" "}
        <a href="mailto:kontakt@avyracards.se" className="underline">
          kontakt@avyracards.se
        </a>{" "}
        så återkommer vi inom 24 timmar.
      </p>
    </main>
  );
}
