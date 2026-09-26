/**
 * Central feature-gating.
 *
 * Ett ställe som avgör vad ett konto får använda. Tanken är att sluta sprida
 * `if (isPremium)` över UI och API-routes: både klienten och servern frågar
 * samma config, så att en lucka i UI:t inte automatiskt blir en lucka i datan.
 *
 * Ref: ClickUp 86c777p5w, punkt 4 "System för feature availability".
 */

import {
  ANIMATED_FRAME_STYLES,
  BACKGROUND_PATTERNS,
  CLASSIC_FRAME_STYLES,
  NAME_EFFECTS,
  PATTERN_OPACITY_DEFAULT,
  PATTERN_OPACITY_MAX,
  PATTERN_OPACITY_MIN,
  type CustomThemeSettings,
  type FrameStyle,
  type ButtonVariant,
  type NameEffect,
  type ThemeMode,
  type ThemeTemplate,
} from "@/types/theme";
import { SOCIAL_TEMPLATES } from "@/data/theme-templates-social";
import { BUSINESS_TEMPLATES } from "@/data/theme-templates-business";
import { isKnownLinkIcon } from "@/lib/link-icons";
import { normalizeHexColor } from "@/utils/color";
import { DEFAULT_FONT_ID, isKnownFontId, isPremiumFont } from "@/lib/theme/fonts";
import { clampButtonBorderWidth, isButtonStyle, isButtonVariant } from "@/lib/theme/button-style";

/** Minsta möjliga bild av användaren som gatingen behöver. */
export interface AccessUser {
  isPremium?: boolean | null;
  isAdmin?: boolean | null;
}

/**
 * Vilken nivå som krävs för en feature.
 * - "free"    : alla inloggade
 * - "premium" : kräver aktivt premium (admin har alltid tillgång)
 * - "admin"   : endast admin
 */
export type AccessLevel = "free" | "premium" | "admin";

const FEATURE_DEFS = {
  // --- Teman ---
  /** Applicera en mall som är märkt isPremium i mall-datan. */
  theme_premium_templates: "premium",
  /** Egen eller Unsplash-bakgrundsbild. */
  theme_background_image: "premium",
  /** Dölja "Powered by AvyraCards" i sidfoten. */
  theme_hide_branding: "premium",
  /** Premium-knappvarianter (se PREMIUM_BUTTON_VARIANTS). */
  theme_premium_buttons: "premium",
  /**
   * @deprecated Gamla namnet från när bara "glass" var premium. Behålls så att
   * äldre klienter/loggar som frågar efter nyckeln får samma svar. Använd
   * theme_premium_buttons.
   */
  theme_button_glass: "premium",
  /** Premium-ramar runt profilbilden (se PREMIUM_FRAME_STYLES). */
  theme_premium_frames: "premium",
  /** Typsnitt märkta isPremium i src/lib/theme/fonts.ts (brödtext och rubrik). */
  theme_premium_fonts: "premium",
  /** Effekt på visningsnamnet (shimmer/gradient/glöd). */
  theme_name_effects: "premium",
  /** Långsamt drivande gradientbakgrund. */
  theme_animated_background: "premium",

  // --- Länkar ---
  /** Egen färg per länkknapp (Link.customColor). Ikonval är gratis. */
  link_custom_color: "premium",

  // --- Statistik ---
  /** Stad/geo i analysvyn. */
  analytics_geo: "premium",

  // --- Admin ---
  admin_panel: "admin",
} as const;

export type FeatureKey = keyof typeof FEATURE_DEFS;

/** Behörighetsnivå per feature. Widened till AccessLevel så nivåerna går att jämföra. */
export const FEATURES: Record<FeatureKey, AccessLevel> = FEATURE_DEFS;

/**
 * Enda stället som svarar på "får den här användaren göra X?".
 * Admin har alltid tillgång — det är också vägen för gift/beta-konton.
 */
export function canAccess(feature: FeatureKey, user?: AccessUser | null): boolean {
  const level: AccessLevel = FEATURES[feature];
  if (level === "free") return true;
  if (user?.isAdmin) return true;
  if (level === "admin") return false;
  return Boolean(user?.isPremium);
}

