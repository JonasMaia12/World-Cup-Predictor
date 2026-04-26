import { useState, useEffect } from 'react'

/**
 * Single-call hook — only mount once (in DarkModeToggle inside AppShell).
 * Multiple callers would each own independent state and drift out of sync.
 */
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    // First visit: honour the OS preference (guard for jsdom/SSR where matchMedia is absent)
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
