/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pirate-gold': '#FFD700',
        'pirate-brown': '#8B4513',
        'pirate-red': '#DC143C',
        'ocean-blue': '#006994',
        'ship-wood': '#8B4513',
        'treasure-gold': '#DAA520',
        'skull-white': '#F5F5DC',
      },
      fontFamily: {
        pirate: ['Creepster', 'cursive'],
        maritime: ['Pirata One', 'serif'],
      },
      animation: {
        'treasure-glow': 'treasure-glow 2s ease-in-out infinite alternate',
        'ship-rock': 'ship-rock 3s ease-in-out infinite',
        'coin-flip': 'coin-flip 0.6s ease-in-out',
      },
      keyframes: {
        'treasure-glow': {
          '0%': { boxShadow: '0 0 5px #FFD700' },
          '100%': { boxShadow: '0 0 20px #FFD700, 0 0 30px #FFD700' },
        },
        'ship-rock': {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'coin-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}