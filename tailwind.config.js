import tailwindAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Proposition 2 — Modernité et Clarté
        navy: {
          50:  "#eef2f8",
          100: "#d5dfee",
          200: "#afc3de",
          300: "#849fcb",
          400: "#5f82b8",
          500: "#3d67a3",
          600: "#2d508a",
          700: "#254070",
          800: "#1E3A5F",   // #1E3A5F — primary dark navy
          900: "#132340",
        },
        // maroon - Proposition 1 accent
        maroon: {
          50:  "#fcf6f7",
          100: "#f7eaed",
          200: "#edd2d8",
          300: "#dfb0bb",
          400: "#ca8596",
          500: "#7a2a37",   // #7A2A37 — maroon accent
          600: "#6b2230",
          700: "#5a1a27",
          800: "#49151f",
          900: "#3d141b",
        },
        steel: {
          100: "#f0f4f8",   // #F0F4F8 — page background
          200: "#dce8f2",
          300: "#c4d8ea",
          400: "#A4C6E5",   // #A4C6E5 — light blue
          500: "#7aabd4",
          600: "#4f8fbd",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
}
