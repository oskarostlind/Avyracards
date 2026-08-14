"use client";

import Link from "next/link";
import { useT } from "@/i18n/client";

interface Props {
  /** Formaterat pris, t.ex. "49 kr". */
  price: string;
  /** Faktureringsperiod i klartext, t.ex. "månad". */
  period?: string;
  /** true när köpet går via App Store (IAP) i stället för Stripe. */
  viaAppStore?: boolean;
}

/**
 * Guideline 3.1.2(c): paywallen måste — innan köpet — visa faktiskt belopp,
 * period, att prenumerationen förnyas automatiskt tills den sägs upp, hur man
 * säger upp, samt länkar till villkor (EULA) och integritetspolicy.
 * Att bara visa "49 kr/mån" räcker inte; det är den vanligaste
 * prenumerationsrelaterade avslagsorsaken.
 */
export function SubscriptionTerms({ price, period, viaAppStore }: Props) {
  const t = useT();
  const resolvedPeriod = period ?? t("checkout.terms.periodMonth");

  return (
    <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-slate-400">
      <p>
        {t("checkout.terms.body", {
          price,
          period: resolvedPeriod,
          source: viaAppStore
            ? t("checkout.terms.sourceAppStore")
            : t("checkout.terms.sourceCard"),
        })}
      </p>
      <p>
        {viaAppStore ? t("checkout.terms.cancelAppStore") : t("checkout.terms.cancelWeb")}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        <Link href="/terms" className="underline hover:text-slate-200">
          {t("checkout.terms.eula")}
        </Link>
        <Link href="/privacy" className="underline hover:text-slate-200">
          {t("checkout.terms.privacy")}
        </Link>
      </p>
    </div>
  );
}
