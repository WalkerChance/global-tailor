import type { Config } from "tailwindcss";

/**
 * Mobile-first by default (Tailwind's breakpoints are min-width).
 * Design tokens mirror the plan's tailoring identity: navy wool, chalk paper, brass.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ground: "var(--ground)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        brass: "var(--brass)",
        navy: "var(--navy)",
        chalk: "var(--chalk)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        app: "900px",
      },
    },
  },
  plugins: [],
};

export default config;
