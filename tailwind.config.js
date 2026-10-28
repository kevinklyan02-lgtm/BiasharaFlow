/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf3',
          100: '#d1fadf',
          500: '#12b76a',
          600: '#079455',
          700: '#067647',
          800: '#085d3a',
          900: '#0b3d2e',
          950: '#062a20',
        },
        accent: { 50: '#f1efff', 100: '#e4e0ff', 600: '#4f3fd1', 700: '#4132b3' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
