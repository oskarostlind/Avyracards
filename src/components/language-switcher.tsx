"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { locales, localeFlags, localeLabels, type Locale } from "@/i18n";
import { setLocaleCookie, useLocale, useT } from "@/i18n/client";

type Variant = "card" | "compact";

/**
 * Byter språk genom att skriva cookien och sedan `router.refresh()`.
 * Refresh (inte reload) räcker: server-komponenterna renderas om med det nya
 * språket och klientstate — t.ex. ett halvifyllt formulär — överlever.
 */
export function LanguageSwitcher({ variant = "card" }: { variant?: Variant }) {
  const t = useT();
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const select = (locale: Locale) => {
    if (locale === active) return;
    setLocaleCookie(locale);
    startTransition(() => router.refresh());
  };

  if (variant === "compact") {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-full border border-nordic-highlight/20 bg-white/5 p-1"
        role="group"
        aria-label={t("language.ariaLabel")}
      >
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => select(locale)}
            disabled={pending}
            aria-pressed={locale === active}
            title={t("language.switchTo", { language: localeLabels[locale] })}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
              locale === active
                ? "bg-nordic-secondary text-nordic-primary"
                : "text-nordic-highlight hover:text-nordic-secondary"
            }`}
          >
            <span aria-hidden="true" className="mr-1">
              {localeFlags[locale]}
            </span>
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-nordic-accent" />
        <h3 className="text-sm font-semibold text-nordic-secondary">{t("language.label")}</h3>
      </div>
      <p className="text-xs text-nordic-highlight">{t("language.description")}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {locales.map((locale) => {
          const isActive = locale === active;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => select(locale)}
              disabled={pending}
              aria-pressed={isActive}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all disabled:opacity-50 ${
                isActive
                  ? "border-nordic-accent/40 bg-nordic-accent/10 text-nordic-accent"
                  : "border-nordic-highlight/20 bg-white/5 text-nordic-secondary hover:border-nordic-highlight/40"
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{localeFlags[locale]}</span>
                {localeLabels[locale]}
              </span>
              {isActive && <Check size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
