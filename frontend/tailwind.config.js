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
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        albion: {
          bg: '#090c13',
          surface: '#111724',
          card: '#161e2e',
          'card-hover': '#1c263a',
          border: '#232e47',
          'border-gold': '#57461e',
          gold: '#e5c158',
          'gold-light': '#fdf0cd',
          'gold-dark': '#8a6a1d',
          silver: '#9cb3c9',
          crimson: '#e11d48',
          emerald: '#10b981',
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
        'gold-glow': '0 0 15px -3px rgba(229, 193, 88, 0.25)',
        'blue-glow': '0 0 15px -3px rgba(56, 189, 248, 0.25)',
        'amber-glow': '0 0 15px -3px rgba(251, 191, 36, 0.3)',
      }
    },
  },
  plugins: [],
}
