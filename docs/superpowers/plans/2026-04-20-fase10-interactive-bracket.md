# Fase 10 — Interactive Bracket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the knockout bracket fully interactive — users click bracket cards to enter results, winners cascade automatically through all rounds, group order can be defined explicitly, and the champion appears highlighted.

**Architecture:** A single `ScoreMap` covers both group (`A1`…`L6`) and knockout (`r32-1`…`final`, `3rd`) match IDs without namespace collision. `generateBracket(standings, scores, thirdQualifiers)` derives the full cascaded bracket on every render. Bracket is never stored in Zustand — always derived. No new types introduced.

**Tech Stack:** React 19, TypeScript, Vitest (TDD on engine/store), Zustand, Tailwind + `wcp-*` design tokens, `@testing-library/react`.

---

## File Structure

**Create:**
- `src/engine/group-position.ts` — `generateGroupScoresForOrder`
- `src/engine/group-position.test.ts`
- `src/components/bracket/KnockoutMatchModal.tsx`
- `src/components/bracket/KnockoutMatchModal.test.tsx`
- `src/components/groups/GroupPositionPicker.tsx`
- `src/components/groups/GroupPositionPicker.test.tsx`
- `src/components/layout/AppShell.test.tsx`

**Modify:**
- `src/engine/bracket-generator.ts` — export `advanceWinner`; fix round array sizes (r16→8, qf→4, sf→2); add cascade propagation; add optional `thirdQualifiers` param
- `src/engine/bracket-generator.test.ts` — add `advanceWinner` tests + cascade tests + round-size tests
- `src/engine/simulator.ts` — add `simulateKnockoutMatch`
- `src/engine/simulator.test.ts` — add 4 tests for `simulateKnockoutMatch`
- `src/store/tournament.slice.ts` — add `thirdQualifiers: string[]` field + 5 new actions
- `src/store/tournament.slice.test.ts` — add store tests for new actions
- `src/components/bracket/BracketView.tsx` — fix desktop slice sizes; add `champion` + `onMatchClick` props; champion banner
- `src/components/bracket/BracketView.test.tsx` — update `makeEmptyBracket` sizes; add champion banner + click tests
- `src/components/groups/GroupGrid.tsx` — pass `scores` + `thirdQualifiers` to `generateBracket`; compute `champion`; wire `KnockoutMatchModal`
- `src/components/groups/MatchModal.tsx` — add GroupPositionPicker trigger button in header
- `src/components/layout/AppShell.tsx` — add "Limpar tudo" button before Simulate

---

## Task 1: Engine — `advanceWinner` + bracket cascade + fix round sizes (TDD)

**Files:**
- Modify: `src/engine/bracket-generator.ts`
- Modify: `src/engine/bracket-generator.test.ts`

- [ ] **Step 1: Add failing tests to `bracket-generator.test.ts`**

Add the following `import` line at the top (after the existing imports):
```ts
import { advanceWinner } from './bracket-generator'
```

Append these `describe` blocks at the end of the file:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
cd /Users/macbookpro/Documents/Jonas/World-Cup-Predictor
npm run test -- bracket-generator
```

Expected: FAIL — `advanceWinner` not exported, cascade tests fail, round sizes wrong.

- [ ] **Step 3: Replace `src/engine/bracket-generator.ts` with the updated implementation**

```ts
import type { GroupStandings, Bracket, BracketMatch, Standing, ScoreMap } from './types'

const ROUND_OF_32_TEMPLATE: Array<[string, string]> = [
  ['1A', '2B'], ['1B', '2A'],
  ['1C', '2D'], ['1D', '2C'],
  ['1E', '2F'], ['1F', '2E'],
  ['1G', '2H'], ['1H', '2G'],
  ['1I', '3-1'], ['1J', '3-2'],
  ['1K', '3-3'], ['1L', '3-4'],
  ['2I', '3-5'], ['2J', '3-6'],
  ['2K', '3-7'], ['2L', '3-8'],
]

export function advanceWinner(matchId: string, scores: ScoreMap): 'home' | 'away' | null {
  const score = scores[matchId]
  if (!score) return null
  if (score.home === score.away) return null
  return score.home > score.away ? 'home' : 'away'
}

function pickSide(match: BracketMatch, side: 'home' | 'away' | null): string | null {
  if (!side) return null
  return side === 'home' ? match.home : match.away
}

function selectBest3rds(standings: GroupStandings): Standing[] {
  const thirds: Standing[] = Object.values(standings)
    .filter((group) => group.length >= 3)
    .map((group) => group[2])

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
}

function selectBest3rdsFromGroups(standings: GroupStandings, groupIds: string[]): string[] {
  const thirds = groupIds
    .map((id) => standings[id]?.[2])
    .filter((s): s is Standing => s !== undefined)

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
    .map((s) => s.teamCode)
}

function resolveSlot(
  key: string,
  winners: Record<string, string>,
  runnersUp: Record<string, string>,
  best3rds: string[],
): string | null {
  if (key.startsWith('1')) return winners[key[1]] ?? null
  if (key.startsWith('2')) return runnersUp[key[1]] ?? null
  if (key.startsWith('3-')) return best3rds[parseInt(key.slice(2)) - 1] ?? null
  return null
}

