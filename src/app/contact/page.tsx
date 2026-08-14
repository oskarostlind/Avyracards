import { getT } from "@/i18n/server";
import { MODERATION_CONTACT_EMAIL } from "@/lib/moderation-shared";

export default function ContactPage() {
  const t = getT();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">{t("contact.title")}</h1>
      <p className="mt-2 text-slate-300">{t("contact.intro")}</p>

      <div className="mt-8 space-y-6 rounded-2xl border border-nordic-highlight/40 bg-slate-900/40 p-6">
        <div>
          <h2 className="text-xl font-medium">{t("contact.emailTitle")}</h2>
          <p className="mt-1 text-slate-300">{t("contact.emailBody")}</p>
          <p className="mt-2">
            <a
              href={`mailto:${MODERATION_CONTACT_EMAIL}`}
              className="text-emerald-300 hover:text-emerald-200"
            >
              {MODERATION_CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium">{t("contact.supportTitle")}</h2>
          <p className="mt-1 text-slate-300">{t("contact.supportBody")}</p>
        </div>

        <div>
          <h2 className="text-xl font-medium">{t("contact.companyTitle")}</h2>
          <p className="mt-1 text-slate-300">{t("contact.companyBody")}</p>
        </div>
      </div>
    </main>
  );
}
