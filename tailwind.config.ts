import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11231d",
        moss: "#1d4d45",
        ember: "#d97341",
        oat: "#f4efe6",
        wheat: "#d9c6a3",
        cloud: "#f8f6f1"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(17, 35, 29, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["BIZ UDPGothic", "Yu Gothic", "Hiragino Sans", "sans-serif"],
        display: ["Yu Mincho", "Hiragino Mincho ProN", "serif"]
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at top, rgba(217, 115, 65, 0.18), transparent 35%), radial-gradient(circle at 20% 20%, rgba(29, 77, 69, 0.12), transparent 25%)"
      }
    }
  },
  plugins: []
};

export default config;
