import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-900/70 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-xs text-slate-300 md:flex-row md:justify-between md:text-sm">
        {/* Vänster: brand & kort text */}
        <div className="max-w-sm space-y-3">
          <div className="text-sm font-semibold text-slate-50 md:text-base">
            AvyraCards
          </div>
          <p className="text-xs text-slate-400 md:text-sm">
            Digitalt visitkort och länkprofil kopplad till NFC-kort. Byggd i
            Sverige för kreatörer, frilansare och företag.
          </p>
        </div>

        {/* Mitten: länkkolumner */}
        <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Produkt
            </div>
            <ul className="space-y-1 text-xs text-slate-300 md:text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-emerald-300">
                  Så funkar det
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-emerald-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-300">
                  Exempel-dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              För företag
            </div>
            <ul className="space-y-1 text-xs text-slate-300 md:text-sm">
              <li>
                <Link href="/#business" className="hover:text-emerald-300">
                  AvyraCards Business
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-300">
                  Kontakt & offert
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Juridik
            </div>
            <ul className="space-y-1 text-xs text-slate-300 md:text-sm">
              <li>
                <Link href="/terms" className="hover:text-emerald-300">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-300">
                  Integritetspolicy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Höger: meta / kontakt */}
        <div className="space-y-3 text-xs text-slate-400 md:text-sm md:text-right">
          <div>Ac {new Date().getFullYear()} AvyraCards.</div>
          <div>
            Frågor?{" "}
            <a
              href="mailto:kontakt@avyracards.se"
              className="text-emerald-300 hover:text-emerald-200"
            >
              kontakt@avyracards.se
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