/**
 * Ramar som kostar premium: alla animerade ramar. De 8 klassiska (statiska)
 * ramarna förblir gratis. Lägg till/ta bort värden här så gäller det i både
 * UI och API utan fler kodändringar.
 */
export const PREMIUM_FRAME_STYLES: readonly FrameStyle[] = ANIMATED_FRAME_STYLES;

/** Namneffekter som kostar premium (allt utom "none"). */
export const PREMIUM_NAME_EFFECTS: readonly NameEffect[] = NAME_EFFECTS.filter((e) => e !== "none");

const KNOWN_FRAME_STYLES: readonly string[] = [...CLASSIC_FRAME_STYLES, ...ANIMATED_FRAME_STYLES];

export function isNameEffectLocked(effect: NameEffect | undefined, user?: AccessUser | null): boolean {
  if (!effect || !PREMIUM_NAME_EFFECTS.includes(effect)) return false;
  return !canAccess("theme_name_effects", user);
}

export function isAnimatedBackgroundLocked(user?: AccessUser | null): boolean {
  return !canAccess("theme_animated_background", user);
}

/**
 * Knappvarianter som kräver premium. Gäller både låsen i editorn och
 * /api/themes/save (via sanitizeThemeSettings). "pressed" och "underline" är
 * medvetet gratis — gratiskonton ska också få något nytt att välja på.
 */
export const PREMIUM_BUTTON_VARIANTS: readonly ButtonVariant[] = ["glass", "gradient", "neon", "metallic"];

export function isButtonVariantLocked(variant: ButtonVariant | undefined, user?: AccessUser | null): boolean {
  if (!variant) return false;
  if (!PREMIUM_BUTTON_VARIANTS.includes(variant)) return false;
  return !canAccess("theme_premium_buttons", user);
}

export function isFrameLocked(frame: FrameStyle | undefined, user?: AccessUser | null): boolean {
  if (!frame) return false;
  if (!PREMIUM_FRAME_STYLES.includes(frame)) return false;
  return !canAccess("theme_premium_frames", user);
}

/** Sant om typsnittet är premium och användaren saknar tillgång. */
export function isFontLocked(fontId: string | null | undefined, user?: AccessUser | null): boolean {
  if (!isPremiumFont(fontId)) return false;
  return !canAccess("theme_premium_fonts", user);
}

export function isTemplateLocked(template: ThemeTemplate, user?: AccessUser | null): boolean {
  if (!template.isPremium) return false;
  return !canAccess("theme_premium_templates", user);
}

export function getTemplates(mode: ThemeMode): ThemeTemplate[] {
  return mode === "BUSINESS" ? BUSINESS_TEMPLATES : SOCIAL_TEMPLATES;
}

/**
 * Sant om inställningarna ser ut att komma från en premium-mall som
 * användaren inte har tillgång till.
 *
 * Klienten låser numera premium-mallarna, men UI-lås är inget skydd: ett
 * direktanrop mot /api/themes/save kunde tidigare spara vilken mall som helst.
 * Vi jämför därför mallens egna fält mot inkommande settings — matchar samtliga
 * är det i praktiken mallen som sparas.
 */
export function matchesLockedTemplate(
  settings: Partial<CustomThemeSettings>,
  mode: ThemeMode,
  user?: AccessUser | null,
): ThemeTemplate | null {
  if (canAccess("theme_premium_templates", user)) return null;

  for (const template of getTemplates(mode)) {
    if (!template.isPremium) continue;

    const keys = Object.keys(template.settings) as (keyof CustomThemeSettings)[];
    if (keys.length === 0) continue;

    const allMatch = keys.every((key) => settings[key] === template.settings[key]);
    if (allMatch) return template;
  }

  return null;
}

export interface SanitizeResult {
  settings: Partial<CustomThemeSettings>;
  /** true om något premium-fält behövde nollas. */
  sanitized: boolean;
  /** Vilka features som togs bort — för loggning och tydligare UI-meddelanden. */
  removed: FeatureKey[];
}

