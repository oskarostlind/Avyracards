/**
 * Normalisering och validering av länk-URL:er.
 *
 * Bakgrund: formuläret krävde tidigare att användaren skrev hela adressen med
 * https://, och API:t avvisade allt annat. Folk skriver "oskarostlind.se".
 * Nu gissar vi https:// när schemat saknas, men först efter att adressen
 * validerats med `new URL()` — vi vill inte råka spara "javascript:..." eller
 * "https://javascript:alert(1)" bara för att någon klistrade in något konstigt.
 *
 * Samma modul används på båda sidor: formuläret i dashboarden och
 * route-handlern som sparar. UI-validering är bekvämlighet, inte skydd.
 */

/** Scheman som tillåts passera orörda. mailto:/tel: används av befintliga länkar. */
const PASSTHROUGH_SCHEMES = ["mailto:", "tel:"] as const;

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Plockar ut schemat, om det finns ett.
 *
 * "example.com:8080/x" matchar också SCHEME_RE, men "example.com" är en värd
 * med port — inte ett schema. Riktiga scheman innehåller inga punkter, så det
 * är den skiljelinjen vi drar.
 */
function detectScheme(value: string): string | null {
  const match = SCHEME_RE.exec(value);
  if (!match) return null;
  if (match[1].includes(".")) return null;
  return match[1];
}

export type NormalizeUrlError = "empty" | "unsupported-scheme" | "invalid";

export interface NormalizeUrlResult {
  ok: boolean;
  /** Normaliserad adress. Tom sträng när `ok` är false. */
  url: string;
  error?: NormalizeUrlError;
}

/**
 * Bästa gissning utan validering — används där vi bara ska rendera något
 * klickbart (publika profilen) och hellre visar en trasig länk än ingen alls.
 */
export function coerceUrl(input: string | null | undefined): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "";
  if (detectScheme(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Normaliserar och validerar. Regler:
 *  - whitespace trimmas
 *  - "mailto:" / "tel:" passerar orörda
 *  - "http://" / "https://" passerar orörda (men valideras)
 *  - saknas schema läggs "https://" till
 *  - andra scheman (javascript:, data:, ftp: ...) avvisas
 *  - hostname måste innehålla minst en punkt
 */
export function normalizeLinkUrl(input: string | null | undefined): NormalizeUrlResult {
  const trimmed = (input ?? "").trim();

  if (!trimmed) return { ok: false, url: "", error: "empty" };

  const lower = trimmed.toLowerCase();
  for (const scheme of PASSTHROUGH_SCHEMES) {
    if (lower.startsWith(scheme)) {
      // "mailto:" utan adress är inte en länk, bara ett schema.
      if (trimmed.length <= scheme.length) {
        return { ok: false, url: "", error: "invalid" };
      }
      return { ok: true, url: trimmed };
    }
  }

  const scheme = detectScheme(trimmed);
  if (scheme && !/^https?$/i.test(scheme)) {
    return { ok: false, url: "", error: "unsupported-scheme" };
  }

  // Mellanslag inuti adressen är nästan alltid ett klipp-och-klistra-misstag.
  // `new URL()` skulle tyst koda dem till %20 och spara något användaren
  // inte menade.
  if (/\s/.test(trimmed)) {
    return { ok: false, url: "", error: "invalid" };
  }

  const candidate = scheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, url: "", error: "invalid" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, url: "", error: "unsupported-scheme" };
  }

  const hostname = parsed.hostname;
  if (
    !hostname.includes(".") ||
    hostname.startsWith(".") ||
    hostname.endsWith(".") ||
    hostname.includes("..")
  ) {
    return { ok: false, url: "", error: "invalid" };
  }

  // Vi returnerar `candidate` och inte `parsed.href`: href lägger på ett
  // avslutande "/" på rot-URL:er, vilket ändrar det användaren skrev in.
  return { ok: true, url: candidate };
}

export function isValidLinkUrl(input: string | null | undefined): boolean {
  return normalizeLinkUrl(input).ok;
}
