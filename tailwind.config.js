/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Retired neon brand — deprecated aliases into the cabin palette
        // (DESIGN.md §2). Do not use neon-* names in new code; use --p8-*
        // tokens directly. The rgb(var(--p8-*-ch) / <alpha-value>) form keeps
        // Tailwind opacity modifiers (/20, /50, …) working.
        'neon-cyan': 'rgb(var(--p8-signal-ch) / <alpha-value>)',
        'neon-blue': 'rgb(var(--p8-signal-ch) / <alpha-value>)',
        'neon-magenta': 'rgb(var(--p8-threat-ch) / <alpha-value>)',
        'neon-orange': 'rgb(var(--p8-lamp-ch) / <alpha-value>)',
        'neon-purple': 'rgb(var(--p8-brass-ch) / <alpha-value>)',
        'neon-gold': 'rgb(var(--p8-lamp-ch) / <alpha-value>)',
        'neon-green': 'rgb(var(--p8-signal-ch) / <alpha-value>)',
        'ocean-blue': 'rgb(var(--p8-deep-ch) / <alpha-value>)',
        'bg-dark-0': 'rgb(var(--p8-ink-ch) / <alpha-value>)',
        'bg-dark-1': 'rgb(var(--p8-ink-ch) / <alpha-value>)',
        'bg-dark-2': 'rgb(var(--p8-deep-ch) / <alpha-value>)',
        'bg-dark-3': 'rgb(var(--p8-deep-ch) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['var(--font-instrument)', 'JetBrains Mono', 'monospace'],
        // Orbitron is retired (DESIGN.md §3). "tech" now resolves to the world face.
        tech: ['var(--font-world)', 'Georgia', 'serif'],
        world: ['var(--font-world)', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'Inter', 'sans-serif'],
      },
      zIndex: {
        'toast': '9999',
        'modal': '99999',
        'dropdown': '1000',
        'header': '100',
        'privacy-panel': '50',
      },
      privacy: {
        'safe': '#22c55e',
        'low': '#eab308',
        'medium': '#f97316',
        'high': '#ef4444',
        'critical': '#dc2626',
      },
      animation: {
        'treasure-glow': 'treasure-glow 2s ease-in-out infinite alternate', // lamp glow, not neon
        'ship-rock': 'ship-rock 3s ease-in-out infinite',
        'coin-flip': 'coin-flip 0.6s ease-in-out',
        'neon-glow': 'neon-glow 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float-smooth 3s ease-in-out infinite',
        'float-delayed': 'float-smooth 3s ease-in-out infinite 1s',
        'grid-pulse': 'grid-pulse 3s ease-in-out infinite',
        'panel-glow': 'panel-glow 4s ease-in-out infinite',
        'subtle-glow': 'subtle-glow 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'leakage-pulse': 'leakage-pulse 2s ease-in-out infinite',
        'ghost-fleet-shimmer': 'ghost-fleet-shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'treasure-glow': {
          '0%': { boxShadow: '0 0 5px #F0B24A' },
          '100%': { boxShadow: '0 0 20px #F0B24A, 0 0 30px #F0B24A' },
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
        'subtle-glow': {
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'leakage-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        'ghost-fleet-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}