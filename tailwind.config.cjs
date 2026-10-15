/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#4568ff',
          700: '#2442c7',
          900: '#10216e',
        },
        accent: '#6cf0c2',
        ink: '#0f172a',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.14)',
      },
      borderRadius: {
        screen: '2rem',
      },
    },
  },
  plugins: [],
}
