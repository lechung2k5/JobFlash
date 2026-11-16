/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6f00c5",
        "primary-container": "#8b2ce6",
        secondary: "#b5005c",
        "secondary-container": "#df1875",
        tertiary: "#4632c0",
        surface: "#fef7ff",
        "surface-container": "#f4eaff",
      },
    },
  },
  plugins: [],
};
