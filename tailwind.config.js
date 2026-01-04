/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        segoe: ["'Segoe UI'", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        georgia: ["Georgia", "serif"],
      },
      colors: {
        // Nordic Premium palette
        nordic: {
          primary: "#020617",   // Din mörka bakgrund
          secondary: "#F7F8FA", // Din ljusa text
          accent: "#45D0C1",    // Turkos accent
          highlight: "#5F6368", 
          support: "#E2E8F0",
          card: "#1e293b",      // Mörk kortfärg
        },
        // Gamla teman behålls här
        theme: {
          nordic: {
            background: "#020617",
            card: "#F7F8FA",
            accent: "#45D0C1",
            text: "#F7F8FA",
          },
          default: {
            background: "#f5f5f5",
            card: "#ffffff",
            accent: "#1d4ed8",
            text: "#111827",
          },
          elegant: {
            background: "#f3f4f6",
            card: "#ffffff",
            accent: "#6b21a8",
            text: "#111827",
          },
          dark: {
            background: "#0f172a",
            card: "#1f2937",
            accent: "#2563eb",
            text: "#f9fafb",
          },
          neon: {
            background: "#0f172a",
            card: "#1f2937",
            accent: "#22d3ee",
            text: "#f9fafb",
          },
          sun: {
            background: "#fff7ed",
            card: "#fffbeb",
            accent: "#f97316",
            text: "#78350f",
          },
          graffiti: {
            background: "#111827",
            card: "#1f2937",
            accent: "#f97316",
            text: "#f9fafb",
          },
          rainbow: {
            background: "linear-gradient(135deg, #f97316, #ec4899, #6366f1)",
            card: "rgba(255,255,255,0.9)",
            accent: "#ec4899",
            text: "#111827",
          },
        },
      },
    },
  },
  plugins: [],
}