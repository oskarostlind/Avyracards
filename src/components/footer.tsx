"use client";

import Link from "next/link";
import { useIsApp } from "@/hooks/useIsApp";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Footer() {
  const isApp = useIsApp();
  const t = useT();

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
{t("footer.tagline")}
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              {t("footer.product")}
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-nordic-accent">
                  {t("footer.howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-nordic-accent">
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              {t("footer.forBusiness")}
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/business" className="hover:text-nordic-accent">
                  {t("footer.businessProduct")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-nordic-accent">
                  {t("footer.contactAndQuote")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-nordic-highlight">
              {t("footer.legal")}
            </div>
            <ul className="space-y-1 text-xs text-nordic-highlight md:text-sm">
              <li>
                <Link href="/report" className="hover:text-nordic-accent">
                  {t("footer.reportContent")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-nordic-accent">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-nordic-accent">
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 text-xs text-nordic-highlight md:text-sm md:text-right">
          <div className="flex md:justify-end">
            <LanguageSwitcher variant="compact" />
          </div>
          <div>AvyraCards {new Date().getFullYear()}.</div>
          <div>
            {t("footer.questions")}{" "}
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
