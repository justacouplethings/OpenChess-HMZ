/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#302e2b',
          sidebar: '#262421',
          panel: '#21201d',
          card: '#272522',
          border: '#3d3b38',
          text: '#ffffff',
          muted: '#9e9c98',
          green: {
            DEFAULT: '#81b64c',
            hover: '#a3d160',
            active: '#6f9c3f',
            dark: '#457524',
          },
          eval: {
            white: '#f1f1f1',
            black: '#262421',
          },
          review: {
            brilliant: '#1baca6',
            great: '#5c8bb0',
            best: '#95b945',
            excellent: '#95b945',
            good: '#96bc4b',
            book: '#d5a47d',
            inaccuracy: '#f7c631',
            mistake: '#e6912c',
            blunder: '#ca3431',
          }
        }
      }
    },
  },
  plugins: [],
}
