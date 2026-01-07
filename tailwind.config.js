/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{md,njk}",
    "./src/_includes/**/*.njk",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "c-bg": "#f9fafb",
        "c-bg-alt": "#f3f4f6",
        "c-txt": "#1f2937",
        "c-txt-alt": "#6b7280",
        "c-txt-em": "#111827",
        "primary": "#0ea5e9",
        "primary-600": "#0284c7",
        "code-bg": "#f3f4f6",
      },
      maxWidth: {
        wrapper: "65rem",
        "prose-custom": "65ch",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
