/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Cedarville Cursive', 'cursive'],
        cursive: ['Love Light', 'cursive'],
        manrope: ['Manrope', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif']
      },
    },
  },
  plugins: [],
} 