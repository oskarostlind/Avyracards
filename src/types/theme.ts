export type ButtonStyle = "rounded" | "pill" | "sharp" | "brutal";
export type ButtonVariant = "solid" | "outline" | "glass" | "ghost" | "soft" | "shadow";
export type Font = "inter" | "playfair" | "roboto" | "lora" | "space" | "oswald";
export type FrameStyle = "none" | "circle" | "rounded" | "hexagon" | "ring" | "glow";
export type BackgroundType = "solid" | "gradient" | "image";

export interface CustomThemeSettings {
  // --- Bakgrund ---
  backgroundType: BackgroundType;
  backgroundColor?: string; 
  
  // Gradient
  gradientFrom?: string;
  gradientTo?: string;
  gradientDir?: string; // t.ex. "to bottom right"
  
  // Bild
  backgroundImage?: string;
  backgroundBlur?: number; // 0-20px
  backgroundOverlay?: number; // 0-90%

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

// Standardvärden (Modern "Dark Default")
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

  hideBranding: false, // Default är att visa loggan
};

