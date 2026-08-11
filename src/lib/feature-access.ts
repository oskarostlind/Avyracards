/**
 * Central feature-gating.
 *
 * Ett ställe som avgör vad ett konto får använda. Tanken är att sluta sprida
 * `if (isPremium)` över UI och API-routes: både klienten och servern frågar
 * samma config, så att en lucka i UI:t inte automatiskt blir en lucka i datan.
 *
 * Ref: ClickUp 86c777p5w, punkt 4 "System för feature availability".
 */

import type {
  CustomThemeSettings,
  FrameStyle,
  ButtonVariant,
  ThemeMode,
  ThemeTemplate,
} from "@/types/theme";
import { SOCIAL_TEMPLATES } from "@/data/theme-templates-social";
import { BUSINESS_TEMPLATES } from "@/data/theme-templates-business";

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
  /** Knappstilen "glass". */
  theme_button_glass: "premium",
  /** Premium-ramar runt profilbilden (se PREMIUM_FRAME_STYLES). */
  theme_premium_frames: "premium",

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
 * Ramar som kostar premium.
 *
 * OBS: medvetet tom tills Oskar beslutat vilka ramar som ska ligga bakom
 * betalväggen. Mekaniken är på plats — lägg bara till värden här, så gäller
 * de i både UI och API utan fler kodändringar.
 */
export const PREMIUM_FRAME_STYLES: readonly FrameStyle[] = [];

export const PREMIUM_BUTTON_VARIANTS: readonly ButtonVariant[] = ["glass"];

export function isFrameLocked(frame: FrameStyle | undefined, user?: AccessUser | null): boolean {
  if (!frame) return false;
  if (!PREMIUM_FRAME_STYLES.includes(frame)) return false;
  return !canAccess("theme_premium_frames", user);
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

  // 4. Premium-knappstilar.
  if (
    settings.buttonVariant &&
    PREMIUM_BUTTON_VARIANTS.includes(settings.buttonVariant) &&
    !canAccess("theme_button_glass", user)
  ) {
    settings.buttonVariant = "solid";
    removed.push("theme_button_glass");
  }

  // 5. Premium-ramar.
  if (isFrameLocked(settings.frameStyle, user)) {
    settings.frameStyle = "circle";
    removed.push("theme_premium_frames");
  }

  return { settings, sanitized: removed.length > 0, removed };
}
