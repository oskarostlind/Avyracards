import { clsx } from "clsx";

export type ThemeName = "default" | "elegant" | "dark" | "neon" | "sun" | "graffiti" | "rainbow";

export interface ThemeTokens {
  container: string;
  card: string;
  link: string;
  accent: string;
  text: string;
}

const base = {
  container: "p-6", card: "rounded-3xl p-6 shadow-xl", link: "", accent: "", text: ""
};

export const themes: Record<ThemeName, ThemeTokens> = {
  default: {
    ...base,
    container: clsx(base.container, "bg-theme-default-background text-theme-default-text"),
    card: clsx(base.card, "bg-theme-default-card"),
    link: "rounded-full bg-theme-default-accent px-4 py-3 text-center font-semibold text-white shadow-md hover:opacity-90",
    accent: "text-theme-default-accent",
    text: "text-theme-default-text",
  },
  elegant: {
    ...base,
    container: clsx(base.container, "bg-theme-elegant-background text-theme-elegant-text"),
    card: clsx(base.card, "bg-theme-elegant-card"),
    link: "rounded-full bg-theme-elegant-accent px-4 py-3 text-center font-semibold text-white shadow-md hover:opacity-90",
    accent: "text-theme-elegant-accent",
    text: "text-theme-elegant-text",
  },
  dark: {
    ...base,
    container: clsx(base.container, "bg-theme-dark-background text-theme-dark-text"),
    card: clsx(base.card, "bg-theme-dark-card"),
    link: "rounded-full bg-theme-dark-accent px-4 py-3 text-center font-semibold text-theme-dark-text shadow-md hover:opacity-90",
    accent: "text-theme-dark-accent",
    text: "text-theme-dark-text",
  },
  neon: {
    ...base,
    container: clsx(base.container, "bg-theme-neon-background text-theme-neon-text"),
    card: clsx(base.card, "bg-theme-neon-card"),
    link: "rounded-full bg-theme-neon-accent px-4 py-3 text-center font-semibold text-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.6)]",
    accent: "text-theme-neon-accent",
    text: "text-theme-neon-text",
  },
  sun: {
    ...base,
    container: clsx(base.container, "bg-theme-sun-background text-theme-sun-text"),
    card: clsx(base.card, "bg-theme-sun-card"),
    link: "rounded-full bg-theme-sun-accent px-4 py-3 text-center font-semibold text-white shadow-md hover:opacity-90",
    accent: "text-theme-sun-accent",
    text: "text-theme-sun-text",
  },
  graffiti: {
    ...base,
    container: clsx(base.container, "bg-theme-graffiti-background text-theme-graffiti-text"),
    card: clsx(base.card, "bg-theme-graffiti-card"),
    link: "rounded-full bg-theme-graffiti-accent px-4 py-3 text-center font-semibold text-white shadow-lg hover:opacity-90",
    accent: "text-theme-graffiti-accent",
    text: "text-theme-graffiti-text",
  },
  rainbow: {
    ...base,
    container: clsx(base.container, "bg-gradient-to-br from-orange-400 via-pink-500 to-indigo-500 text-theme-rainbow-text"),
    card: clsx(base.card, "bg-theme-rainbow-card backdrop-blur"),
    link: "rounded-full bg-theme-rainbow-accent px-4 py-3 text-center font-semibold text-white shadow-lg hover:opacity-90",
    accent: "text-theme-rainbow-accent",
    text: "text-theme-rainbow-text",
  },
};

export function getTheme(themeName?: string | null): ThemeTokens {
  if (!themeName) {
    return themes.default;
  }

  return themes[(themeName as ThemeName) in themes ? (themeName as ThemeName) : "default"];
}
