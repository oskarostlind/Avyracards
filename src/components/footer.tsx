"use client";

import { useIsApp } from "@/hooks/useIsApp";
import Link from "next/link";

export function Footer() {
  const isApp = useIsApp();

  if (isApp) {
    return null;
  }

  return (
    <footer className="border-t border-nordic-highlight/30 bg-nordic-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-xs text-nordic-highlight md:flex-row md:justify-between md:text-sm">
        <div className="max-w-sm space-y-3">
          <div className="text-sm font-semibold text-nordic-secondary md:text-base">
            AvyraCards
          </div>
          <p className="text-xs text-nordic-highlight md:text-sm">
            Digitalt visitkort och länkprofil kopplad till NFC-kort. Byggd i
            Sverige för kreatörer, frilansare och företag.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              Produkt
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-nordic-accent">
                  Så funkar det
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-nordic-accent">
                  FAQ
                </Link>
              </li>
              {/*<li>
                <Link href="/dashboard" className="hover:text-nordic-accent">
                  Exempel-dashboard
                </Link>
              </li>*/}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              För företag
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/business" className="hover:text-nordic-accent">
                  AvyraCards Business
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-nordic-accent">
                  Kontakt & offert
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              Juridik
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/terms" className="hover:text-nordic-accent">
                  Användarvillkor
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-nordic-accent">
                  Integritetspolicy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 text-xs text-nordic-highlight md:text-sm md:text-right">
          <div>AvyraCards {new Date().getFullYear()}.</div>
          <div>
            Frågor?{" "}
            <a
              href="mailto:kontakt@avyracards.se"
              className="text-nordic-accent hover:text-nordic-accent/80"
            >
              kontakt@avyracards.se
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
