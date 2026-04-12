import { describe, it, expect } from 'vitest'
import { classifyGroup } from './classifier'
import type { ScoreMap } from './types'
import { GROUPS } from '@/data/wc2026'

describe('classifyGroup', () => {
  it('returns 4 standings for a completed group', () => {
    const groupA = GROUPS[0] // MEX, RSA, KOR, CZE
    const scores: ScoreMap = {
      A1: { home: 2, away: 0 }, // MEX 2-0 RSA
      A2: { home: 1, away: 1 }, // KOR 1-1 CZE
      A3: { home: 3, away: 1 }, // MEX 3-1 KOR
      A4: { home: 0, away: 2 }, // RSA 0-2 CZE
      A5: { home: 1, away: 0 }, // MEX 1-0 CZE
      A6: { home: 2, away: 2 }, // RSA 2-2 KOR
    }
    const standings = classifyGroup(groupA, scores)
    expect(standings).toHaveLength(4)
    // MEX: 9pts should be first
    expect(standings[0].teamCode).toBe('MEX')
    expect(standings[0].points).toBe(9)
  })
})
