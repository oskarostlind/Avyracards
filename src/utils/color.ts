/**
 * Små färghjälpare för länkknappar och teman.
 *
 * Ligger i utils (inte lib) eftersom de är rena funktioner utan beroenden och
 * används från både server-routes och klientkomponenter.
 */

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Sant för "#fff" och "#ffffff". Vi tillåter inte 4/8-siffriga (alfa) värden. */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/**
 * Normaliserar till gemener och 6 siffror. Returnerar null vid ogiltig indata,
 * så anropare kan skilja "ingen färg" från "trasig färg".
 */
export function normalizeHexColor(value: unknown): string | null {
  if (!isValidHexColor(value)) return null;
  const hex = value.trim().toLowerCase();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

/** Relativ luminans enligt WCAG. 0 = svart, 1 = vit. */
export function getRelativeLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return 0;

  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * Väljer svart eller vit text ovanpå en bakgrundsfärg.
 *
 * Tröskeln 0.179 är den punkt där kontrasten mot vit och mot svart är lika
 * stor enligt WCAG:s kontrastformel — enklare och mer förutsägbart än att
 * räkna ut båda kontrastkvoterna varje gång.
 */
export function getReadableTextColor(
  backgroundHex: string | null | undefined,
  fallback = "#0f172a",
): string {
  if (!backgroundHex) return fallback;
  const normalized = normalizeHexColor(backgroundHex);
  if (!normalized) return fallback;
  return getRelativeLuminance(normalized) > 0.179 ? "#0f172a" : "#ffffff";
}

/** "#8b5cf6" + 0.2 -> "rgba(139, 92, 246, 0.2)". */
export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
