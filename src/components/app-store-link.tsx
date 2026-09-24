"use client";

import { useIsApp } from "@/hooks/useIsApp";
import { useT } from "@/i18n/client";
import { appStoreUrl } from "@/lib/seo";

type Props = {
  /** Kampanjkod (`ct=`) så att installationen kan härledas i App Store Connect. */
  campaign: string;
  className?: string;
  variant?: "text" | "button";
};

/**
 * Länk till iOS-appen. Döljs inuti Capacitor-appen (där är man redan i den),
 * men `useIsApp` startar som false, så länken finns alltid med i serverns HTML
 * — det är det som räknas för crawlern.
 */
export function AppStoreLink({ campaign, className = "", variant = "text" }: Props) {
  const isApp = useIsApp();
  const t = useT();

  if (isApp) return null;

  const base =
    variant === "button"
      ? "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-nordic-highlight/40 bg-slate-900/60 px-5 text-sm font-semibold text-nordic-secondary transition-colors hover:bg-slate-800 active:scale-[0.98]"
      : "inline-flex items-center gap-1.5 text-nordic-highlight transition-colors hover:text-nordic-accent";

  return (
    <a
      href={appStoreUrl(campaign)}
      target="_blank"
      rel="noopener"
      aria-label={t("seo.appStoreAria")}
      className={`${base} ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M16.365 1.43c0 1.14-.47 2.26-1.24 3.08-.83.9-2.17 1.6-3.32 1.51-.14-1.1.41-2.29 1.16-3.05.85-.88 2.3-1.53 3.4-1.54zM20.9 17.35c-.6 1.37-.88 1.98-1.65 3.19-1.07 1.68-2.58 3.78-4.45 3.79-1.66.02-2.09-1.09-4.35-1.08-2.26.01-2.73 1.1-4.4 1.08-1.87-.02-3.3-1.91-4.37-3.59C-1.1 16.1-1.42 10.55.86 7.6c1.62-2.1 4.18-3.33 6.58-3.33 2.44 0 3.98 1.34 6 1.34 1.96 0 3.16-1.34 5.99-1.34 2.13 0 4.39 1.16 6 3.17-5.27 2.89-4.42 10.41-.53 9.91z" />
      </svg>
      <span>{t("seo.appStoreCta")}</span>
    </a>
  );
}
