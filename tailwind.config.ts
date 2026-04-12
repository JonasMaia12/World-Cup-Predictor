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
          bg:      '#0c0a00',
          sidebar: '#1a1500',
          gold:    '#f59e0b',
          text:    '#fef3c7',
          border:  '#78350f',
          muted:   '#92400e',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
