/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        decorative: ['"Cinzel Decorative"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        albion: {
          abyss: '#040609',
          bg: '#080c14',
          surface: '#0f1624',
          card: '#141d2e',
          'card-hover': '#1b273d',
          elevated: '#1a2438',
          border: '#22304d',
          'border-gold': '#5c4314',
          'border-bright-gold': '#d4af37',
          gold: '#e5c158',
          'gold-light': '#fdf0cd',
          'gold-dark': '#8a6a1d',
          'gold-parchment': '#fef3c7',
          silver: '#9cb3c9',
          crimson: '#e11d48',
          emerald: '#10b981',
          azure: '#38bdf8',
          amethyst: '#a855f7',
        },
        tier: {
          3: '#22c55e',
          4: '#38bdf8',
          5: '#f43f5e',
          6: '#fb923c',
          7: '#eab308',
          8: '#f8fafc',
        },
        ench: {
          0: '#94a3b8',
          1: '#4ade80',
          2: '#38bdf8',
          3: '#c084fc',
          4: '#fbbf24',
        }
      },
      boxShadow: {
        'gold-glow': '0 0 18px -2px rgba(229, 193, 88, 0.3)',
        'blue-glow': '0 0 18px -2px rgba(56, 189, 248, 0.3)',
        'amber-glow': '0 0 18px -2px rgba(251, 191, 36, 0.35)',
        'emerald-glow': '0 0 18px -2px rgba(16, 185, 129, 0.35)',
        'crimson-glow': '0 0 18px -2px rgba(225, 29, 72, 0.35)',
        'forged-bevel': 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 28px -6px rgba(0, 0, 0, 0.75)',
        'gold-embossed': 'inset 0 1px 1px rgba(254, 240, 138, 0.4), 0 0 20px -3px rgba(212, 175, 55, 0.4)',
      }
    },
  },
  plugins: [],
}
