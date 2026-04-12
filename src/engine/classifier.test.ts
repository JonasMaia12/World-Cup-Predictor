import { describe, it, expect } from 'vitest'
import { classifyGroup } from './classifier'
import type { ScoreMap } from './types'
import { GROUPS } from '@/data/wc2026'

describe('classifyGroup', () => {
  it('returns 4 standings for a completed group with clear winner', () => {
    // Group A: MEX, RSA, KOR, CZE
    const groupA = GROUPS[0]
    const scores: ScoreMap = {
      A1: { home: 2, away: 0 }, // MEX 2-0 RSA
      A2: { home: 1, away: 1 }, // KOR 1-1 CZE
      A3: { home: 3, away: 1 }, // MEX 3-1 KOR
      A4: { home: 0, away: 2 }, // RSA 0-2 CZE
      A5: { home: 1, away: 0 }, // MEX 1-0 CZE
      A6: { home: 2, away: 2 }, // RSA 2-2 KOR
    }
    // MEX: 9pts, CZE: 4pts, KOR: 2pts, RSA: 1pt
    const standings = classifyGroup(groupA, scores)
    expect(standings).toHaveLength(4)
    expect(standings[0].teamCode).toBe('MEX')
    expect(standings[0].points).toBe(9)
    expect(standings[0].won).toBe(3)
    expect(standings[0].goalsFor).toBe(6)
    expect(standings[0].goalDiff).toBe(5)
    expect(standings[1].teamCode).toBe('CZE')
    expect(standings[1].points).toBe(4)
    expect(standings[2].teamCode).toBe('KOR')
    expect(standings[2].points).toBe(2)
    expect(standings[3].teamCode).toBe('RSA')
    expect(standings[3].points).toBe(1)
  })

  it('ignores matches with no score (partial results)', () => {
    const groupA = GROUPS[0]
    const scores: ScoreMap = {
      A1: { home: 1, away: 0 }, // MEX 1-0 RSA — only one match played
    }
    const standings = classifyGroup(groupA, scores)
    expect(standings).toHaveLength(4)
    const mex = standings.find((s) => s.teamCode === 'MEX')!
    expect(mex.played).toBe(1)
    expect(mex.points).toBe(3)
    const rsa = standings.find((s) => s.teamCode === 'RSA')!
    expect(rsa.played).toBe(1)
    expect(rsa.points).toBe(0)
    const kor = standings.find((s) => s.teamCode === 'KOR')!
    expect(kor.played).toBe(0)
    expect(kor.points).toBe(0)
  })

  it('returns empty-stats standings for a group with no scores at all', () => {
    const groupA = GROUPS[0]
    const standings = classifyGroup(groupA, {})
    expect(standings).toHaveLength(4)
    standings.forEach((s) => {
      expect(s.played).toBe(0)
      expect(s.points).toBe(0)
      expect(s.goalDiff).toBe(0)
    })
  })

  it('correctly computes drawn match stats', () => {
    const groupA = GROUPS[0]
    const scores: ScoreMap = {
      A1: { home: 2, away: 2 }, // MEX 2-2 RSA
    }
    const standings = classifyGroup(groupA, scores)
    const mex = standings.find((s) => s.teamCode === 'MEX')!
    const rsa = standings.find((s) => s.teamCode === 'RSA')!
    expect(mex.drawn).toBe(1)
    expect(mex.points).toBe(1)
    expect(mex.goalDiff).toBe(0)
    expect(rsa.drawn).toBe(1)
    expect(rsa.points).toBe(1)
  })
})
