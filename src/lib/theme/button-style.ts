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
  "liquid",
  "holo",
  "sticker",
  "pixel",
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

/** Profilkortets färg (samma i social-profile, business-profile och profile-preview). */
const PROFILE_CARD_RGB = "#0f172a";

/**
 * Färgerna som faktiskt ligger BAKOM knapparna. Länkarna står inte på sidans
 * bakgrund utan på profilkortet — slate-900 med 60 % täckning (78 % med
 * rörlig bakgrund) ovanpå sidan. En "ljus" sida (#f5f5f4) blir alltså grå
 * (#6a6f78) under knapparna, och det är mot DEN ytan texten ska vara läsbar.
 *
 * Bildbakgrund: okänd, så vi returnerar ytterlighetsfallen (svart resp. vit
 * bild under kortet) — texten väljs så att den klarar båda.
 */
/** Varianter där texten i praktiken står på ytan bakom knappen. */
const TRANSLUCENT_VARIANTS: ReadonlySet<string> = new Set([
  "outline", "ghost", "underline", "neon", "glass", "liquid", "soft",
]);

export function getButtonBackdropColors(settings: Partial<CustomThemeSettings>): string[] {
  const cover = settings.backgroundAnimated ? 0.78 : 0.6;
  const under = (bg: string) => mix(bg, PROFILE_CARD_RGB, cover);
  if (settings.backgroundType === "image") return [under("#000000"), under("#ffffff")];
  if (settings.backgroundType === "gradient") {
    const list = [settings.gradientFrom, settings.gradientTo]
      .map((c) => normalizeHexColor(c))
      .filter((c): c is string => Boolean(c));
    if (list.length) return list.map(under);
  }
  const solid = normalizeHexColor(settings.backgroundColor);
  return [under(solid ?? "#0f172a")];
}

/** Är ytan bakom knapparna ljus? (Sällsynt — kortet mörkar ner — men ljusa accenter/bilder finns.) */
function isLightSurface(bgs: string[]): boolean {
  return bgs.reduce((sum, bg) => sum + getRelativeLuminance(bg), 0) / bgs.length > 0.3;
}

/**
 * Skjut en färg mot svart eller vitt (det håll som hjälper) tills den har
 * minst `min` i kontrast mot ALLA bakgrunderna. Behåller kulören så långt det
 * går — neon ska fortfarande se ut som accentfärgen, bara mörkare på ljus sida.
 */
