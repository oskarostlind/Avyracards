import { ThemeTemplate } from "@/types/theme";

export const SOCIAL_TEMPLATES: ThemeTemplate[] = [
  // ========================================================================
  // GRATIS TEMAN (Clean, Modern, Essential)
  // ========================================================================
  {
    id: "minimal-white",
    name: "Clean Slate",
    isPremium: false,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#020617",
      textColor: "#f8fafc",
      accentColor: "#334155",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#14532d",
      gradientTo: "#052e16",
      gradientDir: "to bottom",
      textColor: "#f0fdf4",
      accentColor: "#22c55e",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1e3a8a",
      gradientTo: "#172554",
      gradientDir: "to bottom right",
      textColor: "#eff6ff",
      accentColor: "#60a5fa",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#451a03",
      textColor: "#fef3c7",
      accentColor: "#78350f",
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "lora",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },
  {
    id: "lavender",
    name: "Soft Pop",
    isPremium: false,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#f5f3ff",
      textColor: "#5b21b6",
      accentColor: "#8b5cf6",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#e7e5e4",
      textColor: "#44403c",
      accentColor: "#57534e",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#2563eb",
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
  // PREMIUM TEMAN (Wow-faktor)
  // ========================================================================
  {
    id: "cyberpunk",
    name: "Neon City",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#050505",
      textColor: "#22d3ee",
      accentColor: "#f0abfc",
      buttonStyle: "brutal",
      buttonVariant: "outline",
      font: "space",
      frameStyle: "hexagon",
      buttonShadow: true,
    }
  },
  {
    id: "luxury-gold",
    name: "Obsidian",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0c0a09",
      gradientTo: "#000000",
      gradientDir: "to bottom",
      textColor: "#fafaf9",
      accentColor: "#d4af37",
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "playfair",
      frameStyle: "ring",
      buttonShadow: false,
    }
  },
  {
    id: "glass-morphism",
    name: "Frost",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
      backgroundBlur: 10,
      backgroundOverlay: 20,
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "pill",
      buttonVariant: "glass",
      font: "inter",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },
  {
    id: "sunset-vibes",
    name: "Miami",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#f43f5e",
      gradientTo: "#8b5cf6",
      gradientDir: "to bottom right",
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "rounded",
      buttonVariant: "glass",
      font: "oswald",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "bottega",
    name: "Vogue",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#064e3b",
      textColor: "#ecfdf5",
      accentColor: "#10b981",
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
    category: "SOCIAL",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
      backgroundBlur: 2,
      backgroundOverlay: 85,
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "brutal",
      buttonVariant: "outline",
      font: "oswald",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },

  // ========================================================================
  // NYA FÄRDIGA PREMIUM-MALLAR (ClickUp 86c74tjrn)
  // ========================================================================
  {
    id: "aurora",
    name: "Aurora",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0f766e",
      gradientTo: "#4c1d95",
      gradientDir: "to bottom right",
      textColor: "#f0fdfa",
      accentColor: "#2dd4bf",
      buttonStyle: "pill",
      buttonVariant: "glass",
      font: "space",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },
  {
    id: "sunset-gold",
    name: "Golden Hour",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#b45309",
      gradientTo: "#881337",
      gradientDir: "to bottom",
      textColor: "#fffbeb",
      accentColor: "#fbbf24",
      buttonStyle: "pill",
      buttonVariant: "soft",
      font: "playfair",
      frameStyle: "ring",
      buttonShadow: true,
    }
  },
  {
    id: "royal-purple",
    name: "Royal",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#1e1b4b",
      textColor: "#ede9fe",
      accentColor: "#c4b5fd",
      buttonStyle: "rounded",
      buttonVariant: "outline",
      font: "lora",
      frameStyle: "shadow",
      buttonShadow: false,
    }
  },
  {
    id: "carbon-red",
    name: "Carbon",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#0a0a0a",
      textColor: "#fafafa",
      accentColor: "#ef4444",
      buttonStyle: "brutal",
      buttonVariant: "solid",
      font: "oswald",
      frameStyle: "square",
      buttonShadow: false,
    }
  }
];