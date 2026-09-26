export type ButtonStyle = "rounded" | "pill" | "sharp" | "brutal";
import type { FontId } from "@/lib/theme/fonts";

/**
 * Knappvarianter. Id:n ligger sparade i användarnas temajson — döp aldrig om
 * dem, lägg bara till. Utseendet räknas ut i src/lib/theme/button-style.ts.
 */
export type ButtonVariant =
  | "solid"
  | "outline"
  | "glass"
  | "ghost"
  | "soft"
  | "shadow"
  | "gradient"
  | "neon"
  | "pressed"
  | "metallic"
  | "underline";

/**
 * Typsnitts-id ur katalogen i src/lib/theme/fonts.ts. De sex ursprungliga
 * ("inter", "playfair", "roboto", "lora", "space", "oswald") finns kvar.
 */
export type Font = FontId;
export type FrameStyle = ClassicFrameStyle | AnimatedFrameStyle;
export type BackgroundType = "solid" | "gradient" | "image";

/* --- Ramar, namneffekter och bakgrundsmönster ------------------------------
   Listorna nedan är sanningskällan: typerna härleds ur dem, och
   sanitizeThemeSettings vitlistar mot samma listor. Lägg till nya värden här. */

/** Statiska ramar — gratis. */
export const CLASSIC_FRAME_STYLES = ["circle", "rounded", "square", "none", "ring", "glow", "hexagon", "shadow"] as const;
/** Animerade ramar — premium (se PREMIUM_FRAME_STYLES i feature-access). */
export const ANIMATED_FRAME_STYLES = ["aurora", "pulse", "holo", "orbit", "ember", "frost", "gold", "neon"] as const;
export type ClassicFrameStyle = (typeof CLASSIC_FRAME_STYLES)[number];
export type AnimatedFrameStyle = (typeof ANIMATED_FRAME_STYLES)[number];

/** Effekt på visningsnamnet. Allt utom "none" är premium. */
export const NAME_EFFECTS = ["none", "shimmer", "gradient", "glow"] as const;
export type NameEffect = (typeof NAME_EFFECTS)[number];

/** Mönster/textur ovanpå bakgrunden. Gratis. */
export const BACKGROUND_PATTERNS = ["none", "dots", "grid", "diagonal", "waves", "grain"] as const;
export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];
/** Tillåtet intervall för backgroundPatternOpacity (procent). */
export const PATTERN_OPACITY_MIN = 0;
export const PATTERN_OPACITY_MAX = 60;
export const PATTERN_OPACITY_DEFAULT = 15;

// Vi lägger till Mode typen här för att använda i API och UI
export type ThemeMode = "SOCIAL" | "BUSINESS";

export interface CustomThemeSettings {
  // --- Bakgrund ---
  backgroundType: BackgroundType;
  backgroundColor?: string;

  // Gradient
  gradientFrom?: string;
  gradientTo?: string;
  gradientDir?: string;

  // Bild
  backgroundImage?: string;
  backgroundBlur?: number;
  backgroundOverlay?: number;

  // Animerad gradient (premium) — gäller bara backgroundType "gradient".
  backgroundAnimated?: boolean;
  // Mönster ovanpå bakgrunden (gratis) + dess opacitet i procent.
  backgroundPattern?: BackgroundPattern;
  backgroundPatternOpacity?: number;

  // --- UI Element (Knappar) ---
  accentColor?: string;
  textColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  buttonShadow?: boolean;
  /** Knappens textfärg (hex). Saknas -> variantens standard (oftast textColor). */
  buttonTextColor?: string;
  /** Kantfärg (hex). Saknas -> variantens standard. */
  buttonBorderColor?: string;
  /** Kanttjocklek i px, 0–4. Saknas -> variantens standard. */
  buttonBorderWidth?: number;
  /** Skuggfärg (hex) för skugga/glöd/3D-kant. Saknas -> variantens standard. */
  buttonShadowColor?: string;

  // --- Profil ---
  frameStyle?: FrameStyle;
  /** Brödtext (hela profilen). */
  font?: Font;
  /** Rubriker (namnet m.m.). Saknas det används `font`. */
  headingFont?: Font;
  hideBranding?: boolean;
  /** Effekt på visningsnamnet (premium utom "none"). */
  nameEffect?: NameEffect;

  // --- Funktioner ---
  showSaveContact?: boolean; // <-- NYTT FÄLT TILLAGT
}

export const defaultSettings: CustomThemeSettings = {
  backgroundType: "solid",
  backgroundColor: "#0f172a",

  gradientFrom: "#4f46e5",
  gradientTo: "#0f172a",
  gradientDir: "to bottom right",

  backgroundImage: "",
  backgroundBlur: 0,
  backgroundOverlay: 20,

  backgroundAnimated: false,
  backgroundPattern: "none",
  backgroundPatternOpacity: PATTERN_OPACITY_DEFAULT,

  accentColor: "#8b5cf6",
  textColor: "#f8fafc",

  buttonStyle: "rounded",
  buttonVariant: "solid",
  buttonShadow: false,

  frameStyle: "circle",
  font: "inter",

  hideBranding: false,
  showSaveContact: true, // <-- NYTT DEFAULT TILLAGT (True som standard)
  nameEffect: "none",
};

// MALL-INTERFACE (Uppdaterat med category)
export interface ThemeTemplate {
  id: string;
  name: string;
  isPremium: boolean;
  category: ThemeMode; // NYTT: SOCIAL eller BUSINESS
  settings: Partial<CustomThemeSettings>;
}
