/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        game: ["'Press Start 2P'", "monospace"],
      },
      colors: {
        "game-bg": "#0d0d1a",
        "game-panel": "#1a1a2e",
        "game-accent": "#f0c040",
        "game-red": "#e05050",
        "game-green": "#50e090",
        "game-blue": "#5080e0",
      },
    },
  },
  plugins: [],
};