/**
 * Tvätta temainställningar mot användarens faktiska behörighet.
 * Muterar inte indatan.
 */
export function sanitizeThemeSettings(
  input: Partial<CustomThemeSettings>,
  mode: ThemeMode,
  user?: AccessUser | null,
): SanitizeResult {
  const settings: Partial<CustomThemeSettings> = { ...input };
  const removed: FeatureKey[] = [];

  // 0. Vitlista knappfälten. Temajson sparas som den kommer, så utan det här
  //    kunde ett direktanrop lagra godtyckliga strängar/CSS som renderarna
  //    sedan skickar vidare till style-attributet.
  sanitizeButtonFields(settings);
  sanitizeStyleFields(settings);

  // 1. Premium-mall sparad utan behörighet -> fall tillbaka på standardmallen.
  const lockedTemplate = matchesLockedTemplate(settings, mode, user);
  if (lockedTemplate) {
    const fallback = getTemplates(mode).find((t) => !t.isPremium);
    if (fallback) {
      for (const key of Object.keys(lockedTemplate.settings) as (keyof CustomThemeSettings)[]) {
        delete settings[key];
      }
      Object.assign(settings, fallback.settings);
    }
    removed.push("theme_premium_templates");
  }

  // 2. Bakgrundsbild -> solid färg.
  if (settings.backgroundType === "image" && !canAccess("theme_background_image", user)) {
    settings.backgroundType = "solid";
    settings.backgroundImage = undefined;
    settings.backgroundColor = settings.backgroundColor || "#0f172a";
    removed.push("theme_background_image");
  }

  // 3. Tvinga fram branding.
  if (settings.hideBranding && !canAccess("theme_hide_branding", user)) {
    settings.hideBranding = false;
    removed.push("theme_hide_branding");
  }

  // 4. Premium-knappvarianter.
  if (isButtonVariantLocked(settings.buttonVariant, user)) {
    settings.buttonVariant = "solid";
    removed.push("theme_premium_buttons");
  }

  // 5. Ramar: okänt värde -> standard (ingen flagga, det är skräp, inte
  //    premium), sedan premium-ramar -> standard.
  if ("frameStyle" in settings && settings.frameStyle !== undefined && !KNOWN_FRAME_STYLES.includes(settings.frameStyle)) {
    settings.frameStyle = "circle";
  }
  if (isFrameLocked(settings.frameStyle, user)) {
    settings.frameStyle = "circle";
    removed.push("theme_premium_frames");
  }

  // 6. Typsnitt: vitlista mot katalogen (okänt id sparas inte — det
  // renderades ändå som Inter) och nolla premium-typsnitt utan behörighet.
  if ("font" in settings) {
    if (!isKnownFontId(settings.font)) {
      settings.font = DEFAULT_FONT_ID;
    } else if (isFontLocked(settings.font, user)) {
      settings.font = DEFAULT_FONT_ID;
      if (!removed.includes("theme_premium_fonts")) removed.push("theme_premium_fonts");
    }
  }
  if ("headingFont" in settings) {
    if (!isKnownFontId(settings.headingFont)) {
      // undefined = "samma som brödtexten".
      delete settings.headingFont;
    } else if (isFontLocked(settings.headingFont, user)) {
      delete settings.headingFont;
      if (!removed.includes("theme_premium_fonts")) removed.push("theme_premium_fonts");
    }
  }

  // 7. Namneffekt: vitlista, sedan premium.
  if ("nameEffect" in settings && settings.nameEffect !== undefined) {
    if (!(NAME_EFFECTS as readonly string[]).includes(settings.nameEffect)) {
      settings.nameEffect = "none";
    } else if (isNameEffectLocked(settings.nameEffect, user)) {
      settings.nameEffect = "none";
      removed.push("theme_name_effects");
    }
  }

  // 8. Animerad bakgrund: bara boolean, och bara för premium.
  if ("backgroundAnimated" in settings && settings.backgroundAnimated !== undefined) {
    if (settings.backgroundAnimated !== true) {
      settings.backgroundAnimated = false;
    } else if (isAnimatedBackgroundLocked(user)) {
      settings.backgroundAnimated = false;
      removed.push("theme_animated_background");
    }
  }

  // 9. Bakgrundsmönster (gratis): vitlista + klampa opaciteten.
  if ("backgroundPattern" in settings && settings.backgroundPattern !== undefined) {
    if (!(BACKGROUND_PATTERNS as readonly string[]).includes(settings.backgroundPattern)) {
      settings.backgroundPattern = "none";
    }
  }
  if ("backgroundPatternOpacity" in settings && settings.backgroundPatternOpacity !== undefined) {
    settings.backgroundPatternOpacity = clampPatternOpacity(settings.backgroundPatternOpacity);
  }

  return { settings, sanitized: removed.length > 0, removed };
}


