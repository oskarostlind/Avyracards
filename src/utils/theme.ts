// src/utils/theme.ts
import clsx from "clsx";

export type ThemeName =
  | "default"
  | "elegant"
  | "dark"
  | "neon"
  | "sun"
  | "graffiti"
  | "rainbow";

export interface ThemeTokens {
  bg: string;
  container: string;
  card: string;
  link: string;
  accent: string;
  text: string;
  textMuted: string;
}

const base = {
  container: "p-6",
  card: "rounded-3xl p-6 shadow-xl",
  link: "rounded-full px-4 py-3 text-center text-sm font-semibold transition",
  accent: "text-nordic-accent",
  text: "text-nordic-secondary",
  textMuted: "text-nordic-highlight",
};

export const themes: Record<ThemeName, ThemeTokens> = {
  default: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary"),
    card: clsx(
      base.card,
      "bg-nordic-primary/80 border border-nordic-highlight/30 backdrop-blur"
    ),
    link: clsx(
      base.link,
      "bg-nordic-secondary text-nordic-primary hover:bg-nordic-support"
    ),
    accent: "text-nordic-accent",
    text: "text-nordic-secondary",
    textMuted: "text-nordic-highlight",
  },
  elegant: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary/90"),
    card: clsx(
      base.card,
      "bg-gradient-to-b from-nordic-primary to-nordic-primary/80 border border-nordic-support/30"
    ),
    link: clsx(
      base.link,
      "bg-transparent border border-nordic-support/40 text-nordic-secondary hover:bg-nordic-primary/60"
    ),
    accent: "text-nordic-accent",
    text: "text-nordic-secondary",
    textMuted: "text-nordic-highlight",
  },
  dark: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary"),
    card: clsx(
      base.card,
      "bg-nordic-primary/80 border border-nordic-highlight/40 backdrop-blur"
    ),
    link: clsx(
      base.link,
      "bg-nordic-primary/60 border border-nordic-highlight/40 text-nordic-secondary hover:bg-nordic-primary/50"
    ),
    accent: "text-nordic-secondary",
    text: "text-nordic-secondary",
    textMuted: "text-nordic-highlight",
  },
  neon: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary"),
    card: clsx(
      base.card,
      "bg-nordic-primary border border-nordic-accent/30 shadow-[0_0_40px_theme(colors.nordic.accent)]"
    ),
    link: clsx(
      base.link,
      "bg-nordic-accent text-nordic-primary shadow-lg hover:bg-nordic-accent/80"
    ),
    accent: "text-nordic-accent",
    text: "text-nordic-secondary",
    textMuted: "text-nordic-secondary/80",
  },
  sun: {
    bg: "bg-nordic-secondary",
    container: clsx(
      base.container,
      "bg-nordic-secondary/80 border border-nordic-support/60"
    ),
    card: clsx(
      base.card,
      "bg-nordic-secondary border border-nordic-support shadow-lg shadow-nordic-support/30 text-nordic-primary"
    ),
    link: clsx(
      base.link,
      "bg-nordic-accent text-nordic-primary shadow hover:bg-nordic-accent/90"
    ),
    accent: "text-nordic-accent",
    text: "text-nordic-primary",
    textMuted: "text-nordic-highlight",
  },
  graffiti: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary"),
    card: clsx(
      base.card,
      "bg-[radial-gradient(circle_at_top,_theme(colors.nordic.accent)_0,_theme(colors.nordic.primary)_45%,_theme(colors.nordic.primary)_100%)] border border-nordic-highlight/30"
    ),
    link: clsx(
      base.link,
      "bg-nordic-accent text-nordic-primary shadow hover:bg-nordic-accent/90"
    ),
    accent: "text-nordic-accent",
    text: "text-nordic-secondary",
    textMuted: "text-nordic-highlight",
  },
  rainbow: {
    bg: "bg-nordic-primary",
    container: clsx(base.container, "bg-nordic-primary"),
    card: clsx(
      base.card,
      "bg-[conic-gradient(at_top,_theme(colors.nordic.accent),_theme(colors.nordic.secondary),_theme(colors.nordic.highlight),_theme(colors.nordic.accent))] text-nordic-primary"
    ),
    link: clsx(
      base.link,
      "bg-nordic-secondary text-nordic-primary shadow hover:bg-nordic-support"
    ),
    accent: "text-nordic-primary",
    text: "text-nordic-primary",
    textMuted: "text-nordic-highlight",
  },
};

export function getTheme(themeName?: string | null): ThemeTokens {
  if (!themeName) return themes.default;

  if (themeName in themes) {
    return themes[themeName as ThemeName];
  }

  return themes.default;
}
