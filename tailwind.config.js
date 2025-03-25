/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0eefb',
          200: '#bfd7f2',
          300: '#92b9e3',
          400: '#6694d1',
          500: '#4272be',
          600: '#2f569e',
          700: '#25447e',
          800: '#1f3666',
          900: '#1a2a4f',
          950: '#0f172a',
        },
        secondary: {
          50: '#fbf8f1',
          100: '#f7f0dd',
          200: '#efe0bb',
          300: '#e6ce93',
          400: '#dcb765',
          500: '#d19e3b',
          600: '#bd842f',
          700: '#9c6829',
          800: '#7d5328',
          900: '#654523',
          950: '#352310',
        },
        law: {
          50: '#fafbfd',
          100: '#f9f9fb',
          200: '#ecedf2',
          300: '#dddfe7',
          400: '#c1c4d3',
          500: '#9fa4bb',
          600: '#7d84a3',
          700: '#666e8c',
          800: '#4d5268',
          900: '#2c303c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'elegant': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'elegant-lg': '0 10px 30px -3px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'law-pattern': "url('/patterns/law-pattern.png')",
        'scales-of-justice': "url('/images/scales-subtle.svg')",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 