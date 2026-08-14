import { getT } from "@/i18n/server";
import { MODERATION_CONTACT_EMAIL } from "@/lib/moderation-shared";

/**
 * Villkoren renderas ur i18n-trädet (`legal.terms.*`). Svenska är originalet;
 * den engelska versionen visar en notis om att svenskan gäller vid tolknings-
 * tvist — annars vore översättningen ett nytt avtal i sig.
 *
 * Sektion 12 har flera stycken och en kontaktlänk och renderas därför separat.
 */
const SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export default function TermsPage() {
  const t = getT();
  const prevailing = t("legal.prevailingNotice");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">{t("legal.terms.title")}</h1>
      <p className="mt-2 text-slate-300">{t("legal.terms.intro")}</p>

      {prevailing && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          {prevailing}
        </p>
      )}

      <div className="mt-8 space-y-8 text-slate-300">
        {SECTIONS.map((n) => (
          <section key={n}>
            <h2 className="text-xl font-semibold text-slate-100">
              {t(`legal.terms.s${n}Title`)}
            </h2>
            <p className="mt-2">{t(`legal.terms.s${n}Body`)}</p>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.terms.s12Title")}
          </h2>
          <p className="mt-2">{t("legal.terms.s12Body1")}</p>
          <p className="mt-2">{t("legal.terms.s12Body2")}</p>
          <p className="mt-2">
            {t("legal.terms.s12ContactBefore")}{" "}
            <a
              href={`mailto:${MODERATION_CONTACT_EMAIL}`}
              className="underline hover:text-white"
            >
              {MODERATION_CONTACT_EMAIL}
            </a>{" "}
            {t("legal.terms.s12ContactAfter")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.terms.s13Title")}
          </h2>
          <p className="mt-2">{t("legal.terms.s13Body")}</p>
        </section>
      </div>
    </main>
  );
}