const BUTTON_COLOR_FIELDS = ["buttonTextColor", "buttonBorderColor", "buttonShadowColor"] as const;

/**
 * Okänd form/variant -> standardvärdet. Färger normaliseras till #rrggbb,
 * ogiltiga tas bort (= variantens standard). Kanttjocklek klampas till 0–4.
 * Fält som saknas lämnas orörda. Muterar `settings` (som redan är en kopia).
 */
function sanitizeButtonFields(settings: Partial<CustomThemeSettings>): void {
  if ("buttonStyle" in settings && settings.buttonStyle !== undefined && !isButtonStyle(settings.buttonStyle)) {
    settings.buttonStyle = "rounded";
  }
  if ("buttonVariant" in settings && settings.buttonVariant !== undefined && !isButtonVariant(settings.buttonVariant)) {
    settings.buttonVariant = "solid";
  }

  for (const key of BUTTON_COLOR_FIELDS) {
    if (!(key in settings)) continue;
    const normalized = normalizeHexColor(settings[key]);
    if (normalized) settings[key] = normalized;
    else delete settings[key];
  }

  if ("buttonBorderWidth" in settings) {
    const width = clampButtonBorderWidth(settings.buttonBorderWidth);
    if (width === null) delete settings.buttonBorderWidth;
    else settings.buttonBorderWidth = width;
  }
}

/** Klampar mönsteropacitet till tillåtet intervall; skräp -> standardvärdet. */
export function clampPatternOpacity(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return PATTERN_OPACITY_DEFAULT;
  return Math.round(Math.min(PATTERN_OPACITY_MAX, Math.max(PATTERN_OPACITY_MIN, n)));
}


const THEME_COLOR_FIELDS = ["backgroundColor", "gradientFrom", "gradientTo", "accentColor", "textColor"] as const;

/** Riktningar som editorn erbjuder + det mallarna använder. Allt annat är skräp. */
const GRADIENT_DIRECTIONS = new Set([
  "to bottom", "to top", "to right", "to left",
  "to bottom right", "to bottom left", "to top right", "to top left",
]);

const BACKGROUND_TYPES = new Set(["solid", "gradient", "image"]);

/**
 * Bakgrundsbild-URL som är säker att lägga i `url(...)`: bara https och inga
 * tecken som kan bryta sig ut ur CSS-värdet (citattecken, parenteser, ;, \,
 * blanksteg, vinkelparenteser).
 */
