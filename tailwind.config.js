/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm sunset palette — terracotta & sand, not corporate black
        ink: '#1c140f',
        carbon: '#241a14',
        panel: '#2b2019',
        line: 'rgba(247,230,208,0.09)',
        lineStrong: 'rgba(247,230,208,0.16)',
        brand: {
          DEFAULT: '#D9713C',
          dim: 'rgba(217,113,60,0.14)',
          glow: 'rgba(217,113,60,0.35)',
        },
        cream: '#F7EFE3',
        muted: 'rgba(247,239,227,0.58)',
        faint: 'rgba(247,239,227,0.52)',
        success: '#8FB996',
        danger:  '#E2604A',
        // category accents
        dispensa:  '#E8A33D',
        bebidas:   '#4FA9A0',
        talho:     '#E2604A',
        laticinios:'#B98CA6',
        fresco:    '#8FB996',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255,90,38,0.22)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(255,90,38,0.3)' },
          '50%': { boxShadow: '0 0 18px rgba(255,90,38,0.6)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out both',
        shimmer: 'shimmer 2.2s linear infinite',
        'glow-brand': 'glow-pulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
