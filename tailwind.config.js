/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-maroon': '#8a3a3a',
        'brand-mustard': '#eac262',
      }
    },
  },
  plugins: [],
}
