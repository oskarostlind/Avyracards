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
      buttonTextColor: "#0b1b3f", // läsbar mot ljusblå knapp (var ljus text, 2.3:1)
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
      textColor: "#2e1065", // mörkare lila: läsbar även på profilens mörka kort (var 1.8:1)
      accentColor: "#8b5cf6",
      buttonTextColor: "#ffffff", // läsbar mot lila knapp (var lila text, 2.1:1)
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
      textColor: "#1c1917", // mörkare: läsbar även på profilens mörka kort (var 1.9:1)
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
  // PREMIUM — "betalskins" (omgång 2, 2026-09-27)
  // Varje mall har EN idé: palett + typsnittspar + minst tre premiumbyggstenar
  // (animerad ram, namneffekt, premiumtypsnitt, premiumknapp, animerad
  // bakgrund). Publika kortet ligger alltid som mörk slate (60 %) ovanpå
  // bakgrunden, så alla premiummallar är mörka i grunden — ljusa bakgrunder
  // blir grå under kortet. Kontrast vaktas av theme-templates.test.ts.
  // Mallar med liquid/holo/sticker/pixel har explicit buttonTextColor så att
  // knapptexten är läsbar oavsett hur varianten fyller ytan.
  // ========================================================================
  {
    // Norrsken över polarnatt: långsam drivande gradient, roterande aurora-ring.
    id: "aurora",
    name: "Midnight Aurora",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0b1a3a",
      gradientTo: "#1e0b3d",
      gradientDir: "to bottom",
      backgroundAnimated: true,
      backgroundPattern: "none",
      textColor: "#e6f6ff",
      accentColor: "#5eead4",
      buttonStyle: "pill",
      buttonVariant: "glass",
      buttonShadow: false,
      font: "manrope",
      headingFont: "sora",
      frameStyle: "aurora",
      nameEffect: "shimmer",
    }
  },
  {
    // Varm guld på nästan svart, serif som på en vinetikett.
    id: "luxury-gold",
    name: "Champagne",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#221a12",
      gradientTo: "#0b0806",
      gradientDir: "to bottom",
      backgroundAnimated: false,
      backgroundPattern: "grain",
      backgroundPatternOpacity: 14,
      textColor: "#f6ecd6",
      accentColor: "#e2c27d",
      buttonStyle: "sharp",
      buttonVariant: "metallic",
      buttonShadow: false,
      font: "manrope",
      headingFont: "cormorant",
      frameStyle: "gold",
      nameEffect: "gradient",
    }
  },
  {
    // Tidigt 2000-tal: krom, regnbågsfolie och bubbliga rubriker.
    id: "y2k-chrome",
    name: "Y2K Chrome",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1b1633",
      gradientTo: "#0a0f24",
      gradientDir: "to bottom right",
      backgroundAnimated: true,
      backgroundPattern: "dots",
      backgroundPatternOpacity: 10,
      textColor: "#f4f1ff",
      accentColor: "#c7b8ff",
      buttonStyle: "pill",
      buttonVariant: "holo",
      buttonTextColor: "#140f2e",
      buttonShadow: false,
      font: "outfit",
      headingFont: "unbounded",
      frameStyle: "holo",
      nameEffect: "gradient",
    }
  },
  {
    // Shinjuku kl. 02: magenta neon mot svart asfalt och ett rutnät av gator.
    id: "cyberpunk",
    name: "Tokyo Neon",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#08030f",
      backgroundAnimated: false,
      backgroundPattern: "grid",
      backgroundPatternOpacity: 10,
      textColor: "#fbeaff",
      accentColor: "#ff3dd8",
      buttonStyle: "sharp",
      buttonVariant: "neon",
      buttonShadow: false,
      font: "sora",
      headingFont: "righteous",
      frameStyle: "neon",
      nameEffect: "glow",
    }
  },
  {
    // Is över fjällsjö: frostram, flytande isglas-knappar, vågor i isen.
    id: "nordic-frost",
    name: "Nordic Frost",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#2b4a5e",
      gradientTo: "#0d1b26",
      gradientDir: "to bottom",
      backgroundAnimated: false,
      backgroundPattern: "waves",
      backgroundPatternOpacity: 12,
      textColor: "#f2f8fc",
      accentColor: "#a9d8f2",
      buttonStyle: "rounded",
      buttonVariant: "liquid",
      buttonTextColor: "#f2f8fc",
      buttonShadow: false,
      font: "quicksand",
      headingFont: "cormorant",
      frameStyle: "frost",
      nameEffect: "gradient",
    }
  },
  {
    // Glöd i mörkret: eldram, glödande namn och en värmebölja i bakgrunden.
    id: "ember",
    name: "Ember",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#3a0f04",
      gradientTo: "#120404",
      gradientDir: "to top",
      backgroundAnimated: true,
      backgroundPattern: "none",
      textColor: "#fff3e6",
      accentColor: "#ff7a1a",
      buttonStyle: "rounded",
      buttonVariant: "gradient",
      buttonShadow: false,
      font: "archivo",
      headingFont: "anton",
      frameStyle: "ember",
      nameEffect: "glow",
    }
  },
  {
    // Lekfull: klistermärkesknappar med vit kant och hård skugga på prickigt lila.
    id: "sticker-club",
    name: "Sticker Club",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#2a1459",
      gradientTo: "#4a1050",
      gradientDir: "to bottom right",
      backgroundAnimated: true,
      backgroundPattern: "dots",
      backgroundPatternOpacity: 22,
      textColor: "#fff8e7",
      accentColor: "#ffd43b",
      buttonStyle: "rounded",
      buttonVariant: "sticker",
      buttonTextColor: "#1f0f45",
      buttonBorderColor: "#ffffff",
      buttonShadowColor: "#12072e",
      buttonShadow: false,
      font: "nunito",
      headingFont: "bricolage",
      frameStyle: "pulse",
      nameEffect: "none",
    }
  },
  {
    // Flytande glas över en mörk färgvirvel — iOS-känsla.
    id: "glass-morphism",
    name: "Liquid",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?q=80&w=1200&auto=format&fit=crop",
      backgroundBlur: 0,
      backgroundOverlay: 30,
      backgroundPattern: "none",
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "pill",
      buttonVariant: "liquid",
      buttonTextColor: "#ffffff",
      buttonShadow: false,
      font: "plus-jakarta",
      headingFont: "plus-jakarta",
      frameStyle: "orbit",
      nameEffect: "shimmer",
    }
  },
  {
    // Modemagasin: svartvitt med en röd linje, smal display-serif, ljussvep i namnet.
    id: "editorial",
    name: "Editorial",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#0d0d0c",
      backgroundAnimated: false,
      backgroundPattern: "grain",
      backgroundPatternOpacity: 12,
      textColor: "#f3efe6",
      accentColor: "#e5484d",
      buttonStyle: "sharp",
      buttonVariant: "underline",
      buttonShadow: false,
      font: "eb-garamond",
      headingFont: "instrument-serif",
      frameStyle: "orbit",
      nameEffect: "shimmer",
    }
  },
  {
    // Arkadhall: pixelknappar, grön fosfor och ett scanline-rutnät.
    id: "arcade",
    name: "Arcade",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#0b0620",
      backgroundAnimated: false,
      backgroundPattern: "grid",
      backgroundPatternOpacity: 8,
      textColor: "#eafff0",
      accentColor: "#7cff5b",
      buttonStyle: "sharp",
      buttonVariant: "pixel",
      buttonTextColor: "#0b0620",
      buttonShadowColor: "#2f8f1f",
      buttonShadow: false,
      font: "space-mono",
      headingFont: "unbounded",
      frameStyle: "neon",
      nameEffect: "none",
    }
  },
  {
    // Sammet och rosé: djupt vinröd, glödande serif, mjuk puls runt bilden.
    id: "velvet",
    name: "Velvet",
    isPremium: true,
    category: "SOCIAL",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#3b0a22",
      gradientTo: "#14040c",
      gradientDir: "to bottom",
      backgroundAnimated: true,
      backgroundPattern: "none",
      textColor: "#ffeef5",
      accentColor: "#f7a8c8",
      buttonStyle: "pill",
      buttonVariant: "shadow",
      buttonTextColor: "#3b0a22",
      buttonShadow: false,
      font: "dm-sans",
      headingFont: "dm-serif-display",
      frameStyle: "pulse",
      nameEffect: "glow",
    }
  },
];
