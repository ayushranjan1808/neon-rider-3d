/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0a16',
          darker: '#05050b',
          cyan: '#00f3ff',
          magenta: '#ff007f',
          green: '#39ff14',
          yellow: '#ffe600',
          blue: '#1f51ff',
          pink: '#ff1493',
        }
      },
      animation: {
        'grid-scroll': 'gridScroll 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gridScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(50%)' },
        },
      },
    },
  },
  plugins: [],
}
