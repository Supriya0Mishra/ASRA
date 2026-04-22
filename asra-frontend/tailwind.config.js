/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- IMPORTANT: This must be here
  theme: {
    extend: {
      colors: {
        brand: { 500: '#0ea5e9', 600: '#0284c7' }
      }
    },
  },
  plugins: [],
}