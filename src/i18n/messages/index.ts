import { defaultLocale, type Locale } from "../config";
import type { MessageTree } from "../translate";
import { sv } from "./sv";
import { en } from "./en";

export type { Messages } from "./types";

const bundles: Record<Locale, MessageTree> = {
  sv: sv as unknown as MessageTree,
  en: en as unknown as MessageTree,
};

export function getMessages(locale: Locale): MessageTree {
  return bundles[locale] ?? bundles[defaultLocale];
}

export { sv, en };
