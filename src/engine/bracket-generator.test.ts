import { describe, it, expect } from 'vitest'
import { generateBracket, advanceWinner } from './bracket-generator'
import { classifyGroup } from './classifier'
import type { ScoreMap, GroupStandings } from './types'
import { GROUPS } from '@/data/wc2026'

// Build a GroupStandings where each group has a clear winner (no ties)
function buildCompleteStandings(): GroupStandings {
  // Use the same clear-winner scores for every group (adapted per group fixture IDs)
  const standings: GroupStandings = {}
  for (const group of GROUPS) {
    const prefix = group.id
    const [_t1, , _t3, _t4] = group.teams
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

describe('advanceWinner', () => {
  it('returns "home" when home goals > away goals', () => {
    expect(advanceWinner('r32-1', { 'r32-1': { home: 2, away: 1 } })).toBe('home')
  })

  it('returns "away" when away goals > home goals', () => {
    expect(advanceWinner('r32-1', { 'r32-1': { home: 0, away: 3 } })).toBe('away')
  })

  it('returns null when scores are tied', () => {
    expect(advanceWinner('r32-1', { 'r32-1': { home: 1, away: 1 } })).toBeNull()
  })

  it('returns null when no score exists for matchId', () => {
    expect(advanceWinner('r32-1', {})).toBeNull()
  })
})

describe('generateBracket — round sizes', () => {
  it('roundOf16 has exactly 8 matches', () => {
    expect(generateBracket(buildCompleteStandings()).roundOf16).toHaveLength(8)
  })

  it('quarterFinals has exactly 4 matches', () => {
    expect(generateBracket(buildCompleteStandings()).quarterFinals).toHaveLength(4)
  })

  it('semiFinals has exactly 2 matches', () => {
    expect(generateBracket(buildCompleteStandings()).semiFinals).toHaveLength(2)
  })
})

describe('generateBracket — cascade', () => {
  it('propagates r32 winners into r16 when scores provided', () => {
    const standings = buildCompleteStandings()
    const b0 = generateBracket(standings)
    const m0 = b0.roundOf32[0]
    const m1 = b0.roundOf32[1]
    const scores: ScoreMap = {
      [m0.id]: { home: 2, away: 0 }, // home wins
      [m1.id]: { home: 0, away: 1 }, // away wins
    }
    const b1 = generateBracket(standings, scores)
    expect(b1.roundOf16[0].home).toBe(m0.home)
    expect(b1.roundOf16[0].away).toBe(m1.away)
  })

  it('r16 slot is null when r32 match has no score', () => {
    const b = generateBracket(buildCompleteStandings(), {})
    expect(b.roundOf16[0].home).toBeNull()
    expect(b.roundOf16[0].away).toBeNull()
  })

  it('cascades all the way to the final when all matches scored (home wins all)', () => {
    const standings = buildCompleteStandings()
    const scores: ScoreMap = {}

    const b0 = generateBracket(standings)
    for (const m of b0.roundOf32) scores[m.id] = { home: 1, away: 0 }

    const b1 = generateBracket(standings, scores)
    for (const m of b1.roundOf16) scores[m.id] = { home: 1, away: 0 }

    const b2 = generateBracket(standings, scores)
    for (const m of b2.quarterFinals) scores[m.id] = { home: 1, away: 0 }

    const b3 = generateBracket(standings, scores)
    for (const m of b3.semiFinals) scores[m.id] = { home: 1, away: 0 }

    const final = generateBracket(standings, scores)
    expect(final.final.home).toBe(b3.semiFinals[0].home)
    expect(final.final.away).toBe(b3.semiFinals[1].home)
  })

  it('thirdPlace gets SF losers when SF away teams win', () => {
    const standings = buildCompleteStandings()
    const scores: ScoreMap = {}

    const b0 = generateBracket(standings)
    for (const m of b0.roundOf32) scores[m.id] = { home: 1, away: 0 }

    const b1 = generateBracket(standings, scores)
    for (const m of b1.roundOf16) scores[m.id] = { home: 1, away: 0 }

    const b2 = generateBracket(standings, scores)
    for (const m of b2.quarterFinals) scores[m.id] = { home: 1, away: 0 }

    const b3 = generateBracket(standings, scores)
    // Away wins SF — home teams go to 3rd place
    for (const m of b3.semiFinals) scores[m.id] = { home: 0, away: 1 }

    const final = generateBracket(standings, scores)
    expect(final.thirdPlace.home).toBe(b3.semiFinals[0].home)
    expect(final.thirdPlace.away).toBe(b3.semiFinals[1].home)
  })

  it('uses thirdQualifiers to select 3rd-place teams when provided', () => {
    const standings = buildCompleteStandings()
    const qids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const bracket = generateBracket(standings, {}, qids)
    // 3rd-place teams appear as `away` in r32 slots 8–15 (template rows 8–15)
    const thirdSlots = bracket.roundOf32.slice(8).map((m) => m.away)
    expect(thirdSlots.every((s) => s !== null)).toBe(true)
  })
})
