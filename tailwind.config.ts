import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Whiteboard base — cool near-white with a faint green-gray cast.
        bg: "#F2F4F3",
        surface: "#FFFFFF",
        surfacemuted: "#E9EDEB",
        // Ink
        ink: "#22262B",
        "ink-muted": "#5B6460",
        "ink-faint": "#8A938E",
        // Hairline / structure
        line: "#D8DEDA",
        "line-strong": "#C1C9C4",
        // Chalkboard-green primary accent — UI chrome only, never data.
        accent: "#2F6F4F",
        "accent-dark": "#234F39",
        "accent-soft": "#E3EEE7",
        "accent-soft-strong": "#CBE0D3",
        // Heat scale — reserved exclusively for confusion data.
        "heat-cool": "#3E7CB1",
        "heat-amber": "#E8A33D",
        "heat-red": "#D6432F",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "heat-soak": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "60%": { opacity: "var(--heat-target-opacity, 0.7)" },
          "100%": { opacity: "var(--heat-target-opacity, 0.7)", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "heat-soak": "heat-soak 900ms ease-out both",
        "fade-up": "fade-up 400ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
