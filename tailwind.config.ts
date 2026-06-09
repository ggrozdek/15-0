import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "oklch(0.13 0.028 255)",
          900: "oklch(0.18 0.033 255)",
          850: "oklch(0.22 0.035 255)",
          800: "oklch(0.27 0.035 255)",
        },
        steel: "oklch(0.82 0.018 245)",
        flood: "oklch(0.67 0.16 245)",
        frost: "oklch(0.94 0.012 240)",
        signal: "oklch(0.76 0.13 205)",
      },
      boxShadow: {
        flood: "0 24px 90px rgba(28, 87, 177, 0.25)",
        card: "0 18px 50px rgba(0, 0, 0, 0.32)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-120%) rotate(8deg)" },
          "100%": { transform: "translateX(120%) rotate(8deg)" },
        },
        pulseRing: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.97)" },
          "50%": { opacity: "0.82", transform: "scale(1.03)" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        sweep: "sweep 7s ease-out infinite",
        pulseRing: "pulseRing 3s ease-in-out infinite",
        modalIn: "modalIn 260ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
