/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sisu: {
          blue: '#4AABE1',
          yellow: '#F7B32B',
          red: '#FF6B6B',
          green: '#4CAF50',
          'blue-light': '#7BC4EA',
          'blue-dark': '#3588B3',
        },
      },
    },
  },
  plugins: [],
}
