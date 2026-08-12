/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium Fintech palette
        ink: '#000000',
        carbon: '#0a0a0b',
        panel: '#111113',
        line: 'rgba(255,255,255,0.08)',
        lineStrong: 'rgba(255,255,255,0.14)',
        brand: {
          DEFAULT: '#FF5A26',
          dim: 'rgba(255,90,38,0.12)',
          glow: 'rgba(255,90,38,0.35)',
        },
        cream: '#f5f5f4',
        muted: 'rgba(245,245,244,0.55)',
        faint: 'rgba(245,245,244,0.50)',
        success: '#34d399',
        danger:  '#EB5757',
        // category accents
        dispensa:  '#f5a623',
        bebidas:   '#3aa0ff',
        talho:     '#ff6b6b',
        laticinios:'#9b7bff',
        fresco:    '#34d399',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', '"DM Sans"', 'system-ui', 'sans-serif'],
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