export function ensureContrast(color: string, backgrounds: string[], min = 4.5): string {
  const worst = (c: string) => Math.min(...backgrounds.map((bg) => contrastRatio(c, bg)));
  if (!backgrounds.length || worst(color) >= min) return color;
  const avgBg = backgrounds.reduce((sum, bg) => sum + getRelativeLuminance(bg), 0) / backgrounds.length;
  const target = avgBg > 0.18 ? "#000000" : "#ffffff";
  for (let t = 0.1; t < 1; t += 0.1) {
    const candidate = mix(color, target, t);
    if (worst(candidate) >= min) return candidate;
  }
  return pickReadableText(backgrounds);
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

/**
 * 3D-knappen trycks ner: hela "sidan" försvinner och knappen flyttas exakt
 * lika mycket — ser ut som att den sjunker in, utan layoutförskjutning.
 * Reducerad rörelse: ingen förflyttning, sidan krymper bara (färgbyte).
 */
const PRESSED_CLASS =
  "active:translate-y-[5px] active:![box-shadow:0_0_0_var(--avy-btn-edge)] motion-reduce:active:translate-y-0";

/** Skugga: svävar en aning, landar vid tryck. */
const FLOAT_CLASS = "-translate-y-[2px] active:translate-y-0 motion-reduce:translate-y-0";

/** Pixel: trycket flyttar knappen in mot sin pixelskugga. */
const PIXEL_CLASS = "active:translate-x-[2px] active:translate-y-[2px] motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0";

/** Varianter med pseudo-element — reglerna ligger i src/styles/button-variants.css. */
const FX_CLASS = "avy-btn-fx";

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
    case "sticker":
      return 3;
    case "holo":
      return 1;
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

  const bgs = getButtonBackdropColors(settings);
  const lightPage = isLightSurface(bgs);
  /** Text som står direkt på ytan bakom knappen (genomskinliga varianter). */
  const onBackdrop = (color: string, min = 4.5) => ensureContrast(color, bgs, min);

  switch (variant) {
    case "outline":
      style.backgroundColor = "transparent";
      // Accentfärgen som text rakt på sidan — mörkas/ljusas bara om den annars blir oläslig.
      textColor = onBackdrop(accent);
      border = { width: 2, color: accent, side: "all" };
      break;

    case "soft": {
      // Tonad yta i accentfärg + accentfärgad text. Tidigare var "soft" solid
      // med opacity 0.9 och gick inte att skilja från "solid".
      style.backgroundColor = hexToRgba(accent, 0.16);
      border = { width: 1, color: hexToRgba(accent, 0.28), side: "all" };
      // Ytan = kortet tonat med 16 % accent. Accentfärgad text om den går att
      // läsa, annars accenten mörkad/ljusad tills den gör det.
      textColor = ensureContrast(accent, bgs.map((bg) => mix(bg, accent, 0.16)));
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
      textColor = onBackdrop(pageText);
      classes.push(GLASS_REDUCED_TRANSPARENCY_CLASS);
      break;
    }

    case "ghost":
      style.backgroundColor = "transparent";
      textColor = onBackdrop(custom ?? pageText);
      // Miniatyr: utan kontur syns knappen inte alls i rutan.
      if (mini) border = { width: 1, color: hexToRgba(pageText, 0.35), side: "all" };
      if (mini) style.borderStyle = "dashed";
      break;

    case "shadow": {
      // Svävande: ingen kant, stor mjuk skugga i knappens egen färg och ett
      // litet lyft. Skuggan är det som skiljer den från "Fylld" — därför är
      // den generös (syns även i miniatyren).
      const glow = shadowColor ?? accent;
      style.backgroundColor = accent;
      textColor = custom ? getReadableTextColor(accent) : pageTextRaw;
      ownShadow = [
        `0 ${px(18)} ${px(34)} ${px(-10)} ${hexToRgba(glow, 0.75)}`,
        `0 ${px(6)} ${px(14)} ${px(-6)} ${hexToRgba(glow, 0.5)}`,
      ].join(", ");
      if (!mini) classes.push(FLOAT_CLASS);
      break;
    }

    case "gradient": {
      // Två tydligt olika färger i ~115°, plus en blank topp och en ljus
      // högdagerlinje — ska aldrig kunna tas för en fylld knapp.
      // Texten väljs ur accenten; ändstoppen justeras sedan så att de också
      // bär texten (en vriden kulör kan annars bli för ljus/mörk).
      textColor = pickReadableText([accent]);
      const from = ensureContrast(shiftHue(accent, -25) ?? mix(accent, "#ffffff", 0.25), [textColor], 3.2);
      const to = ensureContrast(shiftHue(accent, 55) ?? mix(accent, "#000000", 0.45), [textColor], 3.2);
      style.backgroundColor = accent;
      style.backgroundImage = [
        "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 48%)",
        `linear-gradient(115deg, ${from} 0%, ${accent} 45%, ${to} 100%)`,
      ].join(", ");
      decor.push(`inset 0 ${line(1)}px 0 rgba(255,255,255,0.55)`);
      break;
    }

    case "neon": {
      // Transparent yta — texten står i praktiken rakt på sidan. På ljus sida
      // blir ljus neontext oläslig (~2,3:1), så där tar vi en mörkare ton av
      // accenten och släpper textglöden.
      const glow = shadowColor ?? accent;
      style.backgroundColor = hexToRgba(accent, lightPage ? 0.06 : 0.08);
      border = { width: 2, color: accent, side: "all" };
      if (lightPage) {
        textColor = onBackdrop(mix(accent, "#000000", 0.25));
      } else {
        textColor = onBackdrop(mix(accent, "#ffffff", 0.35));
        style.textShadow = `0 0 ${px(8)} ${hexToRgba(accent, 0.8)}`;
      }
      ownShadow = [
        `0 0 ${px(14)} ${hexToRgba(glow, lightPage ? 0.45 : 0.6)}`,
        `inset 0 0 ${px(10)} ${hexToRgba(glow, 0.35)}`,
      ].join(", ");
      style["--avy-btn-glow"] = hexToRgba(glow, 0.85);
      classes.push(FX_CLASS, "avy-btn-neon");
      break;
    }

    case "pressed": {
      // Fysisk knapp: en tydligt mörkare "sida" (5px) under ytan och en ljus
      // överkant. Trycks ner vid :active (PRESSED_CLASS).
      const edge = shadowColor ?? mix(accent, "#000000", 0.42);
      style.backgroundColor = accent;
      textColor = pickReadableText([accent]);
      ownShadow = `0 ${px(5)} 0 ${edge}`;
      decor.push(`inset 0 ${line(1)}px 0 rgba(255,255,255,0.3)`);
      style["--avy-btn-edge"] = edge;
      if (!mini) classes.push(PRESSED_CLASS);
      break;
    }

    case "metallic": {
      // Borstad metall: ljus topp, hård mittlinje, bakgrundsrillor.
      // Samma princip som gradient: text ur accenten, stoppen får bära den.
      textColor = pickReadableText([accent]);
      const light = ensureContrast(mix(accent, "#ffffff", 0.55), [textColor], 3.2);
      const dark = ensureContrast(mix(accent, "#000000", 0.22), [textColor], 3.2);
      const mid = ensureContrast(mix(accent, "#ffffff", 0.12), [textColor], 3.2);
      style.backgroundColor = accent;
      style.backgroundImage = [
        `repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, rgba(0,0,0,0.04) 1px 3px)`,
        `linear-gradient(180deg, ${light} 0%, ${accent} 48%, ${dark} 52%, ${mid} 100%)`,
      ].join(", ");
      border = { width: 1, color: mix(accent, "#000000", 0.3), side: "all" };
      decor.push("inset 0 1px 0 rgba(255,255,255,0.7)", "inset 0 -1px 0 rgba(0,0,0,0.2)");
      style.textShadow =
        textColor === LIGHT_TEXT ? "0 1px 0 rgba(0,0,0,0.35)" : "0 1px 0 rgba(255,255,255,0.45)";
      break;
    }

    case "liquid": {
      // Liquid glass (iOS 26): tonat, mättat glas med ljus som bryts i
      // överkanten och en prismatisk kant (pseudo-element i
      // button-variants.css). Ingen vanlig kant — ljuset ÄR kanten.
      const tintTop = mix(accent, "#ffffff", 0.55);
      style.backgroundColor = hexToRgba(accent, 0.14);
      style.backgroundImage = `linear-gradient(180deg, ${hexToRgba(tintTop, 0.34)} 0%, ${hexToRgba(accent, 0.16)} 55%, ${hexToRgba(accent, 0.28)} 100%)`;
      style.backdropFilter = "blur(14px) saturate(180%)";
      style.WebkitBackdropFilter = "blur(14px) saturate(180%)";
      decor.push(
        `inset 0 ${line(1.5)}px ${px(1)} rgba(255,255,255,0.75)`,
        `inset 0 ${px(-6)} ${px(12)} ${px(-6)} rgba(255,255,255,0.35)`,
      );
      ownShadow = `0 ${px(10)} ${px(24)} ${px(-12)} rgba(0,0,0,${lightPage ? 0.28 : 0.5})`;
      // Ungefärlig yta = kortet sett genom accenttonat glas med ljus topp.
      // Kortet har själv backdrop-filter, så i WebKit/Chromium ser glaset
      // ofta bara kortets egen (mörka) färg — den räknas in som ytterlighet.
      textColor = pickReadableText(
        [...bgs, PROFILE_CARD_RGB].flatMap((bg) => [mix(bg, accent, 0.2), mix(bg, tintTop, 0.34)]),
      );
      style.textShadow = textColor === LIGHT_TEXT ? "0 1px 2px rgba(0,0,0,0.35)" : "0 1px 0 rgba(255,255,255,0.4)";
      style["--avy-btn-solid"] = lightPage ? mix(accent, "#ffffff", 0.8) : mix(accent, "#0f172a", 0.7);
      classes.push(FX_CLASS, "avy-btn-liquid", GLASS_REDUCED_TRANSPARENCY_CLASS);
      break;
    }

    case "holo": {
      // Holografisk folie: pastellregnbåge som utgår från accentens kulör,
      // fina foliestreck, och ett långsamt ljussvep (::before, bara transform).
      const hues = [0, 70, 150, 220, 300].map((d) => shiftHue(accent, d));
      const stops = hues.every(Boolean)
        ? (hues as string[]).map((h) => mix(h, "#ffffff", 0.45))
        : ["#ffb3e6", "#b3d4ff", "#b8ffd9", "#fff6b3", "#e0b3ff"];
      style.backgroundColor = stops[0];
      style.backgroundImage = [
        "repeating-linear-gradient(60deg, rgba(255,255,255,0.18) 0 2px, rgba(255,255,255,0) 2px 7px)",
        `linear-gradient(115deg, ${stops.map((c, i) => `${c} ${i * 25}%`).join(", ")})`,
      ].join(", ");
      textColor = pickReadableText(stops);
      border = { width: 1, color: "rgba(255,255,255,0.7)", side: "all" };
      decor.push(`inset 0 ${line(1)}px 0 rgba(255,255,255,0.8)`);
      ownShadow = `0 ${px(6)} ${px(16)} ${px(-6)} ${hexToRgba(stops[3], 0.7)}`;
      classes.push(FX_CLASS, "avy-btn-holo");
      break;
    }

    case "sticker": {
      // Klistermärke: tjock vit kant, lätt snett (varannan knapp åt andra
      // hållet, se CSS) och en hård förskjuten skugga.
      style.backgroundColor = accent;
      textColor = pickReadableText([accent]);
      border = { width: 3, color: "#ffffff", side: "all" };
      const drop = shadowColor
        ? hexToRgba(shadowColor, 0.85)
        : lightPage
          ? "rgba(15,23,42,0.35)"
          : "rgba(0,0,0,0.6)";
      ownShadow = `${px(3)} ${px(4)} 0 ${drop}`;
      classes.push("avy-btn-sticker");
      break;
    }

    case "pixel": {
      // 8-bit: rak ruta med trappstegshörn ritade av box-shadow (en ram på
      // varje sida lämnar hörnen tomma), inre fasning och pixelskugga.
      // Typsnittet rörs inte — bara spärrning och versaler.
      const u = Math.max(2, Math.round(4 * scale));
      const frame = lightPage ? "#0f172a" : mix(pageText, accent, 0.15);
      const drop = shadowColor ?? (lightPage ? hexToRgba("#0f172a", 0.35) : mix(accent, "#000000", 0.6));
      style.backgroundColor = accent;
      style.borderRadius = "0px";
      style.letterSpacing = "0.12em";
      style.textTransform = "uppercase";
      textColor = pickReadableText([accent]);
      decor.push(
        `inset ${-u}px ${-u}px 0 0 ${mix(accent, "#000000", 0.3)}`,
        `inset ${u}px ${u}px 0 0 ${mix(accent, "#ffffff", 0.3)}`,
      );
      ownShadow = [
        `0 ${-u}px 0 0 ${frame}`,
        `0 ${u}px 0 0 ${frame}`,
        `${-u}px 0 0 0 ${frame}`,
        `${u}px 0 0 0 ${frame}`,
        `${u * 2}px ${u * 2}px 0 0 ${drop}`,
      ].join(", ");
      if (!mini) classes.push(PIXEL_CLASS);
      break;
    }

    case "underline":
      // Minimal: ingen yta, bara en linje under hela raden. Radien nollas —
      // en rundad underkant ser ut som ett fel, inte som ett val.
      style.backgroundColor = "transparent";
      style.borderRadius = "0px";
      textColor = onBackdrop(pageText);
      border = { width: 2, color: accent, side: "bottom" };
      ownShadow = "";
      break;

    case "solid":
    default:
      // Referenspunkten: platt, lugn, ingen skugga eller kant.
      style.backgroundColor = accent;
      // Befintliga teman: sidans textfärg, precis som förut. Med per-länk-färg
      // väljer vi läsbar text (Snapchat-gult ska få svart text).
      textColor = custom ? getReadableTextColor(accent) : pageTextRaw;
      break;
  }

  // Fylld yta med sidans textfärg: byt bara om den blir i praktiken oläslig
  // (under 3:1) — annars behåller befintliga teman exakt sin look.
  if ((variant === "solid" || variant === "shadow") && contrastRatio(textColor, accent) < 3) {
    textColor = pickReadableText([accent]);
  }

  // En vald knapptextfärg gäller — utom när knappen är genomskinlig och färgen
  // i praktiken försvinner mot ytan bakom (t.ex. en mall med mörk text för
  // fyllda knappar + byte till neon). Då vinner den läsbara färgen.
  const translucent = TRANSLUCENT_VARIANTS.has(variant);
  const unreadable =
    buttonText !== null && translucent && Math.min(...bgs.map((bg) => contrastRatio(buttonText, bg))) < 3;
  style.color = buttonText && !unreadable ? buttonText : textColor;

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
