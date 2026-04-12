import { describe, it, expect } from 'vitest'
import { applyTiebreakers } from './tiebreaker'
import type { ScoreMap, Standing } from './types'
import { GROUPS } from '@/data/wc2026'

// Helper: build a minimal Standing object
function makeStanding(teamCode: string, points: number, goalDiff = 0, goalsFor = 0): Standing {
  return { teamCode, points, goalDiff, goalsFor, played: 3, won: 0, drawn: 0, lost: 0, goalsAgainst: goalsFor - goalDiff }
}

describe('applyTiebreakers', () => {
  it('returns single team unchanged', () => {
    const groupA = GROUPS[0] // MEX, RSA, KOR, CZE
    const result = applyTiebreakers([makeStanding('MEX', 4)], {}, groupA)
    expect(result).toHaveLength(1)
    expect(result[0].teamCode).toBe('MEX')
  })

  it('resolves tie via head-to-head points', () => {
    // Group A: MEX and RSA tied on 4pts overall
    // But in their direct match: MEX 2-0 RSA → MEX has 3 H2H pts, RSA has 0
    const groupA = GROUPS[0] // MEX, RSA, KOR, CZE — A1: MEX vs RSA
    const scores: ScoreMap = { A1: { home: 2, away: 0 } } // MEX 2-0 RSA
    const tied = [makeStanding('RSA', 4), makeStanding('MEX', 4)]
    const result = applyTiebreakers(tied, scores, groupA)
    expect(result[0].teamCode).toBe('MEX') // MEX wins H2H
  })

  it('resolves tie via head-to-head goal difference when H2H points equal', () => {
    // Group A: MEX and RSA — both drew 1-1 in H2H (equal H2H pts)
    // MEX has better overall GD
    const groupA = GROUPS[0]
    const scores: ScoreMap = { A1: { home: 1, away: 1 } } // MEX 1-1 RSA
    const tied = [
      makeStanding('RSA', 4, -1, 2),
      makeStanding('MEX', 4, +2, 5),
    ]
    const result = applyTiebreakers(tied, scores, groupA)
    // H2H pts equal (1 each), H2H GD equal (0 each), H2H GF equal (1 each)
    // Falls to overall GD: MEX +2 > RSA -1
    expect(result[0].teamCode).toBe('MEX')
  })

  it('falls back to draw order when all criteria equal', () => {
    // Both teams completely equal — fallback to group.teams order
    const groupA = GROUPS[0] // draw order: MEX=0, RSA=1, KOR=2, CZE=3
    const tied = [makeStanding('RSA', 4), makeStanding('MEX', 4)]
    const result = applyTiebreakers(tied, {}, groupA)
    // MEX is at index 0 in group draw, RSA at index 1 → MEX first
    expect(result[0].teamCode).toBe('MEX')
  })

  it('resolves three-way tie', () => {
    // KOR, CZE, RSA all on 1pt (RSA: 1pt GD 0, KOR: 1pt GD -1, CZE: 1pt GD +1)
    const groupA = GROUPS[0]
    const tied = [
      makeStanding('KOR', 1, -1, 2),
      makeStanding('CZE', 1, +1, 3),
      makeStanding('RSA', 1, 0, 2),
    ]
    const result = applyTiebreakers(tied, {}, groupA)
    expect(result).toHaveLength(3)
    // No H2H scores → falls to overall GD: CZE(+1) > RSA(0) > KOR(-1)
    expect(result[0].teamCode).toBe('CZE')
    expect(result[1].teamCode).toBe('RSA')
    expect(result[2].teamCode).toBe('KOR')
  })

  it('resolves tie via head-to-head goals for when H2H points and GD equal', () => {
    // 3-way tie: MEX, RSA, KOR — all draws in H2H fixtures:
    //   A1: MEX 2-2 RSA, A3: MEX 1-1 KOR, A6: RSA 0-0 KOR
    //   MEX H2H: pts=2, GD=0, GF=3 | RSA H2H: pts=2, GD=0, GF=2 | KOR H2H: pts=2, GD=0, GF=1
    //   H2H pts equal → H2H GD equal → H2H GF: MEX(3) > RSA(2) > KOR(1) ✅
    const groupA = GROUPS[0] // MEX(t1), RSA(t2), KOR(t3), CZE(t4)
    // A1: MEX vs RSA, A3: MEX vs KOR, A6: RSA vs KOR
    const scores: ScoreMap = {
      A1: { home: 2, away: 2 }, // MEX 2-2 RSA
      A3: { home: 1, away: 1 }, // MEX 1-1 KOR
      A6: { home: 0, away: 0 }, // RSA 0-0 KOR
    }
    const tied = [
      makeStanding('KOR', 2, 0, 1),
      makeStanding('RSA', 2, 0, 2),
      makeStanding('MEX', 2, 0, 3),
    ]
    const result = applyTiebreakers(tied, scores, groupA)
    // H2H pts all equal (2 each), H2H GD all equal (0 each)
    // H2H GF: MEX=3, RSA=2, KOR=1 → MEX first, RSA second, KOR third
    expect(result).toHaveLength(3)
    expect(result[0].teamCode).toBe('MEX')
    expect(result[1].teamCode).toBe('RSA')
    expect(result[2].teamCode).toBe('KOR')
  })
})
