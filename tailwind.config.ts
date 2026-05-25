import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f4efe5",
          dark: "#ebe3d2",
        },
        ink: {
          DEFAULT: "#0f0f0f",
          soft: "#525252",
          mute: "#8a8a8a",
        },
        court: {
          DEFAULT: "#3aa856",
          dark: "#2c8043",
        },
        teamA: {
          DEFAULT: "#1d4ed8",
          light: "#dbeafe",
        },
        teamB: {
          DEFAULT: "#dc2626",
          light: "#fee2e2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
