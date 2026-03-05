import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        burnt: {
          DEFAULT: "#C75B28",
          50: "#FAF0EB",
          100: "#F3D9CC",
          200: "#E8B599",
          300: "#DC8F64",
          400: "#D17340",
          500: "#C75B28",
          600: "#A84820",
          700: "#883618",
          800: "#672812",
          900: "#4A1C0D",
        },
        magic: {
          DEFAULT: "#8B5CF6",
          50: "#F5F0FF",
          100: "#EDE5FF",
          200: "#D8C4FD",
          300: "#BF9BFB",
          400: "#A87AF8",
          500: "#8B5CF6",
          600: "#7540E8",
          700: "#5E2DCE",
          800: "#4A1FAF",
          900: "#351590",
        },
        moss: {
          DEFAULT: "#7D8B6F",
          50: "#F2F4EF",
          100: "#E3E7DC",
          200: "#C6CFBB",
          300: "#A9B89A",
          400: "#8EA180",
          500: "#7D8B6F",
          600: "#68745C",
          700: "#525C49",
          800: "#3D4536",
          900: "#282E23",
        },
        cream: "#FAF7F2",
        ink: "#1A1A1A",
        mushroom: "#C41E3A",
        gold: "#D4A853",
      },
      fontFamily: {
        display: ["var(--font-caveat)", "cursive"],
        serif: ["var(--font-eb-garamond)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-magic": "linear-gradient(135deg, #8B5CF6 0%, #7D8B6F 100%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
