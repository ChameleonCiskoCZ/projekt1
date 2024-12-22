import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        zoomInOut: "zoomInOut 1s ease-in-out",
      },
      keyframes: {
        zoomInOut: {
          "0%": { fontSize: "1rem" },
          "50%": { fontSize: "1.1rem" },
          "100%": { fontSize: "1rem" },
        },
      },
      
    },
  },
  plugins: [],
};
export default config
