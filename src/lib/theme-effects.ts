/**
 * Rena hjälpare för ramar, namneffekter och bakgrundsmönster.
 *
 * Ligger utanför komponenterna så att publik profil, editorns preview och
 * miniatyrerna i temaeditorn räknar fram exakt samma värden — och så att de
 * går att testa utan DOM.
 */

import {
  ANIMATED_FRAME_STYLES,
  BACKGROUND_PATTERNS,
  PATTERN_OPACITY_DEFAULT,
  type AnimatedFrameStyle,
  type BackgroundPattern,
  type CustomThemeSettings,
  type FrameStyle,
} from "@/types/theme";
import { clampPatternOpacity } from "@/lib/feature-access";
import { normalizeHexColor } from "@/utils/color";

export function isAnimatedFrame(frame: FrameStyle | undefined): frame is AnimatedFrameStyle {
  return !!frame && (ANIMATED_FRAME_STYLES as readonly string[]).includes(frame);
}

function toRgb(hex: string): [number, number, number] {
  const n = normalizeHexColor(hex) ?? "#8b5cf6";
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

/** Linjär blandning av två hexfärger. t=0 -> a, t=1 -> b. Ogiltig indata -> standardaccent. */
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const k = Math.min(1, Math.max(0, t));
  const c = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Säker accentfärg (hex) — faller tillbaka på standardlila. */
export function safeAccent(accent: string | undefined | null): string {
  return normalizeHexColor(accent) ?? "#8b5cf6";
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export interface PatternBackground {
  backgroundImage: string;
  backgroundSize: string;
}

/**
 * Mönstret som en bakgrundsbild (SVG-data-URI) med färg och opacitet inbakade.
 *
 * Varför inbakat i stället för mask-image + opacity på ett lager: då kan samma
 * värde både läggas som eget lager på publika profilen och staplas som extra
 * bakgrundslager i editorns preview (som är sin egen scrollcontainer).
 * Statiskt — mönster animeras aldrig.
 */
export function getPatternBackground(
  pattern: BackgroundPattern | undefined,
  color: string | undefined,
  opacityPct: number | undefined,
): PatternBackground | null {
  if (!pattern || pattern === "none" || !(BACKGROUND_PATTERNS as readonly string[]).includes(pattern)) return null;
  const a = clampPatternOpacity(opacityPct ?? PATTERN_OPACITY_DEFAULT) / 100;
  if (a <= 0) return null;
  const c = normalizeHexColor(color) ?? "#ffffff";
  const f = a.toFixed(3);

  switch (pattern) {
    case "dots":
      return {
        backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18'><circle cx='9' cy='9' r='1.4' fill='${c}' fill-opacity='${f}'/></svg>`),
        backgroundSize: "18px 18px",
      };
    case "grid":
      return {
        backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><path d='M28 .5H.5V28' fill='none' stroke='${c}' stroke-opacity='${f}'/></svg>`),
        backgroundSize: "28px 28px",
      };
    case "diagonal":
      return {
        backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'><path d='M-1 1l2-2M0 14L14 0M13 15l2-2' stroke='${c}' stroke-opacity='${f}'/></svg>`),
        backgroundSize: "14px 14px",
      };
    case "waves":
      return {
        backgroundImage: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='16'><path d='M0 8Q15 1 30 8T60 8' fill='none' stroke='${c}' stroke-opacity='${f}' stroke-width='1.2'/></svg>`),
        backgroundSize: "60px 16px",
      };
    case "grain": {
      // Brus: färgens RGB, alfa ur brusets röda kanal med kontrast (glesa korn).
      const [r, g, b] = toRgb(c).map((v) => (v / 255).toFixed(3));
      const k = (2.4 * a).toFixed(3);
      const m = (-1.0 * a).toFixed(3);
      return {
        backgroundImage: svgUrl(
          `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${k} 0 0 0 ${m}'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
        ),
        backgroundSize: "160px 160px",
      };
    }
    default:
      return null;
  }
}

/**
 * Bilden för det överdimensionerade, drivande gradientlagret: temats
 * gradient i botten och två mjuka färgmoln (från/till + accent) ovanpå, så
 * att rörelsen syns även när från- och tillfärg ligger nära varandra.
 */
export function getAnimatedGradientImage(
  settings: Pick<CustomThemeSettings, "gradientDir" | "gradientFrom" | "gradientTo" | "accentColor">,
): string {
  const from = safeAccent(settings.gradientFrom ?? "#4f46e5");
  const to = safeAccent(settings.gradientTo ?? "#0f172a");
  const accent = safeAccent(settings.accentColor);
  const glowA = mixHex(from, "#ffffff", 0.15);
  const glowB = mixHex(accent, to, 0.35);
  return [
    `radial-gradient(40% 35% at 28% 30%, ${glowA}cc 0%, ${glowA}00 100%)`,
    `radial-gradient(38% 32% at 72% 68%, ${glowB}b3 0%, ${glowB}00 100%)`,
    `linear-gradient(${settings.gradientDir || "to bottom right"}, ${from}, ${to})`,
  ].join(", ");
}
