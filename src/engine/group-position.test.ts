import { describe, it, expect } from 'vitest'
import { generateGroupScoresForOrder } from './group-position'
import { classifyGroup } from './classifier'
import { FIXTURES, GROUPS, TEAMS } from '@/data/wc2026'

describe('generateGroupScoresForOrder', () => {
  it('returns ScoreMap with 6 entries for a group', () => {
    const group = GROUPS.find((g) => g.id === 'A')!
    const fixtures = FIXTURES.filter((f) => f.group === 'A')
    const scores = generateGroupScoresForOrder(group.teams, fixtures, TEAMS)
    expect(Object.keys(scores)).toHaveLength(6)
  })

  it('no match ends in a draw', () => {
    const group = GROUPS.find((g) => g.id === 'A')!
    const fixtures = FIXTURES.filter((f) => f.group === 'A')
    const scores = generateGroupScoresForOrder(group.teams, fixtures, TEAMS)
    for (const score of Object.values(scores)) {
      expect(score.home).not.toBe(score.away)
    }
  })

  it('resulting standings match the requested order', () => {
    const group = GROUPS.find((g) => g.id === 'A')!
    const fixtures = FIXTURES.filter((f) => f.group === 'A')
    // Reverse the default draw order to test a non-trivial reordering
    const reversed = [...group.teams].reverse()
    const scores = generateGroupScoresForOrder(reversed, fixtures, TEAMS)
    const standings = classifyGroup(group, scores)
    expect(standings.map((s) => s.teamCode)).toEqual(reversed)
  })

  it('all returned scores are non-negative integers', () => {
    const group = GROUPS.find((g) => g.id === 'B')!
    const fixtures = FIXTURES.filter((f) => f.group === 'B')
    const scores = generateGroupScoresForOrder(group.teams, fixtures, TEAMS)
    for (const { home, away } of Object.values(scores)) {
      expect(Number.isInteger(home)).toBe(true)
      expect(Number.isInteger(away)).toBe(true)
      expect(home).toBeGreaterThanOrEqual(0)
      expect(away).toBeGreaterThanOrEqual(0)
    }
  })
})
