import type { ScoreMap } from '@/engine/types'

function isScoreMap(v: unknown): v is ScoreMap {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  return Object.values(v).every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).home === 'number' &&
      typeof (entry as Record<string, unknown>).away === 'number',
  )
}

export function encodeState(scores: ScoreMap): string {
  const json = JSON.stringify(scores)
  return btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeState(search: string): ScoreMap | null {
  try {
    const s = new URLSearchParams(search).get('s')
    if (!s) return null
    // Restore standard base64 from base64url
    const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    const parsed: unknown = JSON.parse(json)
    if (!isScoreMap(parsed)) return null
    return parsed
  } catch {
    return null
  }
}
