import type { Locale } from "./config";

/**
 * Minimal översättningsmotor. Ingen extern dependency — appen byggs på
 * Appflow med snålt minne och `ignoreBuildErrors`, så varje ny runtime-
 * dependency är en risk vi inte behöver ta för ren nyckel-uppslagning.
 *
 * Stödjer:
 *   t("nav.dashboard")                       → "Dashboard"
 *   t("links.count", { count: 3 })           → interpolerar {count}
 *   t("links.count", { count: 3 })           → plural om nyckeln är { one, other }
 */

export type MessageNode = string | { one: string; other: string } | { [key: string]: MessageNode };

export type MessageTree = { [key: string]: MessageNode };

export type TranslateParams = Record<string, string | number>;

function lookup(tree: MessageTree, key: string): MessageNode | undefined {
  let node: MessageNode | undefined = tree;
  for (const segment of key.split(".")) {
    if (node === undefined || typeof node === "string") return undefined;
    node = (node as Record<string, MessageNode>)[segment];
  }
  return node;
}

function isPlural(node: MessageNode): node is { one: string; other: string } {
  return (
    typeof node === "object" &&
    node !== null &&
    typeof (node as Record<string, unknown>).one === "string" &&
    typeof (node as Record<string, unknown>).other === "string"
  );
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export type Translator = (key: string, params?: TranslateParams) => string;

/**
 * `fallback` är alltid svenska meddelandeträdet. Saknas en nyckel i engelska
 * visas svenskan i stället för en tom sträng eller själva nyckeln — en
 * halvöversatt vy är bättre än en trasig.
 */
export function createTranslator(
  messages: MessageTree,
  fallback?: MessageTree,
  locale?: Locale,
): Translator {
  return function t(key: string, params?: TranslateParams): string {
    let node = lookup(messages, key);
    if (node === undefined && fallback) node = lookup(fallback, key);

    if (node === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Saknad nyckel "${key}" (${locale ?? "?"})`);
      }
      return key;
    }

    if (isPlural(node)) {
      const count = Number(params?.count ?? 0);
      return interpolate(count === 1 ? node.one : node.other, params);
    }

    if (typeof node !== "string") {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Nyckeln "${key}" pekar på en grupp, inte en sträng`);
      }
      return key;
    }

    return interpolate(node, params);
  };
}
