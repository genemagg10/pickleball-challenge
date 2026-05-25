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
        cactus: {
          50: "#eef3ef",
          100: "#dce8e0",
          300: "#7a9d8b",
          500: "#3d7a5f",
          600: "#2e5a48",
          800: "#234539",
        },
        sage: {
          100: "#dde7e1",
          300: "#9fb8a8",
          600: "#6a8a7a",
          800: "#3f5a4e",
        },
        clay: {
          100: "#ecdedf",
          300: "#b1969a",
          600: "#7d5e5f",
          800: "#4a3536",
        },
        sun: {
          100: "#f3dfce",
          300: "#dba07a",
          500: "#c4682c",
          600: "#a85620",
          800: "#7b3d14",
        },
        bloom: {
          100: "#f6d4e2",
          300: "#e88ab1",
          500: "#d8267a",
          800: "#7a1244",
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
