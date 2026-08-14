"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  defaultLocale,
  localeTags,
  type Locale,
} from "./config";
import { createTranslator, type MessageTree, type Translator } from "./translate";

type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  /** BCP-47-tagg att skicka till Intl.NumberFormat / DateTimeFormat. */
  tag: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  locale: Locale;
  /** Aktivt meddelandeträd, serialiserat från servern. */
  messages: MessageTree;
  /** Svenska trädet som fallback när en engelsk nyckel saknas. */
  fallbackMessages: MessageTree;
  children: ReactNode;
};

/**
 * Servern skickar med *bara* det aktiva språkets meddelanden (plus svenska
 * som fallback) i RSC-payloaden. Alternativet — att bunta båda språken i
 * klientbundlen — hade betalat för engelska strängar hos varje svensk
 * användare, och tvärtom.
 */
export function LocaleProvider({
  locale,
  messages,
  fallbackMessages,
  children,
}: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: createTranslator(messages, fallbackMessages, locale),
      tag: localeTags[locale] ?? localeTags[defaultLocale],
    }),
    [locale, messages, fallbackMessages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useT/useLocale måste användas inuti <LocaleProvider>");
  }
  return ctx;
}

/** Översättare för klientkomponenter. */
export function useT(): Translator {
  return useLocaleContext().t;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useLocaleTag(): string {
  return useLocaleContext().tag;
}

/**
 * Byter språk. Cookien sätts från klienten (inte httpOnly — det är ett
 * preferensvärde, inget känsligt) och sidan laddas om så att server-
 * komponenterna renderas på nytt språk.
 */
export function setLocaleCookie(locale: Locale) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = [
    `${LOCALE_COOKIE}=${locale}`,
    "Path=/",
    `Max-Age=${LOCALE_COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
