import type { CSSProperties } from "react";
import type { CustomThemeSettings, ThemeMode } from "@/types/theme";

/**
 * Profilkortets yta (den frostade panelen bakom namn, knappar och länkar).
 *
 * Tidigare hårdkodad till rgba(15,23,42,0.6) + blur(16/20px) på tre ställen
 * (social, business och editorns preview). Panelen täckte då en
 * bakgrundsbild/logga nästan helt — användare med företagslogga i bakgrunden
 * ville kunna se den igenom kortet. Nu styrs täckning och oskärpa av temat.
 *
 * Saknade värden = exakt samma utseende som förut, så befintliga profiler
 * ändras inte.
 */

/** Täckning i procent (0 = helt genomskinlig, 100 = helt täckande). */
export const CARD_OPACITY_MIN = 0;
export const CARD_OPACITY_MAX = 100;
/** Oskärpa bakom kortet i px. */
export const CARD_BLUR_MIN = 0;
export const CARD_BLUR_MAX = 30;

/** Kortets grundfärg (slate-900). */
const CARD_RGB = "15, 23, 42";

/** Rörlig bakgrund: en stor backdrop-blur räknas om varje bildruta — tak här. */
const ANIMATED_BLUR_CAP = 6;

export function getDefaultCardOpacity(animated: boolean): number {
  return animated ? 78 : 60;
}

export function getDefaultCardBlur(mode: ThemeMode, animated: boolean): number {
  if (animated) return ANIMATED_BLUR_CAP;
  return mode === "BUSINESS" ? 20 : 16;
}

function clamp(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/** Effektiva värden (sparat värde eller standard), klampade. */
export function resolveCardSurface(
  settings: Pick<CustomThemeSettings, "cardOpacity" | "cardBlur">,
  opts: { mode: ThemeMode; animated: boolean },
): { opacity: number; blur: number } {
  const opacity = clamp(settings.cardOpacity, CARD_OPACITY_MIN, CARD_OPACITY_MAX) ?? getDefaultCardOpacity(opts.animated);
  let blur = clamp(settings.cardBlur, CARD_BLUR_MIN, CARD_BLUR_MAX) ?? getDefaultCardBlur(opts.mode, opts.animated);
  if (opts.animated) blur = Math.min(blur, ANIMATED_BLUR_CAP);
  return { opacity, blur };
}

/** Bakgrund + backdrop-filter för profilkortet. */
export function getCardSurfaceStyle(
  settings: Pick<CustomThemeSettings, "cardOpacity" | "cardBlur">,
  opts: { mode: ThemeMode; animated: boolean },
): CSSProperties {
  const { opacity, blur } = resolveCardSurface(settings, opts);
  const filter = blur > 0 ? `blur(${blur}px)` : "none";
  return {
    backgroundColor: `rgba(${CARD_RGB}, ${opacity / 100})`,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
  };
}
