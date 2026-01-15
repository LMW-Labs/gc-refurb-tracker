/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gc-red': '#CC0000',
        'gc-red-dark': '#990000',
      },
      fontFamily: {
        'heading': ['Oswald', 'sans-serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
