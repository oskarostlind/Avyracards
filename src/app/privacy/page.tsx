import { getT } from "@/i18n/server";
import { MODERATION_CONTACT_EMAIL } from "@/lib/moderation-shared";

/**
 * Se kommentaren i terms/page.tsx — samma upplägg. Sektion 5 har en
 * kontaktlänk mitt i texten och renderas därför separat.
 */
const SECTIONS_BEFORE_CONTACT = [1, 2, 3, 4] as const;
const SECTIONS_AFTER_CONTACT = [6, 7] as const;

export default function PrivacyPage() {
  const t = getT();
  const prevailing = t("legal.prevailingNotice");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">{t("legal.privacy.title")}</h1>
      <p className="mt-2 text-slate-300">{t("legal.privacy.intro")}</p>

      {prevailing && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          {prevailing}
        </p>
      )}

      <div className="mt-8 space-y-8 text-slate-300">
        {SECTIONS_BEFORE_CONTACT.map((n) => (
          <section key={n}>
            <h2 className="text-xl font-semibold text-slate-100">
              {t(`legal.privacy.s${n}Title`)}
            </h2>
            <p className="mt-2">{t(`legal.privacy.s${n}Body`)}</p>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.privacy.s5Title")}
          </h2>
          <p className="mt-2">
            {t("legal.privacy.s5BodyBefore")}{" "}
            <a
              href={`mailto:${MODERATION_CONTACT_EMAIL}`}
              className="underline hover:text-white"
            >
              {MODERATION_CONTACT_EMAIL}
            </a>{" "}
            {t("legal.privacy.s5BodyAfter")}
          </p>
        </section>

        {SECTIONS_AFTER_CONTACT.map((n) => (
          <section key={n}>
            <h2 className="text-xl font-semibold text-slate-100">
              {t(`legal.privacy.s${n}Title`)}
            </h2>
            <p className="mt-2">{t(`legal.privacy.s${n}Body`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
