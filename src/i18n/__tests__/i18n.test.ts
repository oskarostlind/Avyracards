import { describe, expect, it } from "vitest";

import { createTranslator, type MessageTree } from "@/i18n/translate";
import { sv } from "@/i18n/messages/sv";
import { en } from "@/i18n/messages/en";
import { resolveLocaleFromAcceptLanguage, isLocale, defaultLocale } from "@/i18n/config";

/** Plattar ut trädet till dot-path-nycklar. Plural ({one,other}) räknas som EN nyckel. */
function flatten(tree: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.push(path);
    } else if (
      value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).one === "string" &&
      typeof (value as Record<string, unknown>).other === "string"
    ) {
      out.push(path);
    } else if (value && typeof value === "object") {
      out.push(...flatten(value as Record<string, unknown>, path));
    }
  }
  return out;
}

describe("meddelandeträden", () => {
  it("har exakt samma nycklar på svenska och engelska", () => {
    const svKeys = flatten(sv as unknown as Record<string, unknown>).sort();
    const enKeys = flatten(en as unknown as Record<string, unknown>).sort();

    expect(enKeys.filter((k) => !svKeys.includes(k))).toEqual([]);
    expect(svKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it("saknar tomma värden", () => {
    // legal.prevailingNotice är avsiktligt tom på svenska (originalspråket) —
    // notisen ska bara synas i översättningar.
    const allowedEmpty = new Set(["legal.prevailingNotice"]);

    for (const [locale, tree] of [
      ["sv", sv],
      ["en", en],
    ] as const) {
      const t = createTranslator(tree as unknown as MessageTree);
      for (const key of flatten(tree as unknown as Record<string, unknown>)) {
        if (allowedEmpty.has(key) && locale === "sv") continue;
        expect(t(key, { count: 1 }), `${locale}:${key}`).not.toBe("");
      }
    }
  });
});

describe("createTranslator", () => {
  const messages: MessageTree = {
    hello: "Hej {name}!",
    cards: { one: "{count} kort", other: "{count} kort" },
    nested: { deep: "djupt" },
  };
  const fallback: MessageTree = { onlyInFallback: "reserv" };

  it("interpolerar parametrar", () => {
    const t = createTranslator(messages);
    expect(t("hello", { name: "Oskar" })).toBe("Hej Oskar!");
  });

  it("lämnar okända platshållare orörda", () => {
    const t = createTranslator(messages);
    expect(t("hello")).toBe("Hej {name}!");
  });

  it("väljer singular respektive plural via count", () => {
    const t = createTranslator({ item: { one: "{count} sak", other: "{count} saker" } });
    expect(t("item", { count: 1 })).toBe("1 sak");
    expect(t("item", { count: 3 })).toBe("3 saker");
  });

  it("faller tillbaka på källspråket när nyckeln saknas", () => {
    const t = createTranslator(messages, fallback);
    expect(t("onlyInFallback")).toBe("reserv");
  });

  it("returnerar nyckeln när den saknas överallt — aldrig tom sträng", () => {
    const t = createTranslator(messages, fallback);
    expect(t("finns.inte")).toBe("finns.inte");
  });
});

describe("språkdetektering", () => {
  it("känner igen giltiga språk", () => {
    expect(isLocale("sv")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("plockar bästa träff ur Accept-Language", () => {
    expect(resolveLocaleFromAcceptLanguage("en-GB,en;q=0.9,sv;q=0.8")).toBe("en");
    expect(resolveLocaleFromAcceptLanguage("sv-SE,sv;q=0.9")).toBe("sv");
  });

  it("faller tillbaka på svenska för okända språk", () => {
    expect(resolveLocaleFromAcceptLanguage("de-DE,de;q=0.9")).toBe(defaultLocale);
    expect(resolveLocaleFromAcceptLanguage(null)).toBe(defaultLocale);
  });
});
