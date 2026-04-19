import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wcp: {
          bg:             '#f0f4f1',
          surface:        '#ffffff',
          'surface-subtle': '#e8f5ec',
          primary:        '#00a854',
          'primary-light': '#00c866',
          'primary-faint': 'rgba(0,200,102,0.08)',
          text:           '#1a2a1a',
          muted:          '#607060',
          border:         'rgba(0,200,102,0.13)',
        },
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.3s ease',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
