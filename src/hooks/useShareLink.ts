import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { encodeState } from '@/lib/share'

export function useShareLink() {
  const [copied, setCopied] = useState(false)
  const scores = useStore((s) => s.scores)

  const share = useCallback(async () => {
    const encoded = encodeState(scores)
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — silent no-op for now
    }
  }, [scores])

  return { share, copied }
}