export function generateBracket(
  standings: GroupStandings,
  scores: ScoreMap = {},
  thirdQualifiers?: string[],
): Bracket {
  const winners: Record<string, string> = {}
  const runnersUp: Record<string, string> = {}

  for (const [groupId, groupStandings] of Object.entries(standings)) {
    if (groupStandings[0]) winners[groupId] = groupStandings[0].teamCode
    if (groupStandings[1]) runnersUp[groupId] = groupStandings[1].teamCode
  }

  const best3rds =
    thirdQualifiers && thirdQualifiers.length > 0
      ? selectBest3rdsFromGroups(standings, thirdQualifiers)
      : selectBest3rds(standings).map((s) => s.teamCode)

  const roundOf32: BracketMatch[] = ROUND_OF_32_TEMPLATE.map(([homeKey, awayKey], i) => ({
    id: `r32-${i + 1}`,
    home: resolveSlot(homeKey, winners, runnersUp, best3rds),
    away: resolveSlot(awayKey, winners, runnersUp, best3rds),
  }))

  const roundOf16: BracketMatch[] = Array.from({ length: 8 }, (_, i) => ({
    id: `r16-${i + 1}`,
    home: pickSide(roundOf32[i * 2], advanceWinner(roundOf32[i * 2].id, scores)),
    away: pickSide(roundOf32[i * 2 + 1], advanceWinner(roundOf32[i * 2 + 1].id, scores)),
  }))

  const quarterFinals: BracketMatch[] = Array.from({ length: 4 }, (_, i) => ({
    id: `qf-${i + 1}`,
    home: pickSide(roundOf16[i * 2], advanceWinner(roundOf16[i * 2].id, scores)),
    away: pickSide(roundOf16[i * 2 + 1], advanceWinner(roundOf16[i * 2 + 1].id, scores)),
  }))

  const semiFinals: BracketMatch[] = Array.from({ length: 2 }, (_, i) => ({
    id: `sf-${i + 1}`,
    home: pickSide(quarterFinals[i * 2], advanceWinner(quarterFinals[i * 2].id, scores)),
    away: pickSide(quarterFinals[i * 2 + 1], advanceWinner(quarterFinals[i * 2 + 1].id, scores)),
  }))

  const sf0 = semiFinals[0]
  const sf1 = semiFinals[1]
  const sf0Winner = advanceWinner(sf0.id, scores)
  const sf1Winner = advanceWinner(sf1.id, scores)

  const final: BracketMatch = {
    id: 'final',
    home: pickSide(sf0, sf0Winner),
    away: pickSide(sf1, sf1Winner),
  }

  const thirdPlace: BracketMatch = {
    id: '3rd',
    home: sf0Winner ? (sf0Winner === 'home' ? sf0.away : sf0.home) : null,
    away: sf1Winner ? (sf1Winner === 'home' ? sf1.away : sf1.home) : null,
  }

  return { roundOf32, roundOf16, quarterFinals, semiFinals, thirdPlace, final }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- bracket-generator
```

Expected: All tests PASS (including the existing 5 + new 13 = 18 total).

**Note:** The existing test `'later rounds have null slots'` now checks `roundOf16.every(...)` over 8 items instead of 16 — it still passes because all are null.

- [ ] **Step 5: Commit**

```bash
git add src/engine/bracket-generator.ts src/engine/bracket-generator.test.ts
git commit -m "feat: bracket cascade — advanceWinner, correct round sizes, r32→final propagation"
```

---

## Task 2: Engine — `simulateKnockoutMatch` (TDD)

**Files:**
- Modify: `src/engine/simulator.ts`
- Modify: `src/engine/simulator.test.ts`

- [ ] **Step 1: Add failing tests to `simulator.test.ts`**

Add this import at the top (after the existing imports):
```ts
import { simulateKnockoutMatch } from './simulator'
```

Append this `describe` block at the end of the file:

```ts
describe('simulateKnockoutMatch', () => {
  it('never returns a draw (100 tries)', () => {
    for (let i = 0; i < 100; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS)
      expect(r.home).not.toBe(r.away)
    }
  })

  it('with forcedWinner as home team, home wins every time (50 tries)', () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS, 'ARG')
      expect(r.home).toBeGreaterThan(r.away)
    }
  })

  it('with forcedWinner as away team, away wins every time (50 tries)', () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS, 'BRA')
      expect(r.away).toBeGreaterThan(r.home)
    }
  })

  it('returns non-negative integers', () => {
    const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS)
    expect(Number.isInteger(r.home)).toBe(true)
    expect(Number.isInteger(r.away)).toBe(true)
    expect(r.home).toBeGreaterThanOrEqual(0)
    expect(r.away).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```bash
npm run test -- simulator
```

Expected: FAIL — `simulateKnockoutMatch` not exported.

- [ ] **Step 3: Add `simulateKnockoutMatch` to `src/engine/simulator.ts`**

Append after `simulateMissingMatches`:

```ts
export function simulateKnockoutMatch(
  homeCode: string,
  awayCode: string,
  teams: Team[],
  forcedWinner?: string,
): { home: number; away: number } {
  const homeTeam = teams.find((t) => t.code === homeCode)
  const awayTeam = teams.find((t) => t.code === awayCode)

  if (!homeTeam || !awayTeam) {
    return forcedWinner === awayCode ? { home: 0, away: 1 } : { home: 1, away: 0 }
  }

  const MAX_ATTEMPTS = 20
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = simulateMatch(homeTeam.rank, awayTeam.rank)
    if (result.home === result.away) continue
    if (!forcedWinner) return result
    if (forcedWinner === homeCode && result.home > result.away) return result
    if (forcedWinner === awayCode && result.away > result.home) return result
  }

  // Fallback after MAX_ATTEMPTS (guarantees a result even in extreme rank scenarios)
  if (forcedWinner === awayCode) return { home: 0, away: 1 }
  return { home: 1, away: 0 }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- simulator
```

Expected: All simulator tests PASS (9 existing + 4 new = 13 total).

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulator.ts src/engine/simulator.test.ts
git commit -m "feat: simulateKnockoutMatch — Poisson with forced winner, no draws"
```

---

## Task 3: Engine — `generateGroupScoresForOrder` (TDD)

**Files:**
- Create: `src/engine/group-position.ts`
- Create: `src/engine/group-position.test.ts`

- [ ] **Step 1: Create `src/engine/group-position.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- group-position
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/engine/group-position.ts`**

```ts
import type { Match, Team } from '@/data/wc2026'
import type { ScoreMap } from './types'
import { simulateKnockoutMatch } from './simulator'

// Returns ScoreMap for all fixtures in a group such that final standings
// match orderedTeams (index 0 = 1st place, index 3 = 4th place).
// Each match is simulated via Poisson with the higher-positioned team forced to win.
// This guarantees distinct point totals (9/6/3/0), so no tiebreaker ambiguity arises.
export function generateGroupScoresForOrder(
  orderedTeams: string[],
  fixtures: Match[],
  teams: Team[],
): ScoreMap {
  const scores: ScoreMap = {}
  for (const fixture of fixtures) {
    const homePos = orderedTeams.indexOf(fixture.homeTeam)
    const awayPos = orderedTeams.indexOf(fixture.awayTeam)
    const forcedWinner = homePos < awayPos ? fixture.homeTeam : fixture.awayTeam
    scores[fixture.id] = simulateKnockoutMatch(
      fixture.homeTeam,
      fixture.awayTeam,
      teams,
      forcedWinner,
    )
  }
  return scores
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- group-position
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/group-position.ts src/engine/group-position.test.ts
git commit -m "feat: generateGroupScoresForOrder — Poisson scores matching explicit group ranking"
```

---

## Task 4: Store — `thirdQualifiers` + new actions (TDD)

**Files:**
- Modify: `src/store/tournament.slice.ts`
- Modify: `src/store/tournament.slice.test.ts`

- [ ] **Step 1: Add failing tests to `tournament.slice.test.ts`**

First, add this import to the **top** of the file alongside the existing imports:
```ts
import { FIXTURES, GROUPS, TEAMS } from '@/data/wc2026'
```

Then append these describe blocks at the end of the file:

```ts

describe('TournamentSlice — resetAll', () => {
  it('clears all scores and thirdQualifiers', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 1)
    store.getState().addThirdQualifier('A')
    store.getState().resetAll()
    expect(store.getState().scores).toEqual({})
    expect(store.getState().thirdQualifiers).toEqual([])
  })
})

