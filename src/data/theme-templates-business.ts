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
      textColor: "#0c4a6e",       // Sky-900
      accentColor: "#0284c7",     // Sky-600
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
  // PREMIUM TEMAN (6 st) - Bilder & Avancerad Styling
  // ========================================================================

  // 9. THE EXECUTIVE (Skyskrapa)
  {
    id: "biz-nyc",
    name: "Executive",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop", // Modern glasfasad
      backgroundBlur: 2,
      backgroundOverlay: 70, // Mörk overlay
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "sharp",
      buttonVariant: "glass",
      font: "inter",
      frameStyle: "none",
      buttonShadow: true,
    }
  },

  // 10. SCANDINAVIAN (Ljust trä/Kontor)
  {
    id: "biz-nordic-office",
    name: "Nordic Office",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop", // Ljust kontor
      backgroundBlur: 3,
      backgroundOverlay: 85, // Vit/Ljus overlay kräver mörk text, men vi kör mörk overlay för vit text för kontrastens skull
      textColor: "#ffffff",
      accentColor: "#e2e8f0", // Slate-200
      buttonStyle: "rounded",
      buttonVariant: "outline",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: false,
    }
  },

  // 11. INNOVATOR (Abstrakt/Neon)
  {
    id: "biz-innovator",
    name: "Innovator",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop", // Tech/Space nätverk
      backgroundBlur: 4,
      backgroundOverlay: 60,
      textColor: "#ccfbf1", // Teal-50
      accentColor: "#2dd4bf", // Teal-400
      buttonStyle: "pill",
      buttonVariant: "soft", // Mjuka knappar mot hård bakgrund
      font: "space",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },

  // 12. INVESTOR (Marmor/Lyx)
  {
    id: "biz-marble",
    name: "Empire",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", // Mörk abstrakt olja/marmor
      backgroundBlur: 0,
      backgroundOverlay: 40,
      textColor: "#ffffff",
      accentColor: "#fcd34d", // Amber-300
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "playfair",
      frameStyle: "ring",
      buttonShadow: false,
    }
  },

  // 13. FREELANCE (Kaffe/Bord)
  {
    id: "biz-workspace",
    name: "Freelance",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=1000&auto=format&fit=crop", // Varmt skrivbord
      backgroundBlur: 3,
      backgroundOverlay: 80, // Brun/Mörk overlay
      textColor: "#ffedd5",  // Orange-50
      accentColor: "#fdba74", // Orange-300
      buttonStyle: "rounded",
      buttonVariant: "ghost",
      font: "lora",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },

  // 14. MINIMAL DARK (Betong)
  {
    id: "biz-concrete",
    name: "Construct",
    isPremium: true,
    category: "BUSINESS",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1000&auto=format&fit=crop", // Svart betong
      backgroundBlur: 0,
      backgroundOverlay: 50,
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "brutal",
      buttonVariant: "outline",
      font: "oswald",
      frameStyle: "none",
      buttonShadow: false,
    }
  }
];