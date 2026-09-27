import { ThemeTemplate } from "@/types/theme";

export const BUSINESS_TEMPLATES: ThemeTemplate[] = [
  // ========================================================================
  // GRATIS TEMAN (8 st) - Solid färg & Gradients
  // ========================================================================
  
  // 1. SAFE & TRUST (Blå) - Perfekt för konsulter, försäkring, sälj
  {
    id: "biz-trust-blue",
    name: "Trust",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0f172a", // Slate-900
      gradientTo: "#1e3a8a",   // Blue-900
      gradientDir: "to bottom right",
      textColor: "#ffffff",
      accentColor: "#60a5fa",  // Blue-400
      buttonTextColor: "#0b1530", // läsbar mot ljusblå knapp (var vit text, 2.5:1)
      buttonStyle: "rounded",
      buttonVariant: "solid",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },

  // 2. GROWTH (Grön) - Finans, Hälsa, Coaching
  {
    id: "biz-growth",
    name: "Growth",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#064e3b", // Emerald-900
      textColor: "#ecfdf5",       // Emerald-50
      accentColor: "#34d399",     // Emerald-400
      buttonStyle: "pill",
      buttonVariant: "soft",
      font: "roboto",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },

  // 3. MODERN TECH (Mörkgrå/Lila) - SaaS, Utvecklare, IT
  {
    id: "biz-modern-tech",
    name: "SaaS",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#18181b", // Zinc-950
      textColor: "#f4f4f5",
      accentColor: "#818cf8",     // Indigo-400
      buttonStyle: "rounded",
      buttonVariant: "outline",
      font: "inter",
      frameStyle: "hexagon",
      buttonShadow: false,
    }
  },

  // 4. AUTHORITY (Röd/Brun) - Juridik, Ledarskap, Opinion
  {
    id: "biz-authority",
    name: "Authority",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#450a0a", // Red-950
      gradientTo: "#7f1d1d",   // Red-900
      gradientDir: "to bottom",
      textColor: "#fef2f2",
      accentColor: "#fca5a5",  // Red-300
      buttonStyle: "sharp",
      buttonVariant: "ghost",
      font: "playfair",        // Serif ger auktoritet
      frameStyle: "none",
      buttonShadow: false,
    }
  },

  // 5. MINIMALIST (Varm Grå) - Arkitekt, Design, Skribent
  {
    id: "biz-studio",
    name: "Studio",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#e7e5e4", // Stone-200
      textColor: "#1c1917",       // Stone-900
      accentColor: "#44403c",     // Stone-700
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "lora",
      frameStyle: "none",
      buttonShadow: false,
    }
  },

  // 6. CREATIVE (Lila/Magenta) - Marknadsföring, Influencer, Media
  {
    id: "biz-creative-flow",
    name: "Flow",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#4a044e", // Fuchsia-950
      gradientTo: "#2e1065",   // Violet-950
      gradientDir: "to bottom right",
      textColor: "#ffffff",
      accentColor: "#e879f9",  // Fuchsia-400
      buttonStyle: "pill",
      buttonVariant: "soft",
      font: "space",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },

  // 7. CLEAN SLATE (Ljusblå/Vit) - Vård, Tandläkare, Service
  {
    id: "biz-clinic",
    name: "Clinic",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#f0f9ff", // Sky-50
      textColor: "#0b1e36", // mörkare: läsbar även på profilens mörka kort (var 1.9:1)
      accentColor: "#0284c7",     // Sky-600
      buttonTextColor: "#ffffff", // läsbar mot blå knapp (var mörkblå text, 2.3:1)
      buttonStyle: "rounded",
      buttonVariant: "solid",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: false,
    }
  },

  // 8. DARK ELEGANCE (Svart/Guld) - High-end, Fastigheter, Nattliv
  {
    id: "biz-noir",
    name: "Noir",
    isPremium: false,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#000000",
      textColor: "#d4d4d8",       // Zinc-300
      accentColor: "#fbbf24",     // Amber-400 (Guld)
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "oswald",
      frameStyle: "ring",
      buttonShadow: false,
    }
  },

  // ========================================================================
  // PREMIUM — "betalskins" för affärskortet (omgång 2, 2026-09-27)
  // Samma regler som sociala mallarna: en idé, genomtänkt palett, typsnittspar
  // och minst tre premiumbyggstenar — men återhållsamt: inga pixel/sticker,
  // animation bara där den bär idén. Kortet ligger som mörk slate ovanpå, så
  // grunderna är mörka.
  // ========================================================================
  {
    // Private banking: marinblått, guld och en klassisk serif.
    id: "biz-private-bank",
    name: "Private Bank",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#0f1f3d",
      gradientTo: "#060b18",
      gradientDir: "to bottom",
      backgroundAnimated: false,
      backgroundPattern: "grain",
      backgroundPatternOpacity: 10,
      textColor: "#f1ead8",
      accentColor: "#c9a861",
      buttonStyle: "sharp",
      buttonVariant: "metallic",
      buttonShadow: false,
      font: "manrope",
      headingFont: "libre-baskerville",
      frameStyle: "gold",
      nameEffect: "none",
    }
  },
  {
    // Arkitektkontor: betong, ritpapper och ett tunt rutnät.
    id: "biz-concrete",
    name: "Studio Architect",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#1a1b1d",
      backgroundAnimated: false,
      backgroundPattern: "grid",
      backgroundPatternOpacity: 7,
      textColor: "#ececea",
      accentColor: "#ff5a36",
      buttonStyle: "sharp",
      buttonVariant: "underline",
      buttonShadow: false,
      font: "archivo",
      headingFont: "syne",
      frameStyle: "orbit",
      nameEffect: "gradient",
    }
  },
  {
    // Klinik: mintgrönt och en lugn puls runt bilden — ett hjärtslag, inte ett larm.
    id: "biz-clinic-calm",
    name: "Clinic Calm",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1d3b37",
      gradientTo: "#0c1a1c",
      gradientDir: "to bottom",
      backgroundAnimated: true,
      backgroundPattern: "none",
      textColor: "#effaf6",
      accentColor: "#7fe0c3",
      buttonStyle: "pill",
      buttonVariant: "soft",
      buttonShadow: false,
      font: "nunito",
      headingFont: "quicksand",
      frameStyle: "pulse",
      nameEffect: "none",
    }
  },
  {
    // Startup-grundare: pitchdeck-mörkt, elektrisk indigo, rörlig gradient.
    id: "biz-founder",
    name: "Founder",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1a1446",
      gradientTo: "#05060f",
      gradientDir: "to bottom right",
      backgroundAnimated: true,
      backgroundPattern: "none",
      textColor: "#f3f2ff",
      accentColor: "#7c6cff",
      buttonStyle: "rounded",
      buttonVariant: "gradient",
      buttonShadow: false,
      font: "plus-jakarta",
      headingFont: "sora",
      frameStyle: "aurora",
      nameEffect: "gradient",
    }
  },
  {
    // Advokatbyrå: oxblod och graverade silverskyltar, stram serif.
    id: "biz-law",
    name: "Law & Co",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#3a1216",
      gradientTo: "#140607",
      gradientDir: "to bottom",
      backgroundAnimated: false,
      backgroundPattern: "diagonal",
      backgroundPatternOpacity: 6,
      textColor: "#f6efe4",
      accentColor: "#c9ccd1",
      buttonStyle: "sharp",
      buttonVariant: "metallic",
      buttonShadow: false,
      font: "eb-garamond",
      headingFont: "dm-serif-display",
      frameStyle: "ring",
      nameEffect: "gradient",
    }
  },
  {
    // Creative director: svart, EN skarp limefärg som bär allt — knappar,
    // namn och en pulserande ram. Tung displayrubrik.
    id: "biz-creative-director",
    name: "Creative Director",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#0a0a0a",
      backgroundAnimated: false,
      backgroundPattern: "grain",
      backgroundPatternOpacity: 14,
      textColor: "#fafafa",
      accentColor: "#d4ff3a",
      buttonStyle: "pill",
      buttonVariant: "shadow",
      buttonTextColor: "#0a0a0a",
      buttonShadow: false,
      font: "dm-sans",
      headingFont: "abril-fatface",
      frameStyle: "pulse",
      nameEffect: "gradient",
    }
  },
  {
    // Glasfasad i blå timme: bilden syns genom flytande glasknappar.
    id: "biz-nyc",
    name: "Skyline",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
      backgroundBlur: 0,
      backgroundOverlay: 45,
      backgroundPattern: "none",
      textColor: "#ffffff",
      accentColor: "#8ec5ff",
      buttonStyle: "pill",
      buttonVariant: "liquid",
      buttonTextColor: "#ffffff",
      buttonShadow: false,
      font: "outfit",
      headingFont: "syne",
      frameStyle: "orbit",
      nameEffect: "shimmer",
    }
  },
];
