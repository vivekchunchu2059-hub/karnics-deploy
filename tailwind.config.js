/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          soft: '#f7e8c4',
          dark: '#6B5A2E',
        },
        silver: {
          DEFAULT: '#9e9e9e',
          soft: '#e3e3e3',
        },
      },
      boxShadow: {
        card: '0 6px 18px rgba(17, 24, 39, 0.08)',
      },
    },
  },
  plugins: [],
};

