import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        brand: {
          50: "#e7f8f3",
          100: "#c5f0e6",
          200: "#9ae4d4",
          300: "#5fd4bc",
          400: "#2ec4a4",
          500: "#00a884",
          600: "#008f72",
          700: "#008069",
          800: "#075e54",
          900: "#054c44",
          950: "#032e28",
        },
        wa: {
          panel: "#f0f2f5",
          chat: "#e7ede8",
          header: "#008069",
          bubbleOut: "#d9fdd3",
          bubbleIn: "#ffffff",
          input: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f0f2f5",
          border: "#d1d7db",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 168, 132, 0.08)",
      },
      maxWidth: {
        app: "72rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
