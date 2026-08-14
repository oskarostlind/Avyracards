import Link from "next/link";
import { getT } from "@/i18n/server";

export default function NotFoundPage() {
  const t = getT();

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
