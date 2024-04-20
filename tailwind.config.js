/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./imports/ui/**/*.{js,html,svelte}",
    "./imports/ui/*.{js,html,svelte}",
    "./imports/ui/**/**/*.{js,html,svelte}",
    "./client/*.html",
  ],
  theme: {
    container: {
      center: true,
    },
    "extend": {
      "screens": {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
