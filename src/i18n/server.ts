import "server-only";

import { cookies, headers } from "next/headers";

import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  resolveLocaleFromAcceptLanguage,
  type Locale,
} from "./config";
import { getMessages } from "./messages";
import { createTranslator, type Translator } from "./translate";

/**
 * Läser språket för det aktuella anropet. Ordning:
 *   1. cookien (användarens aktiva val)
 *   2. Accept-Language (första besöket)
 *   3. svenska
 *
 * Anropet gör sidan dynamisk (cookies()/headers()). De flesta vyer är redan
 * dynamiska via `auth()`, så det kostar ingenting extra — men lägg inte in
 * det i en vy som avsiktligt ska vara statisk utan att tänka efter.
 */
export function getLocale(): Locale {
  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  try {
    return resolveLocaleFromAcceptLanguage(headers().get("accept-language"));
  } catch {
    return defaultLocale;
  }
}

/** Översättare för server-komponenter och route handlers. */
export function getT(locale?: Locale): Translator {
  const active = locale ?? getLocale();
  return createTranslator(getMessages(active), getMessages(defaultLocale), active);
}

/** Bekvämlighet när en vy behöver både språket och översättaren. */
export function getI18n(): { locale: Locale; t: Translator } {
  const locale = getLocale();
  return { locale, t: getT(locale) };
}
