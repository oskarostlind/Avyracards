import type { CSSProperties } from "react";

import type { ButtonStyle, ButtonVariant, CustomThemeSettings } from "@/types/theme";
import { getReadableTextColor, getRelativeLuminance, hexToRgba, normalizeHexColor } from "@/utils/color";

/**
 * EN källa för hur en länkknapp ser ut.
 *
 * Tidigare fanns samma knapplogik i tre renderare (social-profile,
 * business-profile, profile-preview) plus två miniatyrer i temaeditorn — och
 * de hade glidit isär (olika radie för "rounded", olika brutal-skugga, "soft"
 * som bara var solid med opacity 0.9). Resultatet var att editorns preview
 * inte stämde med den publika profilen och att varianterna såg likadana ut.
 *
 * Allt som påverkar knappens utseende ska räknas ut HÄR. Renderarna lägger
 * bara på layout (padding, flex, typsnittsstorlek).
 *
 * Filen importeras även av feature-access (servern), så den får inte dra in
 * något klientberoende — bara typer och rena färgfunktioner.
 */

/* -------------------------------------------------------------------------- */
/*  Kända värden (vitlista)                                                   */
/* -------------------------------------------------------------------------- */

export const BUTTON_STYLES: readonly ButtonStyle[] = ["rounded", "pill", "sharp", "brutal"];

/**
 * Ordningen här är ordningen i editorns rutnät: gratis först, premium sist.
 * Id:n får aldrig döpas om — de ligger sparade i användarnas temajson.
 */
export const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  "solid",
  "outline",
  "soft",
  "pressed",
  "shadow",
  "ghost",
  "underline",
  "gradient",
  "glass",
  "neon",
  "metallic",
];

export const BUTTON_BORDER_WIDTH_MIN = 0;
export const BUTTON_BORDER_WIDTH_MAX = 4;

export function isButtonStyle(value: unknown): value is ButtonStyle {
  return typeof value === "string" && (BUTTON_STYLES as readonly string[]).includes(value);
}

export function isButtonVariant(value: unknown): value is ButtonVariant {
  return typeof value === "string" && (BUTTON_VARIANTS as readonly string[]).includes(value);
}

/**
 * Tal eller numerisk sträng -> heltal 0–4. null om värdet inte går att tolka,
 * så att anroparen kan skilja "inget värde" från "0 = ingen kant".
 */
export function clampButtonBorderWidth(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(BUTTON_BORDER_WIDTH_MAX, Math.max(BUTTON_BORDER_WIDTH_MIN, Math.round(n)));
}

/* -------------------------------------------------------------------------- */
/*  Färghjälpare (privata — bara knapparna behöver dem)                       */
/* -------------------------------------------------------------------------- */

const DARK_TEXT = "#0f172a";
const LIGHT_TEXT = "#ffffff";

function contrastRatio(a: string, b: string): number {
  const la = getRelativeLuminance(a);
  const lb = getRelativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Blanda två hexfärger. t = 0 -> a, t = 1 -> b. */
function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return toHex(out[0], out[1], out[2]);
}

function parseHex(hex: string): [number, number, number] {
  const n = normalizeHexColor(hex) ?? "#000000";
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Vrid kulören. Används för gradientens andra stopp så att den blir en
 * släktfärg till accenten i stället för en godtycklig andrafärg.
 * Returnerar null för nästan gråa färger — där ger en vridning ingenting.
 */
function shiftHue(hex: string, degrees: number): string | null {
  const [r, g, b] = parseHex(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.08) return null;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + degrees + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex(Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255));
}

/**
 * Mörk eller ljus text — den som har bäst SÄMSTA kontrast mot alla färger
 * knappytan passerar (en gradient har flera).
 */
