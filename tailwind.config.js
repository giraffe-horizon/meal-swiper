/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981', // Szmaragdowy (Emerald 500) - bardziej soczysty
        'background-light': '#FAFAF8',
        'background-dark': '#0B120F', // Głęboki, niemal czarny zielony (Obsidian Forest)
        'surface-light': '#ffffff',
        'surface-dark': '#16221E', // Ciemna powierzchnia
        'text-primary-light': '#101915',
        'text-primary-dark': '#ECF3F0', // Off-white z nutą mięty
        'text-secondary-light': '#588d75',
        'text-secondary-dark': '#94B4A6', // Przygaszona szałwia
        'border-light': '#E2E8F0',
        'border-dark': '#24332D', // Ciemna krawędź
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
