/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-container": "#3b82f6",
        secondary: "#0284c7",
        "secondary-container": "#38bdf8",
        tertiary: "#1d4ed8",
        surface: "#f8fafc",
        "surface-container": "#eff6ff",
      },
    },
  },
  plugins: [],
};
