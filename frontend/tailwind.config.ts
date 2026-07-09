import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec0ff",
          400: "#599dff",
          500: "#3478f6",
          600: "#215bdb",
          700: "#1c48b0",
          800: "#1c3d8c",
          900: "#1c3670",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
