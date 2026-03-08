/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D6A4F',
        'background-light': '#FAFAF8',
        'background-dark': '#151d19',
        'surface-light': '#ffffff',
        'surface-dark': '#1a2a23',
        'text-primary-light': '#101915',
        'text-primary-dark': '#e9f1ee',
        'text-secondary-light': '#588d75',
        'text-secondary-dark': '#8ebda6',
        'border-light': '#d3e4dc',
        'border-dark': '#2a4237',
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
