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
        'neon-cyan': '#00D9FF',
        'neon-magenta': '#FF006E',
        'neon-orange': '#FF6B35',
        'neon-purple': '#C71585',
        'neon-gold': '#FFD700',
        'bg-dark-0': '#0a0e27',
        'bg-dark-1': '#0f1629',
        'bg-dark-2': '#151d3b',
        'bg-dark-3': '#1a2550',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        tech: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'treasure-glow': 'treasure-glow 2s ease-in-out infinite alternate',
        'ship-rock': 'ship-rock 3s ease-in-out infinite',
        'coin-flip': 'coin-flip 0.6s ease-in-out',
        'neon-glow': 'neon-glow 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float-smooth 3s ease-in-out infinite',
        'grid-pulse': 'grid-pulse 3s ease-in-out infinite',
        'panel-glow': 'panel-glow 4s ease-in-out infinite',
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
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}