export type ButtonStyle = "rounded" | "pill" | "sharp" | "brutal";
export type ButtonVariant = "solid" | "outline" | "glass" | "shadow";
export type Font = "inter" | "playfair" | "roboto" | "lora" | "space";
export type FrameStyle = "none" | "circle" | "rounded" | "hexagon" | "ring" | "glow";

export interface CustomThemeSettings {
  // Färger
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  
  // UI Element
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
  
  // Profilbild
  frameStyle?: FrameStyle;
  
  // Typografi
  font?: Font;
  
  // Extra
  backgroundOverlay?: number; // 0-100% (om man vill mörka ner bakgrunden)
}

// Standardvärden om inget är valt
export const defaultSettings: CustomThemeSettings = {
  backgroundColor: "#0f172a",
  accentColor: "#8b5cf6",
  textColor: "#f8fafc",
  buttonStyle: "rounded",
  buttonVariant: "solid",
  frameStyle: "circle",
  font: "inter",
  backgroundOverlay: 0,
};