const SAFE_IMAGE_URL = /^https:\/\/[^\s"'()\\;<>]+$/;

function clampNumber(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/**
 * Stilfält som renderarna lägger direkt i style-attributet på den publika
 * profilen. Tidigare sparades de som de kom in — ett direktanrop kunde då
 * lagra t.ex. `textColor: "#fff; position:fixed; background:url(https://…)"`,
 * och React skriver ut det som flera deklarationer (helsidesöverlägg + anrop
 * till främmande värd med besökarens IP). Fält som saknas lämnas orörda;
 * ogiltiga tas bort så att standardvärdet gäller.
 */
function sanitizeStyleFields(settings: Partial<CustomThemeSettings>): void {
  for (const key of THEME_COLOR_FIELDS) {
    if (!(key in settings) || settings[key] === undefined) continue;
    const normalized = normalizeHexColor(settings[key]);
    if (normalized) settings[key] = normalized;
    else delete settings[key];
  }

  if ("gradientDir" in settings && settings.gradientDir !== undefined) {
    if (typeof settings.gradientDir !== "string" || !GRADIENT_DIRECTIONS.has(settings.gradientDir)) {
      delete settings.gradientDir;
    }
  }

  if ("backgroundType" in settings && settings.backgroundType !== undefined) {
    if (!BACKGROUND_TYPES.has(settings.backgroundType as string)) settings.backgroundType = "solid";
  }

  if ("backgroundImage" in settings && settings.backgroundImage !== undefined) {
    const url = settings.backgroundImage;
    if (typeof url !== "string" || (url !== "" && !SAFE_IMAGE_URL.test(url))) {
      settings.backgroundImage = "";
      if (settings.backgroundType === "image") settings.backgroundType = "solid";
    }
  }

  if ("backgroundBlur" in settings && settings.backgroundBlur !== undefined) {
    const v = clampNumber(settings.backgroundBlur, 0, 40);
    if (v === null) delete settings.backgroundBlur;
    else settings.backgroundBlur = v;
  }
  if ("backgroundOverlay" in settings && settings.backgroundOverlay !== undefined) {
    const v = clampNumber(settings.backgroundOverlay, 0, 100);
    if (v === null) delete settings.backgroundOverlay;
    else settings.backgroundOverlay = v;
  }

  for (const key of ["hideBranding", "showSaveContact", "buttonShadow"] as const) {
    if (key in settings && settings[key] !== undefined && typeof settings[key] !== "boolean") {
      settings[key] = settings[key] === "true";
    }
  }
}

/**
 * Validering (utan premium-spärrar) för rendering av redan sparade teman.
 * Sparade data från före valideringen — eller skrivna via en äldre route —
 * ska aldrig nå style-attributet otvättade. Premium-spärrar vid rendering
 * sköts separat av renderarna.
 */
export function validateThemeSettingsForRender(
  input: Partial<CustomThemeSettings>,
  mode: ThemeMode,
): Partial<CustomThemeSettings> {
  return sanitizeThemeSettings(input, mode, { isAdmin: true }).settings;
}

/* -------------------------------------------------------------------------- */
/*  Länkanpassning (färg + ikon)                                              */
/* -------------------------------------------------------------------------- */

export interface LinkCustomizationInput {
  customColor?: unknown;
  icon?: unknown;
}

export interface LinkCustomizationResult {
  /**
   * `undefined` betyder att fältet inte fanns i indatan och alltså inte ska
   * skrivas — viktigt för PATCH, som annars hade nollat fält den inte rörde.
   * `null` betyder "rensa värdet".
   */
  customColor?: string | null;
  icon?: string | null;
  sanitized: boolean;
  removed: FeatureKey[];
}

/**
 * Tvätta länkens anpassningsfält mot användarens behörighet.
 *
 * Samma resonemang som sanitizeThemeSettings: färgväljaren är låst i UI:t för
 * gratiskonton, men ett direktanrop mot /api/links hade annars kunnat sätta
 * customColor ändå. Ikonval är gratis — där validerar vi bara att sluggen
 * finns i registret så att vi inte sparar skräp som renderas som ingenting.
 */
export function sanitizeLinkCustomization(
  input: LinkCustomizationInput,
  user?: AccessUser | null,
): LinkCustomizationResult {
  const result: LinkCustomizationResult = { sanitized: false, removed: [] };

  if ("icon" in input) {
    const raw = input.icon;
    if (typeof raw === "string" && isKnownLinkIcon(raw)) {
      result.icon = raw;
    } else {
      // Tomt, "auto" eller okänd slug -> automatisk detektering.
      result.icon = null;
    }
  }

  if ("customColor" in input) {
    const raw = input.customColor;
    const normalized = normalizeHexColor(raw);

    if (normalized === null) {
      result.customColor = null;
    } else if (canAccess("link_custom_color", user)) {
      result.customColor = normalized;
    } else {
      result.customColor = null;
      result.removed.push("link_custom_color");
    }
  }

  result.sanitized = result.removed.length > 0;
  return result;
}
