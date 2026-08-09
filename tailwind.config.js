/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1F5C3F', dark: '#0F3D28', light: '#2E7D50' },
        gold: { DEFAULT: '#B8860B', light: '#D4A017' },
        obsidian: '#0B0F0D',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
