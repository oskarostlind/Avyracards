import Link from "next/link";

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
export function SubscriptionTerms({ price, period = "månad", viaAppStore }: Props) {
  return (
    <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-slate-400">
      <p>
        {price} per {period}. Prenumerationen förnyas automatiskt med samma belopp
        varje {period} tills du säger upp den. Beloppet dras{" "}
        {viaAppStore ? "från ditt Apple-ID" : "från ditt betalkort"} vid varje
        förnyelse.
      </p>
      <p>
        {viaAppStore ? (
          <>
            Du kan säga upp när som helst i Inställningar → ditt namn → Prenumerationer
            på din enhet, senast 24 timmar före nästa förnyelse.
          </>
        ) : (
          <>
            Du kan säga upp när som helst under Konto → Fakturering. Uppsägningen
            gäller från och med nästa faktureringsperiod.
          </>
        )}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        <Link href="/terms" className="underline hover:text-slate-200">
          Användarvillkor (EULA)
        </Link>
        <Link href="/privacy" className="underline hover:text-slate-200">
          Integritetspolicy
        </Link>
      </p>
    </div>
  );
}