describe('TournamentSlice — simulateKnockoutWinner', () => {
  it('stores a score where the forced winner wins (home wins)', () => {
    const store = makeStore()
    // ARG is the forced home winner
    store.getState().simulateKnockoutWinner('r32-1', 'ARG', 'BRA', 'ARG')
    const score = store.getState().scores['r32-1']
    expect(score).toBeDefined()
    expect(score.home).toBeGreaterThan(score.away)
  })

  it('stores a score where the forced winner wins (away wins)', () => {
    const store = makeStore()
    store.getState().simulateKnockoutWinner('r32-1', 'ARG', 'BRA', 'BRA')
    const score = store.getState().scores['r32-1']
    expect(score).toBeDefined()
    expect(score.away).toBeGreaterThan(score.home)
  })
})

describe('TournamentSlice — pickGroupOrder', () => {
  it('writes scores for all 6 group fixtures', () => {
    const store = makeStore()
    const group = GROUPS.find((g) => g.id === 'A')!
    store.getState().pickGroupOrder('A', [...group.teams].reverse())
    const aFixtures = FIXTURES.filter((f) => f.group === 'A')
    const scores = store.getState().scores
    expect(aFixtures.every((f) => scores[f.id] !== undefined)).toBe(true)
  })

  it('overwrites existing group scores but leaves other groups untouched', () => {
    const store = makeStore()
    store.getState().setScore('B1', 3, 3)
    const group = GROUPS.find((g) => g.id === 'A')!
    store.getState().pickGroupOrder('A', group.teams)
    expect(store.getState().scores['B1']).toEqual({ home: 3, away: 3 })
  })
})

describe('TournamentSlice — addThirdQualifier / removeThirdQualifier', () => {
  it('adds a group to thirdQualifiers', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    expect(store.getState().thirdQualifiers).toContain('A')
  })

  it('does not add duplicate', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    store.getState().addThirdQualifier('A')
    expect(store.getState().thirdQualifiers).toHaveLength(1)
  })

  it('blocks adding a 9th qualifier (max is 8)', () => {
    const store = makeStore()
    for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      store.getState().addThirdQualifier(id)
    }
    store.getState().addThirdQualifier('I')
    expect(store.getState().thirdQualifiers).toHaveLength(8)
    expect(store.getState().thirdQualifiers).not.toContain('I')
  })

  it('removes a group from thirdQualifiers', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    store.getState().removeThirdQualifier('A')
    expect(store.getState().thirdQualifiers).not.toContain('A')
  })
})
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
npm run test -- tournament.slice
```

Expected: FAIL — new actions don't exist yet.

- [ ] **Step 3: Replace `src/store/tournament.slice.ts`**

```ts
import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'
import { simulateMissingMatches, simulateKnockoutMatch } from '@/engine/simulator'
import { generateGroupScoresForOrder } from '@/engine/group-position'
import { FIXTURES, TEAMS } from '@/data/wc2026'

