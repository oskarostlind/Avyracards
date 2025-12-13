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
  bg: string;        // <-- NYTT: Bakgrundsfärg för hela sidan
  container: string;
  card: string;
  link: string;
  accent: string;
  text: string;
  textMuted: string; // <-- NYTT: Färg för sekundär text (t.ex. bio)
}

const base = {
  container: "p-6",
  card: "rounded-3xl p-6 shadow-xl",
  link: "",
  accent: "",
  text: "",
};

export const themes: Record<ThemeName, ThemeTokens> = {
  default: {
    bg: "bg-slate-950",
    container: clsx(base.container, "bg-slate-900"),
    card: clsx(
      base.card,
      "bg-slate-900/80 border border-slate-800 backdrop-blur"
    ),
    link: "rounded-full bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-200 transition",
    accent: "text-violet-400",
    text: "text-slate-50",
    textMuted: "text-slate-400",
  },
  elegant: {
    bg: "bg-slate-950",
    container: clsx(base.container, "bg-slate-900"),
    card: clsx(
      base.card,
      "bg-gradient-to-b from-slate-900 to-black border border-slate-700/80"
    ),
    link: "rounded-full bg-slate-50/90 px-4 py-3 text-center text-sm font-medium text-slate-900 hover:bg-white transition",
    accent: "text-amber-300",
    text: "text-slate-50",
    textMuted: "text-slate-400",
  },
  dark: {
    bg: "bg-black",
    container: clsx(base.container, "bg-neutral-900"),
    card: clsx(
      base.card,
      "bg-neutral-900 border border-neutral-800/80 backdrop-blur"
    ),
    link: "rounded-full bg-neutral-800 px-4 py-3 text-center text-sm font-medium text-neutral-100 hover:bg-neutral-700 transition",
    accent: "text-neutral-300",
    text: "text-neutral-100",
    textMuted: "text-neutral-400",
  },
  neon: {
    bg: "bg-slate-950",
    container: clsx(base.container, "bg-slate-900"),
    card: clsx(
      base.card,
      "bg-slate-950 border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.45)]"
    ),
    link: "rounded-full bg-violet-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg hover:bg-violet-400 transition",
    accent: "text-violet-400",
    text: "text-slate-50",
    textMuted: "text-violet-200",
  },
  sun: {
    bg: "bg-amber-50",
    container: clsx(
      base.container,
      "bg-gradient-to-b from-amber-100 to-amber-300"
    ),
    card: clsx(
      base.card,
      "bg-white/90 border border-amber-200 shadow-lg shadow-amber-200/40"
    ),
    link: "rounded-full bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white shadow hover:bg-amber-400 transition",
    accent: "text-amber-600",
    text: "text-slate-900",
    textMuted: "text-amber-700/80",
  },
  graffiti: {
    bg: "bg-slate-950",
    container: clsx(
      base.container,
      "bg-slate-900"
    ),
    card: clsx(
      base.card,
      "bg-[radial-gradient(circle_at_top,_#22c55e_0,_#0f172a_45%,_#020617_100%)] border border-slate-800"
    ),
    link: "rounded-full bg-lime-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow hover:bg-lime-300 transition",
    accent: "text-lime-300",
    text: "text-slate-50",
    textMuted: "text-slate-400",
  },
  rainbow: {
    bg: "bg-slate-950",
    container: clsx(base.container, "bg-slate-900"),
    card: clsx(
      base.card,
      "bg-[conic-gradient(at_top,_#f97316,_#e11d48,_#6366f1,_#22c55e,_#f97316)] text-white"
    ),
    link: "rounded-full bg-white/90 px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow hover:bg-white transition",
    accent: "text-white",
    text: "text-white",
    textMuted: "text-slate-100",
  },
};

export function getTheme(themeName?: string | null): ThemeTokens {
  if (!themeName) return themes.default;

  if (themeName in themes) {
    return themes[themeName as ThemeName];
  }

  return themes.default;
}