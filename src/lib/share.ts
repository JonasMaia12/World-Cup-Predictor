import type { ScoreMap } from '@/engine/types'

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
    const json = atob(base64)
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as ScoreMap
  } catch {
    return null
  }
}
