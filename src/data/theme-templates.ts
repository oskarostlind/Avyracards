import { CustomThemeSettings } from "@/types/theme";

export interface ThemeTemplate {
  id: string;
  name: string;
  isPremium: boolean;
  settings: Partial<CustomThemeSettings>;
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  // ========================================================================
  // GRATIS TEMAN (Clean, Modern, Essential)
  // ========================================================================
  
  {
    id: "minimal-white",
    name: "Clean Slate",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#ffffff",
      textColor: "#0f172a", // Slate-900 (inte helt svart för mjukare look)
      accentColor: "#0f172a",
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "inter",
      frameStyle: "none",
      buttonShadow: false,
    }
  },
  {
    id: "minimal-dark",
    name: "Midnight",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#020617", // Slate-950
      textColor: "#f8fafc", // Slate-50
      accentColor: "#334155", // Slate-700
      buttonStyle: "rounded",
      buttonVariant: "soft",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: false,
    }
  },
  {
    id: "forest",
    name: "Evergreen",
    isPremium: false,
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#14532d", // Green-900
      gradientTo: "#052e16",   // Green-950
      gradientDir: "to bottom",
      textColor: "#f0fdf4",
      accentColor: "#22c55e", // Green-500
      buttonStyle: "pill",
      buttonVariant: "soft",
      font: "roboto",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "ocean",
    name: "Deep Blue",
    isPremium: false,
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1e3a8a", // Blue-900
      gradientTo: "#172554",   // Blue-950
      gradientDir: "to bottom right",
      textColor: "#eff6ff",
      accentColor: "#60a5fa", // Blue-400
      buttonStyle: "rounded",
      buttonVariant: "solid",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "cocoa",
    name: "Espresso",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#451a03", // Amber-950
      textColor: "#fef3c7", // Amber-100
      accentColor: "#78350f", // Amber-900
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "lora", // Serif för en "Lifestyle"-känsla
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },
  {
    id: "lavender",
    name: "Soft Pop",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#f5f3ff", // Violet-50
      textColor: "#5b21b6", // Violet-800
      accentColor: "#8b5cf6", // Violet-500
      buttonStyle: "pill",
      buttonVariant: "solid",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "stone",
    name: "Atelier",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#e7e5e4", // Stone-200
      textColor: "#44403c", // Stone-700
      accentColor: "#57534e", // Stone-600
      buttonStyle: "sharp",
      buttonVariant: "ghost",
      font: "lora",
      frameStyle: "none",
      buttonShadow: false,
    }
  },
  {
    id: "tech-basic",
    name: "Startup",
    isPremium: false,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#2563eb", // Blue-600 (Classic Tech Blue)
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "rounded",
      buttonVariant: "outline",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: false,
    }
  },

  // ========================================================================
  // PREMIUM TEMAN (Wow-faktor, Glas, Neon, Luxury)
  // ========================================================================

  {
    id: "cyberpunk",
    name: "Neon City",
    isPremium: true,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#050505", // Black
      textColor: "#22d3ee", // Cyan-400
      accentColor: "#f0abfc", // Fuchsia-300
      buttonStyle: "brutal", // Hårda kanter + border
      buttonVariant: "outline",
      font: "space", // Monospace känsla
      frameStyle: "hexagon",
      buttonShadow: true,
    }
  },
  {
    id: "luxury-gold",
    name: "Obsidian",
    isPremium: true,
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0c0a09", // Stone-950
      gradientTo: "#000000",
      gradientDir: "to bottom",
      textColor: "#fafaf9",
      accentColor: "#d4af37", // Metallic Gold
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "playfair", // Elegant Serif
      frameStyle: "ring",
      buttonShadow: false,
    }
  },
  {
    id: "glass-morphism",
    name: "Frost",
    isPremium: true,
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop", // Abstrakt lila/blå gradient
      backgroundBlur: 10, // Mycket blur för djup
      backgroundOverlay: 20,
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "pill",
      buttonVariant: "glass", // Genomskinliga knappar
      font: "inter",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },
  {
    id: "sunset-vibes",
    name: "Miami",
    isPremium: true,
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#f43f5e", // Rose-500
      gradientTo: "#8b5cf6",   // Violet-500
      gradientDir: "to bottom right",
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "rounded",
      buttonVariant: "glass",
      font: "oswald", // Bold Condensed
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "bottega",
    name: "Vogue",
    isPremium: true,
    settings: {
      backgroundType: "solid",
      backgroundColor: "#064e3b", // Emerald-900 (Väldigt trendig grön)
      textColor: "#ecfdf5", // Emerald-50
      accentColor: "#10b981", // Emerald-500
      buttonStyle: "sharp",
      buttonVariant: "solid",
      font: "playfair",
      frameStyle: "none",
      buttonShadow: false,
    }
  },
  {
    id: "monochrome-pro",
    name: "Architect",
    isPremium: true,
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop", // Betong/Arkitektur
      backgroundBlur: 2,
      backgroundOverlay: 85, // Väldigt mörk overlay
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "brutal",
      buttonVariant: "outline",
      font: "oswald",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  }
];