export interface TournamentSlice {
  scores: ScoreMap
  thirdQualifiers: string[]
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
  resetAll: () => void
  clearScore: (matchId: string) => void
  simulateMissing: () => void
  simulateKnockoutWinner: (
    matchId: string,
    homeCode: string,
    awayCode: string,
    winnerCode: string,
  ) => void
  pickGroupOrder: (groupId: string, orderedTeams: string[]) => void
  addThirdQualifier: (groupId: string) => void
  removeThirdQualifier: (groupId: string) => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  thirdQualifiers: [],

  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),

  setScores: (scores) => set({ scores }),

  resetScores: () => set({ scores: {} }),

  resetAll: () => set({ scores: {}, thirdQualifiers: [] }),

  clearScore: (matchId) =>
    set((state) => {
      const { [matchId]: _removed, ...rest } = state.scores
      return { scores: rest }
    }),

  simulateMissing: () =>
    set((state) => ({
      scores: simulateMissingMatches(FIXTURES, state.scores, TEAMS),
    })),

  simulateKnockoutWinner: (matchId, homeCode, awayCode, winnerCode) =>
    set((state) => ({
      scores: {
        ...state.scores,
        [matchId]: simulateKnockoutMatch(homeCode, awayCode, TEAMS, winnerCode),
      },
    })),

  pickGroupOrder: (groupId, orderedTeams) =>
    set((state) => {
      const fixtures = FIXTURES.filter((f) => f.group === groupId)
      const newScores = generateGroupScoresForOrder(orderedTeams, fixtures, TEAMS)
      return { scores: { ...state.scores, ...newScores } }
    }),

  addThirdQualifier: (groupId) =>
    set((state) => {
      if (state.thirdQualifiers.includes(groupId) || state.thirdQualifiers.length >= 8) {
        return state
      }
      return { thirdQualifiers: [...state.thirdQualifiers, groupId] }
    }),

  removeThirdQualifier: (groupId) =>
    set((state) => ({
      thirdQualifiers: state.thirdQualifiers.filter((id) => id !== groupId),
    })),
})
```

- [ ] **Step 4: Run all store tests**

```bash
npm run test -- tournament.slice
```

Expected: All store tests PASS (6 existing + 8 new = 14 total).

- [ ] **Step 5: Commit**

```bash
git add src/store/tournament.slice.ts src/store/tournament.slice.test.ts
git commit -m "feat: store — thirdQualifiers, resetAll, simulateKnockoutWinner, pickGroupOrder"
```

---

## Task 5: BracketView — fix slices + champion banner + clickable MatchCard (TDD)

**Files:**
- Modify: `src/components/bracket/BracketView.tsx`
- Modify: `src/components/bracket/BracketView.test.tsx`

- [ ] **Step 1: Update `makeEmptyBracket` in `BracketView.test.tsx` and add new tests**

Replace the entire `makeEmptyBracket` function with correct sizes, and append new tests:

```ts
function makeEmptyBracket(): Bracket {
  const emptyMatch = (id: string) => ({ id, home: null, away: null })
  return {
    roundOf32:     Array.from({ length: 16 }, (_, i) => emptyMatch(`r32-${i + 1}`)),
    roundOf16:     Array.from({ length: 8 },  (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 4 },  (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals:    Array.from({ length: 2 },  (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace:    emptyMatch('3rd'),
    final:         emptyMatch('final'),
  }
}
```

Append to the `describe('BracketView', ...)` block:

```ts
  it('shows champion banner when champion prop is provided', () => {
    render(<BracketView bracket={makeEmptyBracket()} champion="ARG" />)
    expect(screen.getByTestId('champion-banner')).toBeInTheDocument()
  })

  it('does not show champion banner when champion is null', () => {
    render(<BracketView bracket={makeEmptyBracket()} champion={null} />)
    expect(screen.queryByTestId('champion-banner')).toBeNull()
  })

  it('calls onMatchClick when a bracket match card is clicked', () => {
    const onMatchClick = vi.fn()
    render(<BracketView bracket={makeEmptyBracket()} onMatchClick={onMatchClick} />)
    const cards = screen.getAllByTestId(/bracket-match-/)
    fireEvent.click(cards[0])
    expect(onMatchClick).toHaveBeenCalledTimes(1)
  })
```

Add this import at the top of the test file (alongside the existing imports):
```ts
import { vi } from 'vitest'
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```bash
npm run test -- BracketView
```

Expected: FAIL — champion banner not rendered, `onMatchClick` prop not wired.

- [ ] **Step 3: Replace `src/components/bracket/BracketView.tsx`**

```tsx
import { useState } from 'react'
import type { Bracket, BracketMatch } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'
import { BracketMinimap } from './BracketMinimap'
import { cn } from '@/lib/utils'

type Round = 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'

function TeamSlot({ code }: { code: string | null }) {
  const team = TEAMS.find((t) => t.code === code)
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded text-sm',
        code ? 'text-wcp-text' : 'text-wcp-muted',
      )}
    >
      {code ? (
        <>
          <span>{team?.flag}</span>
          <span>{code}</span>
        </>
      ) : (
        <span className="opacity-40">?</span>
      )}
    </div>
  )
}

function MatchCard({
  match,
  onClick,
}: {
  match: BracketMatch
  onClick?: (match: BracketMatch) => void
}) {
  return (
    <div
      data-testid={`bracket-match-${match.id}`}
      className={cn(
        'bg-wcp-surface border border-wcp-border rounded-lg overflow-hidden',
        onClick && 'cursor-pointer hover:border-wcp-primary transition-colors',
      )}
      style={{ minWidth: 'clamp(110px, 11vw, 150px)' }}
      onClick={onClick ? () => onClick(match) : undefined}
    >
      <TeamSlot code={match.home} />
      <div className="h-px bg-wcp-border mx-2" />
      <TeamSlot code={match.away} />
    </div>
  )
}

function RoundColumn({
  title,
  matches,
  onMatchClick,
}: {
  title: string
  matches: BracketMatch[]
  onMatchClick?: (match: BracketMatch) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-[10px] text-wcp-muted tracking-[2px] uppercase mb-1">{title}</span>
      <div className="flex flex-col gap-1.5">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  )
}

function DesktopBracket({
  bracket,
  onMatchClick,
}: {
  bracket: Bracket
  onMatchClick?: (match: BracketMatch) => void
}) {
  const leftR32  = bracket.roundOf32.slice(0, 8)
  const rightR32 = bracket.roundOf32.slice(8)
  const leftR16  = bracket.roundOf16.slice(0, 4)
  const rightR16 = bracket.roundOf16.slice(4)
  const leftQF   = bracket.quarterFinals.slice(0, 2)
  const rightQF  = bracket.quarterFinals.slice(2)
  const leftSF   = bracket.semiFinals.slice(0, 1)
  const rightSF  = bracket.semiFinals.slice(1)

  return (
    <div className="overflow-x-auto py-4 px-4">
      <div className="flex items-center justify-center min-w-fit" style={{ gap: 'clamp(12px, 2vw, 32px)' }}>
        <RoundColumn title="Oitavas" matches={leftR32} onMatchClick={onMatchClick} />
        <RoundColumn title="R16" matches={leftR16} onMatchClick={onMatchClick} />
        <RoundColumn title="Quartos" matches={leftQF} onMatchClick={onMatchClick} />
        <RoundColumn title="Semis" matches={leftSF} onMatchClick={onMatchClick} />

        <div className="flex flex-col items-center gap-2 px-3">
          <span className="text-[9px] text-wcp-primary tracking-[3px] uppercase font-bold">Final</span>
          <div className="border-2 border-wcp-primary rounded-xl overflow-hidden">
            <MatchCard match={bracket.final} onClick={onMatchClick} />
          </div>
        </div>

        <RoundColumn title="Semis" matches={rightSF} onMatchClick={onMatchClick} />
        <RoundColumn title="Quartos" matches={rightQF} onMatchClick={onMatchClick} />
        <RoundColumn title="R16" matches={rightR16} onMatchClick={onMatchClick} />
        <RoundColumn title="Oitavas" matches={rightR32} onMatchClick={onMatchClick} />
      </div>
    </div>
  )
}

const ROUND_MATCHES: Record<Round, (b: Bracket) => BracketMatch[]> = {
  roundOf32:     (b) => b.roundOf32,
  roundOf16:     (b) => b.roundOf16,
  quarterFinals: (b) => b.quarterFinals,
  semiFinals:    (b) => b.semiFinals,
  final:         (b) => [b.final],
}

const ROUND_LABELS: Record<Round, string> = {
  roundOf32:     'Oitavas de Final',
  roundOf16:     'Rodada de 16',
  quarterFinals: 'Quartas de Final',
  semiFinals:    'Semifinais',
  final:         'Final',
}

function MobileBracket({
  bracket,
  onMatchClick,
}: {
  bracket: Bracket
  onMatchClick?: (match: BracketMatch) => void
}) {
  const [activeRound, setActiveRound] = useState<Round>('roundOf32')
  const matches = ROUND_MATCHES[activeRound](bracket)

  return (
    <div>
      <BracketMinimap
        bracket={bracket}
        activeRound={activeRound}
        onRoundSelect={setActiveRound}
      />
      <div
        data-testid={`round-${activeRound}`}
        className="px-4 py-4 flex flex-col gap-3"
      >
        <span className="text-[9px] text-wcp-primary tracking-[3px] uppercase font-bold">
          {ROUND_LABELS[activeRound]}
        </span>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  )
}

interface BracketViewProps {
  bracket: Bracket
  champion?: string | null
  onMatchClick?: (match: BracketMatch) => void
}

export function BracketView({ bracket, champion, onMatchClick }: BracketViewProps) {
  const championTeam = champion ? TEAMS.find((t) => t.code === champion) : null

  return (
    <div>
      {champion && (
        <div
          data-testid="champion-banner"
          className="mx-4 mt-4 mb-2 p-4 rounded-xl border-2 border-wcp-primary bg-wcp-surface-subtle flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🏆</span>
          <span className="font-bold text-lg text-wcp-text">
            {championTeam?.flag} {champion}
          </span>
          <span className="text-wcp-muted text-sm">É o Campeão do Mundo!</span>
        </div>
      )}
      <div className="hidden md:block">
        <DesktopBracket bracket={bracket} onMatchClick={onMatchClick} />
      </div>
      <div className="md:hidden">
        <MobileBracket bracket={bracket} onMatchClick={onMatchClick} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run BracketView tests**

```bash
npm run test -- BracketView
```

Expected: All 6 tests PASS (3 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/bracket/BracketView.tsx src/components/bracket/BracketView.test.tsx
git commit -m "feat: BracketView — clickable match cards, champion banner, correct round sizes"
```

---

## Task 6: GroupGrid — wire scores, thirdQualifiers, champion, and KnockoutMatchModal state

**Files:**
- Modify: `src/components/groups/GroupGrid.tsx`

- [ ] **Step 1: Replace `src/components/groups/GroupGrid.tsx`**

```tsx
import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket, advanceWinner } from '@/engine/bracket-generator'
import { GroupCard } from './GroupCard'
import { MatchModal } from './MatchModal'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings, BracketMatch } from '@/engine/types'
import { KnockoutMatchModal } from '@/components/bracket/KnockoutMatchModal'

const GROUP_IDS = GROUPS.map((g) => g.id)

const ROUND_LABELS: Record<string, string> = {
  r32: 'Oitavas de Final',
  r16: 'Rodada de 16',
  qf:  'Quartas de Final',
  sf:  'Semifinal',
  final: 'Final',
  '3rd': '3.º/4.º Lugar',
}

function getRoundLabel(matchId: string): string {
  if (matchId === 'final') return ROUND_LABELS['final']
  if (matchId === '3rd') return ROUND_LABELS['3rd']
  const prefix = matchId.replace(/-\d+$/, '')
  return ROUND_LABELS[prefix] ?? ''
}

export function GroupGrid() {
  const scores = useStore((s) => s.scores)
  const thirdQualifiers = useStore((s) => s.thirdQualifiers)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeKnockoutMatch, setActiveKnockoutMatch] = useState<BracketMatch | null>(null)

  const allStandings = useMemo(() => {
    const result: GroupStandings = {}
    for (const group of GROUPS) {
      result[group.id] = classifyGroup(group, scores)
    }
    return result
  }, [scores])

  const bracket = useMemo(
    () => generateBracket(allStandings, scores, thirdQualifiers),
    [allStandings, scores, thirdQualifiers],
  )

  const champion = useMemo(() => {
    const side = advanceWinner('final', scores)
    if (!side) return null
    return side === 'home' ? bracket.final.home : bracket.final.away
  }, [bracket, scores])

  return (
    <div className="w-full px-4 py-4 max-w-screen-xl mx-auto">
      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {GROUP_IDS.map((groupId) => (
          <GroupCard
            key={groupId}
            groupId={groupId}
            onClick={() => setActiveGroupId(groupId)}
          />
        ))}
      </div>

      {/* Bracket section */}
      <div className="rounded-xl border border-wcp-border">
        <div className="bg-wcp-surface-subtle px-4 py-3 border-b border-wcp-border rounded-t-xl">
          <span className="text-[10px] tracking-[3px] uppercase font-semibold text-wcp-primary">
            FASE ELIMINATÓRIA
          </span>
        </div>
        <div className="bg-wcp-surface rounded-b-xl">
          <BracketView
            bracket={bracket}
            champion={champion}
            onMatchClick={setActiveKnockoutMatch}
          />
        </div>
      </div>

      {/* Group modal */}
      {activeGroupId && (
        <MatchModal
          groupId={activeGroupId}
          onClose={() => setActiveGroupId(null)}
        />
      )}

      {/* Knockout match modal */}
      {activeKnockoutMatch && (
        <KnockoutMatchModal
          match={activeKnockoutMatch}
          roundLabel={getRoundLabel(activeKnockoutMatch.id)}
          onClose={() => setActiveKnockoutMatch(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds (KnockoutMatchModal doesn't exist yet, TypeScript will error — that's fine to fix in the next task, or create an empty placeholder now):

If the build fails due to missing `KnockoutMatchModal`, create a temporary placeholder:
```bash
echo 'export function KnockoutMatchModal() { return null }' > src/components/bracket/KnockoutMatchModal.tsx
```

Then re-run `npm run build` to confirm it passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/GroupGrid.tsx src/components/bracket/KnockoutMatchModal.tsx
git commit -m "feat: GroupGrid — pass scores/thirdQualifiers to bracket, wire KnockoutMatchModal"
```

---

## Task 7: KnockoutMatchModal component (TDD)

**Files:**
- Create: `src/components/bracket/KnockoutMatchModal.tsx` (replace placeholder if created in Task 6)
- Create: `src/components/bracket/KnockoutMatchModal.test.tsx`

- [ ] **Step 1: Create `src/components/bracket/KnockoutMatchModal.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import { KnockoutMatchModal } from './KnockoutMatchModal'
import type { BracketMatch } from '@/engine/types'

vi.mock('@/store', () => ({ useStore: vi.fn() }))

const baseStore = {
  scores: {} as Record<string, { home: number; away: number }>,
  setScore: vi.fn(),
  clearScore: vi.fn(),
  simulateKnockoutWinner: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (selector: (s: typeof store) => unknown) => selector(store),
  )
}

const filledMatch: BracketMatch = { id: 'r32-1', home: 'ARG', away: 'BRA' }
const nullMatch: BracketMatch = { id: 'r32-1', home: null, away: null }

describe('KnockoutMatchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('shows "Aguarda resultado anterior" when home slot is null', () => {
    render(<KnockoutMatchModal match={nullMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    expect(screen.getByText('Aguarda resultado anterior')).toBeInTheDocument()
  })

  it('renders both team codes when slots are filled', () => {
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    expect(screen.getAllByText('ARG').length).toBeGreaterThan(0)
    expect(screen.getAllByText('BRA').length).toBeGreaterThan(0)
  })

  it('confirm button is disabled when score is tied', () => {
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    // Default 1-0. Make it 1-1 by incrementing away.
    fireEvent.click(screen.getByTestId('away-plus-r32-1'))
    expect(screen.getByTestId('confirm-r32-1')).toBeDisabled()
  })

  it('calls setScore and onClose when confirm clicked with non-tie score', () => {
    const setScore = vi.fn()
    const onClose = vi.fn()
    mockStore({ setScore })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    // Default 1-0 (non-tie)
    fireEvent.click(screen.getByTestId('confirm-r32-1'))
    expect(setScore).toHaveBeenCalledWith('r32-1', 1, 0)
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking winner button in winner-mode calls simulateKnockoutWinner and closes', () => {
    const simulateKnockoutWinner = vi.fn()
    const onClose = vi.fn()
    mockStore({ simulateKnockoutWinner })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('mode-winner'))
    fireEvent.click(screen.getByTestId('winner-ARG'))
    expect(simulateKnockoutWinner).toHaveBeenCalledWith('r32-1', 'ARG', 'BRA', 'ARG')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows "Limpar placar" when score exists and clearScore is called on click', () => {
    const clearScore = vi.fn()
    const onClose = vi.fn()
    mockStore({ scores: { 'r32-1': { home: 2, away: 1 } }, clearScore })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    fireEvent.click(screen.getByText('Limpar placar'))
    expect(clearScore).toHaveBeenCalledWith('r32-1')
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- KnockoutMatchModal
```

Expected: FAIL — placeholder component doesn't implement the interface.

- [ ] **Step 3: Create `src/components/bracket/KnockoutMatchModal.tsx`**

```tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { TEAMS } from '@/data/wc2026'
import type { BracketMatch } from '@/engine/types'
import { cn } from '@/lib/utils'

type Mode = 'exact' | 'winner'

interface KnockoutMatchModalProps {
  match: BracketMatch
  roundLabel: string
  onClose: () => void
}

function Stepper({
  value,
  onIncrement,
  onDecrement,
  testIdPlus,
  testIdMinus,
  testIdValue,
}: {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  testIdPlus: string
  testIdMinus: string
  testIdValue: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        data-testid={testIdPlus}
        onClick={onIncrement}
        className="w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none"
      >
        +
      </button>
      <span
        data-testid={testIdValue}
        className="text-xl font-bold text-wcp-text min-w-[28px] text-center tabular-nums"
      >
        {value}
      </span>
      <button
        data-testid={testIdMinus}
        onClick={onDecrement}
        disabled={value === 0}
        className={cn(
          'w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none',
          value === 0 && 'opacity-30 cursor-not-allowed',
        )}
      >
        −
      </button>
    </div>
  )
}

export function KnockoutMatchModal({ match, roundLabel, onClose }: KnockoutMatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)
  const clearScore = useStore((s) => s.clearScore)
  const simulateKnockoutWinner = useStore((s) => s.simulateKnockoutWinner)

  const existing = scores[match.id]
  const [mode, setMode] = useState<Mode>('exact')
  const [homeGoals, setHomeGoals] = useState(existing?.home ?? 1)
  const [awayGoals, setAwayGoals] = useState(existing?.away ?? 0)

  const homeTeam = TEAMS.find((t) => t.code === match.home)
  const awayTeam = TEAMS.find((t) => t.code === match.away)
  const isTie = homeGoals === awayGoals

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <h2 className="font-bold text-wcp-text text-base">{roundLabel}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wcp-surface-subtle hover:bg-wcp-primary-faint flex items-center justify-center text-wcp-muted transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Null slot warning */}
          {!match.home || !match.away ? (
            <p className="text-center text-wcp-muted text-sm py-4">
              Aguarda resultado anterior
            </p>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-wcp-border text-xs font-semibold">
                <button
                  data-testid="mode-exact"
                  onClick={() => setMode('exact')}
                  className={cn(
                    'flex-1 py-2 transition-colors',
                    mode === 'exact'
                      ? 'bg-wcp-primary text-white'
                      : 'text-wcp-muted hover:bg-wcp-primary-faint',
                  )}
                >
                  Placar exato
                </button>
                <button
                  data-testid="mode-winner"
                  onClick={() => setMode('winner')}
                  className={cn(
                    'flex-1 py-2 transition-colors',
                    mode === 'winner'
                      ? 'bg-wcp-primary text-white'
                      : 'text-wcp-muted hover:bg-wcp-primary-faint',
                  )}
                >
                  Só o vencedor
                </button>
              </div>

              {mode === 'exact' ? (
                <>
                  {/* Stepper score entry */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-3xl">{homeTeam?.flag}</span>
                      <span className="text-[10px] font-semibold text-wcp-text">{match.home}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stepper
                        value={homeGoals}
                        onIncrement={() => setHomeGoals((v) => v + 1)}
                        onDecrement={() => setHomeGoals((v) => Math.max(0, v - 1))}
                        testIdPlus={`home-plus-${match.id}`}
                        testIdMinus={`home-minus-${match.id}`}
                        testIdValue={`score-home-${match.id}`}
                      />
                      <span className="text-wcp-primary font-bold px-1">×</span>
                      <Stepper
                        value={awayGoals}
                        onIncrement={() => setAwayGoals((v) => v + 1)}
                        onDecrement={() => setAwayGoals((v) => Math.max(0, v - 1))}
                        testIdPlus={`away-plus-${match.id}`}
                        testIdMinus={`away-minus-${match.id}`}
                        testIdValue={`score-away-${match.id}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-3xl">{awayTeam?.flag}</span>
                      <span className="text-[10px] font-semibold text-wcp-text">{match.away}</span>
                    </div>
                  </div>

                  {isTie && (
                    <p className="text-xs text-red-500 text-center">
                      Empate inválido — defina um vencedor
                    </p>
                  )}

                  <button
                    data-testid={`confirm-${match.id}`}
                    disabled={isTie}
                    onClick={() => {
                      setScore(match.id, homeGoals, awayGoals)
                      onClose()
                    }}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      isTie
                        ? 'bg-red-100 border border-red-300 text-red-400 cursor-not-allowed'
                        : 'bg-wcp-primary text-white hover:opacity-90',
                    )}
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                /* Winner-only mode */
                <div className="flex gap-3">
                  <button
                    data-testid={`winner-${match.home}`}
                    onClick={() => {
                      simulateKnockoutWinner(match.id, match.home!, match.away!, match.home!)
                      onClose()
                    }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border border-wcp-border hover:border-wcp-primary hover:bg-wcp-primary-faint transition-colors"
                  >
                    <span className="text-3xl">{homeTeam?.flag}</span>
                    <span className="text-sm font-bold text-wcp-text">{match.home}</span>
                  </button>
                  <button
                    data-testid={`winner-${match.away}`}
                    onClick={() => {
                      simulateKnockoutWinner(match.id, match.home!, match.away!, match.away!)
                      onClose()
                    }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border border-wcp-border hover:border-wcp-primary hover:bg-wcp-primary-faint transition-colors"
                  >
                    <span className="text-3xl">{awayTeam?.flag}</span>
                    <span className="text-sm font-bold text-wcp-text">{match.away}</span>
                  </button>
                </div>
              )}

              {/* Clear score */}
              {existing && (
                <button
                  onClick={() => {
                    clearScore(match.id)
                    onClose()
                  }}
                  className="text-[10px] text-wcp-muted hover:text-wcp-text py-1 transition-colors text-center"
                >
                  Limpar placar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- KnockoutMatchModal
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/bracket/KnockoutMatchModal.tsx src/components/bracket/KnockoutMatchModal.test.tsx
git commit -m "feat: KnockoutMatchModal — exact score stepper, winner-only mode, null slot guard"
```

---

## Task 8: GroupPositionPicker + MatchModal integration (TDD)

**Files:**
- Create: `src/components/groups/GroupPositionPicker.tsx`
- Create: `src/components/groups/GroupPositionPicker.test.tsx`
- Modify: `src/components/groups/MatchModal.tsx`

- [ ] **Step 1: Create `src/components/groups/GroupPositionPicker.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import { GroupPositionPicker } from './GroupPositionPicker'

vi.mock('@/store', () => ({ useStore: vi.fn() }))

const baseStore = {
  thirdQualifiers: [] as string[],
  pickGroupOrder: vi.fn(),
  addThirdQualifier: vi.fn(),
  removeThirdQualifier: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (selector: (s: typeof store) => unknown) => selector(store),
  )
}

describe('GroupPositionPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('renders 4 team rows for group A', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    expect(screen.getAllByTestId(/position-row-/)).toHaveLength(4)
  })

  it('up button on second row moves that team to first position', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    const rows = screen.getAllByTestId(/position-row-/)
    const secondTeamCode = rows[1].getAttribute('data-team')!
    fireEvent.click(screen.getAllByTestId(/up-btn-/)[1])
    const updatedRows = screen.getAllByTestId(/position-row-/)
    expect(updatedRows[0].getAttribute('data-team')).toBe(secondTeamCode)
  })

  it('down button on first row moves that team to second position', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    const rows = screen.getAllByTestId(/position-row-/)
    const firstTeamCode = rows[0].getAttribute('data-team')!
    fireEvent.click(screen.getAllByTestId(/down-btn-/)[0])
    const updatedRows = screen.getAllByTestId(/position-row-/)
    expect(updatedRows[1].getAttribute('data-team')).toBe(firstTeamCode)
  })

  it('"Simular com esta ordem" calls pickGroupOrder and closes', () => {
    const pickGroupOrder = vi.fn()
    const onClose = vi.fn()
    mockStore({ pickGroupOrder })
    render(<GroupPositionPicker groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('simulate-order'))
    expect(pickGroupOrder).toHaveBeenCalledWith('A', expect.any(Array))
    expect(onClose).toHaveBeenCalled()
  })

  it('3rd toggle calls addThirdQualifier when group not in pool', () => {
    const addThirdQualifier = vi.fn()
    mockStore({ addThirdQualifier })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toggle-third-A'))
    expect(addThirdQualifier).toHaveBeenCalledWith('A')
  })

  it('3rd toggle calls removeThirdQualifier when group is already in pool', () => {
    const removeThirdQualifier = vi.fn()
    mockStore({ thirdQualifiers: ['A'], removeThirdQualifier })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toggle-third-A'))
    expect(removeThirdQualifier).toHaveBeenCalledWith('A')
  })

  it('3rd toggle is disabled when pool is full (8) and group not in pool', () => {
    mockStore({ thirdQualifiers: ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('toggle-third-A')).toBeDisabled()
  })

  it('"Cancelar" calls onClose without modifying store', () => {
    const pickGroupOrder = vi.fn()
    const onClose = vi.fn()
    mockStore({ pickGroupOrder })
    render(<GroupPositionPicker groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('cancel-picker'))
    expect(onClose).toHaveBeenCalled()
    expect(pickGroupOrder).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- GroupPositionPicker
```

Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Create `src/components/groups/GroupPositionPicker.tsx`**

```tsx
import { useState } from 'react'
import { useStore } from '@/store'
import { GROUPS, TEAMS } from '@/data/wc2026'
import { cn } from '@/lib/utils'

interface GroupPositionPickerProps {
  groupId: string
  onClose: () => void
}

export function GroupPositionPicker({ groupId, onClose }: GroupPositionPickerProps) {
  const thirdQualifiers = useStore((s) => s.thirdQualifiers)
  const pickGroupOrder = useStore((s) => s.pickGroupOrder)
  const addThirdQualifier = useStore((s) => s.addThirdQualifier)
  const removeThirdQualifier = useStore((s) => s.removeThirdQualifier)

  const group = GROUPS.find((g) => g.id === groupId)!
  const [order, setOrder] = useState<string[]>([...group.teams])

  const isThirdQualified = thirdQualifiers.includes(groupId)
  const poolFull = thirdQualifiers.length >= 8 && !isThirdQualified

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    if (idx === order.length - 1) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const handleSimulate = () => {
    pickGroupOrder(groupId, order)
    onClose()
  }

  const handleToggleThird = () => {
    if (isThirdQualified) {
      removeThirdQualifier(groupId)
    } else {
      addThirdQualifier(groupId)
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4 border-t border-wcp-border bg-wcp-surface-subtle">
      <span className="text-[10px] tracking-[2px] uppercase font-semibold text-wcp-primary">
        Definir classificação — Grupo {groupId}
      </span>

      <div className="flex flex-col gap-1">
        {order.map((code, idx) => {
          const team = TEAMS.find((t) => t.code === code)
          const isThirdSlot = idx === 2
          return (
            <div
              key={code}
              data-testid={`position-row-${idx}`}
              data-team={code}
              className="flex items-center gap-2 bg-wcp-surface rounded-lg px-3 py-2"
            >
              <span className="text-[10px] text-wcp-muted w-4">{idx + 1}.</span>
              <span className="text-base">{team?.flag}</span>
              <span className="text-sm font-semibold text-wcp-text flex-1">{code}</span>

              {isThirdSlot && (
                <button
                  data-testid={`toggle-third-${groupId}`}
                  disabled={poolFull}
                  onClick={handleToggleThird}
                  className={cn(
                    'text-[9px] font-semibold px-2 py-1 rounded-full transition-colors border',
                    isThirdQualified
                      ? 'bg-wcp-primary text-white border-wcp-primary'
                      : 'text-wcp-muted border-wcp-border hover:border-wcp-primary',
                    poolFull && 'opacity-40 cursor-not-allowed',
                  )}
                  title={poolFull ? 'Pool de 8 terceiros completo' : undefined}
                >
                  {isThirdQualified ? 'Qualifica' : 'Não qualifica'}
                </button>
              )}

              <div className="flex flex-col gap-0.5">
                <button
                  data-testid={`up-btn-${idx}`}
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-[9px] text-wcp-muted hover:text-wcp-primary disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <button
                  data-testid={`down-btn-${idx}`}
                  onClick={() => moveDown(idx)}
                  disabled={idx === order.length - 1}
                  className="text-[9px] text-wcp-muted hover:text-wcp-primary disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          data-testid="cancel-picker"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-wcp-border text-wcp-muted text-sm hover:bg-wcp-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          data-testid="simulate-order"
          onClick={handleSimulate}
          className="flex-1 py-2 rounded-xl bg-wcp-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Simular com esta ordem
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run GroupPositionPicker tests**

```bash
npm run test -- GroupPositionPicker
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Add GroupPositionPicker trigger to `MatchModal.tsx`**

In `src/components/groups/MatchModal.tsx`:

Add import at the top:
```tsx
import { GroupPositionPicker } from './GroupPositionPicker'
```

Add state after the existing `useState` declarations:
```tsx
const [showPositionPicker, setShowPositionPicker] = useState(false)
```

In the modal header `<div>` (after `<h2>Grupo {groupId}</h2>`), add the trigger button:
```tsx
<button
  data-testid="open-position-picker"
  onClick={() => setShowPositionPicker((v) => !v)}
  className="text-[10px] text-wcp-primary font-semibold underline underline-offset-2 mt-0.5"
>
  🏆 Definir classificação
</button>
```

Just before the `{/* Matches */}` div (the `overflow-y-auto` section), add the picker:
```tsx
{showPositionPicker && (
  <GroupPositionPicker
    groupId={groupId}
    onClose={() => setShowPositionPicker(false)}
  />
)}
```

- [ ] **Step 6: Run all tests to confirm no regressions**

```bash
npm run test
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/groups/GroupPositionPicker.tsx src/components/groups/GroupPositionPicker.test.tsx src/components/groups/MatchModal.tsx
git commit -m "feat: GroupPositionPicker — reorder teams, toggle 3rd qualifier, simulate group order"
```

---

## Task 9: AppShell — "Limpar tudo" button (TDD)

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/AppShell.test.tsx`

- [ ] **Step 1: Create `src/components/layout/AppShell.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import { AppShell } from './AppShell'

vi.mock('@/store', () => ({ useStore: vi.fn() }))
vi.mock('@/hooks/useShareLink', () => ({
  useShareLink: () => ({ share: vi.fn(), copied: false }),
}))
// Prevent full component tree from rendering during AppShell header tests
vi.mock('@/components/groups/GroupGrid', () => ({ GroupGrid: () => null }))

const baseStore = {
  scores: {},
  thirdQualifiers: [],
  simulateMissing: vi.fn(),
  resetAll: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (selector: (s: typeof store) => unknown) => selector(store),
  )
}

describe('AppShell — Limpar tudo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('renders "Limpar tudo" button', () => {
    render(<AppShell />)
    expect(screen.getByTestId('reset-all-btn')).toBeInTheDocument()
  })

  it('calls resetAll when user confirms the dialog', () => {
    const resetAll = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockStore({ resetAll })
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('reset-all-btn'))
    expect(resetAll).toHaveBeenCalled()
  })

  it('does NOT call resetAll when user cancels the dialog', () => {
    const resetAll = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockStore({ resetAll })
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('reset-all-btn'))
    expect(resetAll).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- AppShell
```

Expected: FAIL — `reset-all-btn` not rendered.

- [ ] **Step 3: Add `ResetAllButton` to `src/components/layout/AppShell.tsx`**

Add this function before `SimulateButton`:

```tsx
function ResetAllButton() {
  const resetAll = useStore((s) => s.resetAll)

  const handleClick = () => {
    if (window.confirm('Tens a certeza? Todos os resultados serão apagados.')) {
      resetAll()
    }
  }

  return (
    <button
      onClick={handleClick}
      data-testid="reset-all-btn"
      title="Limpar todos os resultados"
      className="border border-red-300 text-red-400 text-xs font-semibold rounded-full px-4 py-1.5 transition-opacity hover:opacity-75 active:opacity-50"
    >
      Limpar tudo
    </button>
  )
}
```

In the `AppShell` header `<div className="flex items-center gap-2">`, insert `<ResetAllButton />` before `<SimulateButton />`:

```tsx
<div className="flex items-center gap-2">
  <ResetAllButton />
  <SimulateButton />
  <ShareButton />
</div>
```

- [ ] **Step 4: Run AppShell tests**

```bash
npm run test -- AppShell
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Run full test suite and build**

```bash
npm run test
npm run build
```

Expected: All tests PASS (~110–120 total), build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx
git commit -m "feat: AppShell — Limpar tudo button with confirmation dialog"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
npm run test
```

Expected: ~110–120 tests, all PASS.

- [ ] **Run E2E tests**

```bash
npm run test:e2e
```

Expected: All Playwright tests PASS.

- [ ] **Run build**

```bash
npm run build
```

Expected: Build succeeds, no TypeScript errors.
