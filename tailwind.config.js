/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Google Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { DEFAULT: '#111827', 700: '#1f2937' },
        brand: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46' },
      },
    },
  },
  plugins: [],
}
