"use client";

import Link from "next/link";

import { useT } from "@/i18n/client";

/**
 * Klientkomponent med flit: `app/not-found.tsx` renderas för allt som inte
 * matchar en route, och Next vill helst prerendera den. `getT()` läser
 * språkcookien och hade tvingat sidan att bli dynamisk. LocaleProvider ligger
 * i rot-layouten, så useT() fungerar här ändå.
 */
export default function NotFoundPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">{t("notFound.title")}</h1>
      <p className="text-slate-600">{t("notFound.body")}</p>
      <Link href="/" className="rounded-full bg-slate-900 px-6 py-2 text-nordic-secondary hover:bg-slate-700">
        {t("notFound.cta")}
      </Link>
    </div>
  );
}
