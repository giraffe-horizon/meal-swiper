/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#69dd96', // Main accent green
        background: '#0e1512', // Main dark background
        'surface-dim': '#0e1512', // Alias for background
        'on-surface': '#dde4df', // Primary text on dark surfaces
        'on-surface-variant': '#94B4A6', // Secondary text on dark surfaces
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
        'surface-container': '#1a211e', // Container surface (cards, inputs)
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
