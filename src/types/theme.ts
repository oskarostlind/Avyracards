export type ButtonStyle = "rounded" | "pill" | "sharp" | "brutal";
export type ButtonVariant = "solid" | "outline" | "glass" | "ghost" | "soft" | "shadow";
export type Font = "inter" | "playfair" | "roboto" | "lora" | "space" | "oswald";
export type FrameStyle = "none" | "circle" | "rounded" | "hexagon" | "ring" | "glow";
export type BackgroundType = "solid" | "gradient" | "image";

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

  // --- UI Element (Knappar) ---
  accentColor?: string;
  textColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  buttonShadow?: boolean;
  
  // --- Profil ---
  frameStyle?: FrameStyle;
  font?: Font;
  hideBranding?: boolean;
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

  accentColor: "#8b5cf6",
  textColor: "#f8fafc",
  
  buttonStyle: "rounded",
  buttonVariant: "solid",
  buttonShadow: false,
  
  frameStyle: "circle",
  font: "inter",

  hideBranding: false,
};

// MALL-INTERFACE (Uppdaterat med category)
export interface ThemeTemplate {
  id: string;
  name: string;
  isPremium: boolean;
  category: ThemeMode; // NYTT: SOCIAL eller BUSINESS
  settings: Partial<CustomThemeSettings>;
}