export function pickReadableText(backgrounds: string[]): string {
  const worst = (text: string) => Math.min(...backgrounds.map((bg) => contrastRatio(text, bg)));
  return worst(LIGHT_TEXT) >= worst(DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

/** Sidans bakgrundsfärger, om de går att veta (inte för bilder). */
function pageBackgrounds(settings: Partial<CustomThemeSettings>): string[] | null {
  if (settings.backgroundType === "image") return null;
  if (settings.backgroundType === "gradient") {
    const list = [settings.gradientFrom, settings.gradientTo]
      .map((c) => normalizeHexColor(c))
      .filter((c): c is string => Boolean(c));
    return list.length ? list : null;
  }
  const solid = normalizeHexColor(settings.backgroundColor);
  return solid ? [solid] : null;
}

/* -------------------------------------------------------------------------- */
/*  Stil                                                                      */
/* -------------------------------------------------------------------------- */

export interface LinkButtonStyleOptions {
  /** "Spara kontakt"-knappen: inverterad (sidans textfärg som bakgrund). */
  isPrimary?: boolean;
  /** Per-länk-färg (premium, Link.customColor). Ersätter accenten för just den knappen. */
  customColor?: string | null;
  /**
   * Skala för miniatyrer i editorn (radie, skuggor, kantbredd). 1 = riktig knapp.
   * Miniatyrer får också en synlig streckad kontur för "ghost", annars syns inget.
   */
  scale?: number;
}

export interface LinkButtonAppearance {
  style: CSSProperties;
  /** Tailwind-klasser för tryckåterkoppling och tillgänglighetsfall. */
  className: string;
}

/**
 * Tryck-återkoppling enligt Apple: reagera på pointer-down, 100 ms, bara
 * transform/opacity. Med reducerad rörelse byts skalningen mot en
 * opacitetsförändring — återkoppling ska finnas kvar, rörelse inte.
 */
export const BUTTON_INTERACTION_CLASS =
  "transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-70";

/** Glas utan transparens (systeminställning) -> solid yta med samma kontrast. */
const GLASS_REDUCED_TRANSPARENCY_CLASS =
  "[@media(prefers-reduced-transparency:reduce)]:![backdrop-filter:none] [@media(prefers-reduced-transparency:reduce)]:![-webkit-backdrop-filter:none] [@media(prefers-reduced-transparency:reduce)]:![background-color:var(--avy-btn-solid)]";

/** 3D-knappen trycks ner: kanten krymper och knappen flyttas lika mycket. */
const PRESSED_CLASS =
  "active:translate-y-[3px] active:![box-shadow:0_1px_0_var(--avy-btn-edge)] motion-reduce:active:translate-y-0";

type CssVars = CSSProperties & Record<`--${string}`, string>;

/** Standardkantens bredd för en variant — visas i editorns reglage när inget eget värde finns. */
export function getDefaultButtonBorderWidth(variant?: ButtonVariant, shape?: ButtonStyle): number {
  switch (variant) {
    case "outline":
    case "underline":
      return 2;
    case "glass":
    case "soft":
    case "metallic":
      return 1;
    case "neon":
      return 2;
    default:
      return shape === "brutal" ? 2 : 0;
  }
}

export function getLinkButtonAppearance(
  settings: Partial<CustomThemeSettings>,
  options: LinkButtonStyleOptions = {},
): LinkButtonAppearance {
  const { isPrimary = false, scale = 1 } = options;
  const mini = scale !== 1;
  const px = (n: number) => `${Math.round(n * scale * 10) / 10}px`;
  const line = (n: number) => (n <= 0 ? 0 : Math.max(1, Math.round(n * scale)));

  const shape: ButtonStyle = isButtonStyle(settings.buttonStyle) ? settings.buttonStyle : "rounded";
  const variant: ButtonVariant = isButtonVariant(settings.buttonVariant) ? settings.buttonVariant : "solid";

  const pageTextRaw = settings.textColor || "#f8fafc";
  const pageText = normalizeHexColor(pageTextRaw) ?? "#f8fafc";
  const custom = normalizeHexColor(options.customColor);
  const accent = custom ?? normalizeHexColor(settings.accentColor) ?? "#8b5cf6";

  const buttonText = normalizeHexColor(settings.buttonTextColor);
  const borderColorSetting = normalizeHexColor(settings.buttonBorderColor);
  const shadowColor = normalizeHexColor(settings.buttonShadowColor);
  const borderWidthSetting = clampButtonBorderWidth(settings.buttonBorderWidth);

  const radius =
    shape === "pill" ? "9999px" : shape === "sharp" ? "0px" : shape === "brutal" ? px(4) : px(12);

  const style: CssVars = { borderRadius: radius };
  const classes: string[] = [BUTTON_INTERACTION_CLASS];

  // --- Primärknapp ("Spara kontakt") -------------------------------------
  // Samma inverterade look som tidigare i alla tre renderarna. Vi rör bara
  // textfärgen om den annars hade blivit i praktiken osynlig.
  if (isPrimary) {
    let color = accent === "#ffffff" ? DARK_TEXT : accent;
    if (contrastRatio(color, pageText) < 2) color = pickReadableText([pageText]);
    style.backgroundColor = pageTextRaw;
    style.color = color;
    if (shape === "brutal") {
      style.border = `${line(2)}px solid ${pageTextRaw}`;
      style.boxShadow = `${px(4)} ${px(4)} 0 0 ${shadowColor ?? pageTextRaw}`;
    }
    return { style, className: classes.join(" ") };
  }

  // --- Varianter ------------------------------------------------------------
  // Varje gren sätter bakgrund, textfärg, standardkant och ev. egna skuggor.
  // `ownsShadow` = varianten ÄR sin skugga (glöd, 3D-kant) — då lägger vi
  // inte på brutal-/drop-skugga ovanpå.
  let textColor: string = pageTextRaw;
  let border: { width: number; color: string; side: "all" | "bottom" } | null = null;
  const decor: string[] = []; // inset-högdagrar som alltid ligger kvar
  let ownShadow: string | null = null;

  switch (variant) {
    case "outline":
      style.backgroundColor = "transparent";
      textColor = accent;
      border = { width: 2, color: accent, side: "all" };
      break;

    case "soft": {
      // Tonad yta i accentfärg + accentfärgad text. Tidigare var "soft" solid
      // med opacity 0.9 och gick inte att skilja från "solid".
      style.backgroundColor = hexToRgba(accent, 0.16);
      border = { width: 1, color: hexToRgba(accent, 0.28), side: "all" };
      const bgs = pageBackgrounds(settings);
      const accentReadable = bgs !== null && Math.min(...bgs.map((bg) => contrastRatio(accent, bg))) >= 3;
      textColor = accentReadable ? accent : pageTextRaw;
      break;
    }

    case "glass": {
      const tint = custom ? hexToRgba(custom, 0.18) : "rgba(255,255,255,0.15)";
      style.backgroundColor = tint;
      style.backdropFilter = "blur(10px)";
      style.WebkitBackdropFilter = "blur(10px)";
      border = { width: 1, color: custom ? hexToRgba(custom, 0.45) : "rgba(255,255,255,0.25)", side: "all" };
      decor.push("inset 0 1px 0 rgba(255,255,255,0.25)");
      style["--avy-btn-solid"] = custom ?? (getRelativeLuminance(pageText) > 0.5 ? "#1e293b" : "#f1f5f9");
      classes.push(GLASS_REDUCED_TRANSPARENCY_CLASS);
      break;
    }

    case "ghost":
      style.backgroundColor = "transparent";
      textColor = custom ?? pageTextRaw;
      // Miniatyr: utan kontur syns knappen inte alls i rutan.
      if (mini) border = { width: 1, color: hexToRgba(pageText, 0.35), side: "all" };
      if (mini) style.borderStyle = "dashed";
      break;

    case "shadow":
      style.backgroundColor = accent;
      textColor = custom ? getReadableTextColor(accent) : pageTextRaw;
      ownShadow = `0 ${px(10)} ${px(24)} ${px(-6)} ${hexToRgba(shadowColor ?? accent, 0.55)}`;
      break;

    case "gradient": {
      const second = shiftHue(accent, 40) ?? mix(accent, "#000000", 0.35);
      style.backgroundColor = accent;
      style.backgroundImage = `linear-gradient(135deg, ${accent} 0%, ${second} 100%)`;
      textColor = pickReadableText([accent, second]);
      break;
    }

    case "neon":
      style.backgroundColor = hexToRgba(accent, 0.08);
      border = { width: 2, color: accent, side: "all" };
      textColor = mix(accent, "#ffffff", 0.35);
      style.textShadow = `0 0 ${px(8)} ${hexToRgba(accent, 0.8)}`;
      ownShadow = [
        `0 0 ${px(14)} ${hexToRgba(shadowColor ?? accent, 0.6)}`,
        `inset 0 0 ${px(10)} ${hexToRgba(shadowColor ?? accent, 0.35)}`,
      ].join(", ");
      break;

    case "pressed": {
      const edge = shadowColor ?? mix(accent, "#000000", 0.35);
      style.backgroundColor = accent;
      textColor = pickReadableText([accent]);
      ownShadow = `0 ${px(4)} 0 ${edge}`;
      style["--avy-btn-edge"] = edge;
      if (!mini) classes.push(PRESSED_CLASS);
      break;
    }

    case "metallic": {
      // Borstad metall: ljus topp, hård mittlinje, bakgrundsrillor.
      const light = mix(accent, "#ffffff", 0.55);
      const dark = mix(accent, "#000000", 0.22);
      const mid = mix(accent, "#ffffff", 0.12);
      style.backgroundColor = accent;
      style.backgroundImage = [
        `repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, rgba(0,0,0,0.04) 1px 3px)`,
        `linear-gradient(180deg, ${light} 0%, ${accent} 48%, ${dark} 52%, ${mid} 100%)`,
      ].join(", ");
      textColor = pickReadableText([light, accent, dark]);
      border = { width: 1, color: mix(accent, "#000000", 0.3), side: "all" };
      decor.push("inset 0 1px 0 rgba(255,255,255,0.7)", "inset 0 -1px 0 rgba(0,0,0,0.2)");
      style.textShadow =
        textColor === LIGHT_TEXT ? "0 1px 0 rgba(0,0,0,0.35)" : "0 1px 0 rgba(255,255,255,0.45)";
      break;
    }

    case "underline":
      // Minimal: ingen yta, bara en linje under hela raden. Radien nollas —
      // en rundad underkant ser ut som ett fel, inte som ett val.
      style.backgroundColor = "transparent";
      style.borderRadius = "0px";
      textColor = pageTextRaw;
      border = { width: 2, color: accent, side: "bottom" };
      ownShadow = "";
      break;

    case "solid":
    default:
      style.backgroundColor = accent;
      // Befintliga teman: sidans textfärg, precis som förut. Med per-länk-färg
      // väljer vi läsbar text (Snapchat-gult ska få svart text).
      textColor = custom ? getReadableTextColor(accent) : pageTextRaw;
      break;
  }

  style.color = buttonText ?? textColor;

  // --- Kant -----------------------------------------------------------------
  // Egen bredd/färg (Avancerat) vinner över variantens standard. Brutal utan
  // egen kant från varianten får den klassiska tjocka kanten i textfärg.
  if (!border && shape === "brutal" && variant !== "ghost") {
    border = { width: 2, color: pageTextRaw, side: "all" };
  }
  const borderWidth = borderWidthSetting ?? border?.width ?? 0;
  const borderColor = borderColorSetting ?? border?.color ?? accent;
  const borderSide = border?.side ?? "all";
  if (borderWidth > 0) {
    const value = `${line(borderWidth)}px ${style.borderStyle ?? "solid"} ${borderColor}`;
    delete style.borderStyle;
    if (borderSide === "bottom") style.borderBottom = value;
    else style.border = value;
  } else {
    delete style.borderStyle;
  }

  // --- Skugga ---------------------------------------------------------------
  const shadows = [...decor];
  if (ownShadow !== null) {
    if (ownShadow) shadows.unshift(ownShadow);
  } else if (shape === "brutal") {
    shadows.unshift(`${px(4)} ${px(4)} 0 0 ${shadowColor ?? pageTextRaw}`);
  } else if (settings.buttonShadow) {
    shadows.unshift(
      shadowColor
        ? `0 ${px(10)} ${px(15)} ${px(-3)} ${hexToRgba(shadowColor, 0.35)}`
        : `0 ${px(10)} ${px(15)} ${px(-3)} rgba(0, 0, 0, 0.1), 0 ${px(4)} ${px(6)} ${px(-2)} rgba(0, 0, 0, 0.05)`,
    );
  }
  if (shadows.length) style.boxShadow = shadows.join(", ");

  return { style, className: classes.join(" ") };
}

/**
 * Klassiska teman (utan CustomThemeSettings) har sina knappar i Tailwind-
 * klasser. En per-länk-färg ska ändå slå igenom där — som fylld knapp med
 * läsbar text, precis som applyCustomLinkColor gjorde tidigare.
 */
export function getClassicLinkColorStyle(customColor: string | null | undefined): CSSProperties {
  const color = normalizeHexColor(customColor);
  if (!color) return {};
  return { backgroundColor: color, color: getReadableTextColor(color) };
}
