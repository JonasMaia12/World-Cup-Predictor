import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
      colors: {
        wcp: {
          bg:               'var(--wcp-bg)',
          surface:          'var(--wcp-surface)',
          'surface-subtle': 'var(--wcp-surface-subtle)',
          primary:          'var(--wcp-primary)',
          'primary-light':  'var(--wcp-primary-light)',
          'primary-faint':  'var(--wcp-primary-faint)',
          text:             'var(--wcp-text)',
          muted:            'var(--wcp-muted)',
          border:           'var(--wcp-border)',
          header:           'var(--wcp-header)',
        },
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        championEntry: {
          '0%':   { opacity: '0', transform: 'translateY(24px) scale(0.92)' },
          '60%':  { opacity: '1', transform: 'translateY(-4px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        sparkle: {
          '0%':   { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%':  { opacity: '1', transform: 'scale(1.2) rotate(180deg)' },
          '100%': { opacity: '0', transform: 'scale(0) rotate(360deg)' },
        },
      },
      animation: {
        slideDown:     'slideDown 0.3s ease',
        championEntry: 'championEntry 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pulse2:        'pulse2 2s ease-in-out infinite',
        sparkle:       'sparkle 1.2s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
