export {
  locales,
  defaultLocale,
  localeLabels,
  localeFlags,
  localeTags,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./config";

export { createTranslator, type Translator, type MessageTree } from "./translate";
export { getMessages, type Messages } from "./messages";
