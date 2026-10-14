import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { MODERATION_CONTACT_EMAIL } from "@/lib/moderation-shared";

/**
 * Publik sida om kontoradering. Google Play kräver en webbadress där användare
 * kan begära radering av konto och data utan att ha appen installerad
 * (Play Console → Datasäkerhet). Själva raderingen görs under Inställningar
 * (src/components/profile/account-form.tsx) — den här sidan beskriver vägen dit
 * och erbjuder mejl som alternativ.
 */
export const metadata: Metadata = {
  title: "Radera konto – AvyraCards",
  description: "Så raderar du ditt AvyraCards-konto och all tillhörande data.",
  alternates: { canonical: "/radera-konto" },
};

export default function DeleteAccountPage() {
  const t = getT();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">{t("legal.deleteAccount.title")}</h1>
      <p className="mt-2 text-slate-300">{t("legal.deleteAccount.intro")}</p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.deleteAccount.inAppTitle")}
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              <Link href="/login?callbackUrl=%2Fprofile%2Fsettings" className="underline hover:text-white">
                {t("legal.deleteAccount.step1")}
              </Link>
            </li>
            <li>{t("legal.deleteAccount.step2")}</li>
            <li>{t("legal.deleteAccount.step3")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.deleteAccount.emailTitle")}
          </h2>
          <p className="mt-2">
            {t("legal.deleteAccount.emailBefore")}{" "}
            <a href={`mailto:${MODERATION_CONTACT_EMAIL}?subject=Radera%20konto`} className="underline hover:text-white">
              {MODERATION_CONTACT_EMAIL}
            </a>{" "}
            {t("legal.deleteAccount.emailAfter")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            {t("legal.deleteAccount.whatTitle")}
          </h2>
          <p className="mt-2">{t("legal.deleteAccount.whatBody")}</p>
        </section>
      </div>
    </main>
  );
}
