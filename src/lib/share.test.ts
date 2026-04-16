import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from './share'
import type { ScoreMap } from '@/engine/types'

describe('encodeState / decodeState', () => {
  it('round-trip preserves scores', () => {
    const scores: ScoreMap = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
      B3: { home: 0, away: 3 },
    }
    const encoded = encodeState(scores)
    expect(decodeState(`?s=${encoded}`)).toEqual(scores)
  })

  it('round-trip with empty scores object', () => {
    const encoded = encodeState({})
    expect(decodeState(`?s=${encoded}`)).toEqual({})
  })

  it('returns null when ?s= param is absent', () => {
    expect(decodeState('')).toBeNull()
    expect(decodeState('?foo=bar')).toBeNull()
  })

  it('returns null for corrupted base64', () => {
    expect(decodeState('?s=!!!invalid!!!')).toBeNull()
  })

  it('returns null for valid base64 but invalid JSON', () => {
    const notJson = btoa('not-json-at-all')
    expect(decodeState(`?s=${notJson}`)).toBeNull()
  })

  it('returns null for JSON that is not an object', () => {
    const arr = btoa(JSON.stringify([1, 2, 3]))
    expect(decodeState(`?s=${arr}`)).toBeNull()
  })

  it('URL with 32 scores stays under 2000 chars', () => {
    const scores: ScoreMap = {}
    for (let i = 0; i < 32; i++) {
      scores[`match-${i}`] = { home: Math.floor(Math.random() * 5), away: Math.floor(Math.random() * 5) }
    }
    const url = `https://example.com/?s=${encodeState(scores)}`
    expect(url.length).toBeLessThan(2000)
  })
})
