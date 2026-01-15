/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}", 
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#e6f7f1',
          100: '#ccefe3',
          200: '#99dfc7',
          300: '#66cfab',
          400: '#33bf8f',
          500: '#00ad85', // base teal
          600: '#009973',
          700: '#007758',
          800: '#00573f',
          900: '#003f2e',
        },
        black: '#000000',
        white: '#ffffff'
      },
    },
  },
  plugins: [],
};


