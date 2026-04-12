import { describe, it, expect } from 'vitest'
import { generateBracket } from './bracket-generator'
import { classifyGroup } from './classifier'
import type { ScoreMap, GroupStandings } from './types'
import { GROUPS } from '@/data/wc2026'

// Build a GroupStandings where each group has a clear winner (no ties)
function buildCompleteStandings(): GroupStandings {
  // Use the same clear-winner scores for every group (adapted per group fixture IDs)
  const standings: GroupStandings = {}
  for (const group of GROUPS) {
    const prefix = group.id
    const [t1, , t3, t4] = group.teams
    // T1 wins all, T3 draws with T4, T2 loses all → clear order
    const scores: ScoreMap = {
      [`${prefix}1`]: { home: 2, away: 0 }, // T1 2-0 T2
      [`${prefix}2`]: { home: 1, away: 1 }, // T3 1-1 T4
      [`${prefix}3`]: { home: 2, away: 0 }, // T1 2-0 T3
      [`${prefix}4`]: { home: 0, away: 1 }, // T2 0-1 T4
      [`${prefix}5`]: { home: 1, away: 0 }, // T1 1-0 T4
      [`${prefix}6`]: { home: 0, away: 2 }, // T2 0-2 T3
    }
    standings[group.id] = classifyGroup(group, scores)
  }
  return standings
}

describe('generateBracket', () => {
  it('produces a bracket with 16 Round of 32 matches', () => {
    const standings = buildCompleteStandings()
    const bracket = generateBracket(standings)
    expect(bracket.roundOf32).toHaveLength(16)
  })

  it('all Round of 32 matches have non-null home and away teams', () => {
    const standings = buildCompleteStandings()
    const bracket = generateBracket(standings)
    for (const match of bracket.roundOf32) {
      expect(match.home).not.toBeNull()
      expect(match.away).not.toBeNull()
    }
  })

  it('Round of 32 teams are all unique (32 distinct teams)', () => {
    const standings = buildCompleteStandings()
    const bracket = generateBracket(standings)
    const teams = bracket.roundOf32.flatMap((m) => [m.home!, m.away!])
    expect(teams).toHaveLength(32)
    expect(new Set(teams).size).toBe(32)
  })

  it('later rounds have null slots (not yet determined)', () => {
    const standings = buildCompleteStandings()
    const bracket = generateBracket(standings)
    expect(bracket.roundOf16.every((m) => m.home === null && m.away === null)).toBe(true)
    expect(bracket.quarterFinals.every((m) => m.home === null && m.away === null)).toBe(true)
    expect(bracket.semiFinals.every((m) => m.home === null && m.away === null)).toBe(true)
    expect(bracket.final.home).toBeNull()
    expect(bracket.thirdPlace.home).toBeNull()
  })

  it('returns null slots for all rounds when standings are empty', () => {
    const bracket = generateBracket({})
    expect(bracket.roundOf32.every((m) => m.home === null && m.away === null)).toBe(true)
  })
})
