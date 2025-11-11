/**** Tailwind Config ****/ 
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/ui/**/*.{html,js,jsx,ts,tsx}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0e13',
        card: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.08)'
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}
