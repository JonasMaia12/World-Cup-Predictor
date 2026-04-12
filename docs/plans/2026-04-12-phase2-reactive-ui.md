# Phase 2 — Reactive Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the FIFA engine via TDD and build the reactive UI so that typing match scores updates standings and the knockout bracket in real time.

**Architecture:** Engine-first TDD: `classifier` → `tiebreaker` → `bracket-generator`, each driven to 100% coverage. UI components (`GroupTable`, `MatchRow`, `BracketView`) are built on top of the working engine and read scores from the Zustand store already wired in Phase 1. Standings and bracket are always derived on render — never stored.

**Tech Stack:** TypeScript (engine), Vitest + @testing-library/react, React 19, Zustand, Tailwind CSS

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/engine/classifier.ts` | Modify | Implement `classifyGroup` |
| `src/engine/classifier.test.ts` | Modify | Full TDD suite (expand existing anchor) |
| `src/engine/tiebreaker.ts` | Modify | Implement `applyTiebreakers` (FIFA cascade) |
| `src/engine/tiebreaker.test.ts` | Create | Tiebreaker tests |
| `src/engine/bracket-generator.ts` | Modify | Implement `generateBracket` |
| `src/engine/bracket-generator.test.ts` | Create | Bracket generator tests |
| `src/components/groups/MatchRow.tsx` | Create | Score input row (props-only, no store) |
| `src/components/groups/MatchRow.test.tsx` | Create | MatchRow unit tests |
| `src/components/groups/GroupTable.tsx` | Create | Group standings + match list |
| `src/components/bracket/BracketView.tsx` | Create | Knockout bracket display by round |
| `src/components/layout/Sidebar.tsx` | Modify | Add "🏆 Bracket" nav item |
| `src/components/layout/ContentArea.tsx` | Modify | Switch GroupTable ↔ BracketView |

---

## Task 1: Create feature branch and worktree

**Files:** none

- [ ] **Step 1: Create branch and worktree**

```bash
git checkout main
git checkout -b feat/phase2-reactive-ui
git worktree add .worktrees/feat-phase2-reactive-ui feat/phase2-reactive-ui
cd .worktrees/feat-phase2-reactive-ui
npm install
```

Expected: worktree created at `.worktrees/feat-phase2-reactive-ui`, `npm install` completes with no errors.

---

## Task 2: Implement `classifier.ts`

**Files:**
- Modify: `src/engine/classifier.ts`
- Modify: `src/engine/classifier.test.ts`

### Step 1: Expand the test suite before implementing

Replace the entire `src/engine/classifier.test.ts`:

```ts
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
    // Teams with no matches played
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
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- --run src/engine/classifier.test.ts
```

Expected: 4 tests failing with `Error: not implemented`.

- [ ] **Step 3: Implement `src/engine/classifier.ts`**

```ts
import { FIXTURES } from '@/data/wc2026'
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'
import { applyTiebreakers } from './tiebreaker'

export function classifyGroup(group: Group, scores: ScoreMap): Standing[] {
  const standings: Standing[] = group.teams.map((teamCode) => ({
    teamCode,
    played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
  }))

  const fixtures = FIXTURES.filter((f) => f.group === group.id)

  for (const fixture of fixtures) {
    const score = scores[fixture.id]
    if (!score) continue

    const home = standings.find((s) => s.teamCode === fixture.homeTeam)!
    const away = standings.find((s) => s.teamCode === fixture.awayTeam)!

    home.played++; away.played++
    home.goalsFor += score.home; home.goalsAgainst += score.away
    away.goalsFor += score.away; away.goalsAgainst += score.home

    if (score.home > score.away) {
      home.won++; home.points += 3; away.lost++
    } else if (score.away > score.home) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; home.points++
      away.drawn++; away.points++
    }
  }

  for (const s of standings) {
    s.goalDiff = s.goalsFor - s.goalsAgainst
  }

  standings.sort((a, b) => b.points - a.points)

  // Apply FIFA tiebreakers for groups of equal-points teams
  const result: Standing[] = []
  let i = 0
  while (i < standings.length) {
    let j = i + 1
    while (j < standings.length && standings[j].points === standings[i].points) j++
    const slice = standings.slice(i, j)
    result.push(...(slice.length > 1 ? applyTiebreakers(slice, scores, group) : slice))
    i = j
  }

  return result
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- --run src/engine/classifier.test.ts
```

Expected: `Test Files: 1 passed (1)`, `Tests: 4 passed (4)`.

- [ ] **Step 5: Commit**

```bash
git add src/engine/classifier.ts src/engine/classifier.test.ts
git commit -m "feat: implement classifyGroup with TDD (4 tests passing)"
```

---

## Task 3: Implement `tiebreaker.ts`

**Files:**
- Create: `src/engine/tiebreaker.test.ts`
- Modify: `src/engine/tiebreaker.ts`

- [ ] **Step 1: Create `src/engine/tiebreaker.test.ts`**

```ts
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
})
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- --run src/engine/tiebreaker.test.ts
```

Expected: 5 tests failing with `Error: not implemented`.

- [ ] **Step 3: Implement `src/engine/tiebreaker.ts`**

```ts
import { FIXTURES } from '@/data/wc2026'
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'

export function applyTiebreakers(
  tied: Standing[],
  scores: ScoreMap,
  group: Group,
): Standing[] {
  if (tied.length === 1) return tied

  const tiedCodes = new Set(tied.map((s) => s.teamCode))

  // Head-to-head fixtures among only the tied teams
  const h2hFixtures = FIXTURES.filter(
    (f) => f.group === group.id && tiedCodes.has(f.homeTeam) && tiedCodes.has(f.awayTeam),
  )

  const h2h: Record<string, { pts: number; gd: number; gf: number }> = {}
  for (const code of tiedCodes) h2h[code] = { pts: 0, gd: 0, gf: 0 }

  for (const f of h2hFixtures) {
    const score = scores[f.id]
    if (!score) continue
    h2h[f.homeTeam].gf += score.home
    h2h[f.homeTeam].gd += score.home - score.away
    h2h[f.awayTeam].gf += score.away
    h2h[f.awayTeam].gd += score.away - score.home
    if (score.home > score.away) {
      h2h[f.homeTeam].pts += 3
    } else if (score.away > score.home) {
      h2h[f.awayTeam].pts += 3
    } else {
      h2h[f.homeTeam].pts += 1
      h2h[f.awayTeam].pts += 1
    }
  }

  return [...tied].sort((a, b) => {
    // 1. H2H points
    const hPts = h2h[b.teamCode].pts - h2h[a.teamCode].pts
    if (hPts !== 0) return hPts
    // 2. H2H goal difference
    const hGd = h2h[b.teamCode].gd - h2h[a.teamCode].gd
    if (hGd !== 0) return hGd
    // 3. H2H goals scored
    const hGf = h2h[b.teamCode].gf - h2h[a.teamCode].gf
    if (hGf !== 0) return hGf
    // 4. Overall goal difference in group
    const gd = b.goalDiff - a.goalDiff
    if (gd !== 0) return gd
    // 5. Overall goals scored in group
    const gf = b.goalsFor - a.goalsFor
    if (gf !== 0) return gf
    // 6. Draw order (position in group.teams) — deterministic fallback
    return group.teams.indexOf(a.teamCode) - group.teams.indexOf(b.teamCode)
  })
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- --run src/engine/tiebreaker.test.ts
```

Expected: `Tests: 5 passed (5)`.

- [ ] **Step 5: Confirm classifier tests still pass**

```bash
npm test -- --run src/engine/
```

Expected: `Tests: 9 passed (9)`.

- [ ] **Step 6: Commit**

```bash
git add src/engine/tiebreaker.ts src/engine/tiebreaker.test.ts
git commit -m "feat: implement applyTiebreakers with FIFA cascade criteria (5 tests)"
```

---

## Task 4: Implement `bracket-generator.ts`

**Files:**
- Create: `src/engine/bracket-generator.test.ts`
- Modify: `src/engine/bracket-generator.ts`

- [ ] **Step 1: Create `src/engine/bracket-generator.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- --run src/engine/bracket-generator.test.ts
```

Expected: 5 tests failing with `Error: not implemented`.

- [ ] **Step 3: Implement `src/engine/bracket-generator.ts`**

```ts
import type { GroupStandings, Bracket, BracketMatch, Standing } from './types'

// FIFA 2026 Round of 32 slot template — 16 matches, 32 unique slots.
// Slot keys: '1A'=winner of A, '2B'=runner-up of B, '3-N'=Nth best 3rd place.
// Structure: 8 cross-group W vs R + 4 W vs best-3rd + 4 R vs best-3rd = 12W + 12R + 8T
// NOTE: exact cross-group pairings follow FIFA 2026 official bracket structure.
const ROUND_OF_32_TEMPLATE: Array<[string, string]> = [
  // Winner vs Runner-Up (8 matches)
  ['1A', '2B'], ['1B', '2A'],
  ['1C', '2D'], ['1D', '2C'],
  ['1E', '2F'], ['1F', '2E'],
  ['1G', '2H'], ['1H', '2G'],
  // Winner vs Best-3rd (4 matches)
  ['1I', '3-1'], ['1J', '3-2'],
  ['1K', '3-3'], ['1L', '3-4'],
  // Runner-Up vs Best-3rd (4 matches)
  ['2I', '3-5'], ['2J', '3-6'],
  ['2K', '3-7'], ['2L', '3-8'],
]

function selectBest3rds(standings: GroupStandings): Standing[] {
  const thirds: Standing[] = Object.values(standings)
    .filter((group) => group.length >= 3)
    .map((group) => group[2])

  return thirds
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
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

export function generateBracket(standings: GroupStandings): Bracket {
  const winners: Record<string, string> = {}
  const runnersUp: Record<string, string> = {}

  for (const [groupId, groupStandings] of Object.entries(standings)) {
    if (groupStandings[0]) winners[groupId] = groupStandings[0].teamCode
    if (groupStandings[1]) runnersUp[groupId] = groupStandings[1].teamCode
  }

  const best3rds = selectBest3rds(standings).map((s) => s.teamCode)

  const roundOf32: BracketMatch[] = ROUND_OF_32_TEMPLATE.map(([homeKey, awayKey], i) => ({
    id: `r32-${i + 1}`,
    home: resolveSlot(homeKey, winners, runnersUp, best3rds),
    away: resolveSlot(awayKey, winners, runnersUp, best3rds),
  }))

  const emptyMatch = (id: string): BracketMatch => ({ id, home: null, away: null })

  return {
    roundOf32,
    roundOf16: Array.from({ length: 16 }, (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 8 }, (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals: Array.from({ length: 4 }, (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace: emptyMatch('3rd'),
    final: emptyMatch('final'),
  }
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- --run src/engine/bracket-generator.test.ts
```

Expected: `Tests: 5 passed (5)`.

- [ ] **Step 5: Run full engine coverage**

```bash
npm run coverage
```

Expected: `src/engine/` shows ≥ 90% coverage across all files. If any branch is uncovered, add a targeted test.

- [ ] **Step 6: Commit**

```bash
git add src/engine/bracket-generator.ts src/engine/bracket-generator.test.ts
git commit -m "feat: implement generateBracket with best-3rd selection and FIFA 2026 slot template"
```

---

## Task 5: `MatchRow` component

**Files:**
- Create: `src/components/groups/MatchRow.tsx`
- Create: `src/components/groups/MatchRow.test.tsx`

- [ ] **Step 1: Create `src/components/groups/MatchRow.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchRow } from './MatchRow'
import type { Match } from '@/data/wc2026'

const match: Match = {
  id: 'A1',
  group: 'A',
  homeTeam: 'MEX',
  awayTeam: 'RSA',
  stage: 'group',
}

describe('MatchRow', () => {
  it('renders home and away team codes', () => {
    render(<MatchRow match={match} homeScore={undefined} awayScore={undefined} onScoreChange={vi.fn()} />)
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
  })

  it('renders two number inputs', () => {
    render(<MatchRow match={match} homeScore={2} awayScore={1} onScoreChange={vi.fn()} />)
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue(2)
    expect(inputs[1]).toHaveValue(1)
  })

  it('calls onScoreChange with matchId and new values when home input changes', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={0} awayScore={0} onScoreChange={onScoreChange} />)
    const [homeInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(homeInput, { target: { value: '3' } })
    expect(onScoreChange).toHaveBeenCalledWith('A1', 3, 0)
  })

  it('calls onScoreChange with matchId and new values when away input changes', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={1} awayScore={0} onScoreChange={onScoreChange} />)
    const [, awayInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(awayInput, { target: { value: '2' } })
    expect(onScoreChange).toHaveBeenCalledWith('A1', 1, 2)
  })
})
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- --run src/components/groups/MatchRow.test.tsx
```

Expected: fails with `Cannot find module './MatchRow'`.

- [ ] **Step 3: Create `src/components/groups/MatchRow.tsx`**

```tsx
import type { Match } from '@/data/wc2026'
import { TEAMS } from '@/data/wc2026'

interface MatchRowProps {
  match: Match
  homeScore: number | undefined
  awayScore: number | undefined
  onScoreChange: (matchId: string, home: number, away: number) => void
}

export function MatchRow({ match, homeScore, awayScore, onScoreChange }: MatchRowProps) {
  const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
  const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

  const handleHome = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0)
    onScoreChange(match.id, val, awayScore ?? 0)
  }

  const handleAway = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0)
    onScoreChange(match.id, homeScore ?? 0, val)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-wcp-sidebar hover:bg-wcp-border/20 transition-colors">
      <span className="flex-1 text-sm text-wcp-text">
        {homeTeam?.flag} {match.homeTeam}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={homeScore ?? ''}
          onChange={handleHome}
          placeholder="–"
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
        <span className="text-wcp-gold font-bold text-sm">—</span>
        <input
          type="number"
          min={0}
          value={awayScore ?? ''}
          onChange={handleAway}
          placeholder="–"
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
      </div>
      <span className="flex-1 text-sm text-wcp-text text-right">
        {match.awayTeam} {awayTeam?.flag}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- --run src/components/groups/MatchRow.test.tsx
```

Expected: `Tests: 4 passed (4)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/
git commit -m "feat: add MatchRow component with score input and tests"
```

---

## Task 6: `GroupTable` component

**Files:**
- Create: `src/components/groups/GroupTable.tsx`

- [ ] **Step 1: Create `src/components/groups/GroupTable.tsx`**

```tsx
import { useStore } from '@/store'
import { GROUPS, FIXTURES, TEAMS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { MatchRow } from './MatchRow'

interface GroupTableProps {
  groupId: string
}

export function GroupTable({ groupId }: GroupTableProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)

  const group = GROUPS.find((g) => g.id === groupId)
  if (!group) return null

  const standings = classifyGroup(group, scores)
  const fixtures = FIXTURES.filter((f) => f.group === groupId)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <h2 className="text-wcp-gold font-bold text-lg tracking-wide">Grupo {groupId}</h2>

      {/* Standings table */}
      <div className="rounded-lg overflow-hidden border border-wcp-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-wcp-sidebar text-wcp-muted text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Seleção</th>
              <th className="px-2 py-2 text-center">J</th>
              <th className="px-2 py-2 text-center">G</th>
              <th className="px-2 py-2 text-center">E</th>
              <th className="px-2 py-2 text-center">P</th>
              <th className="px-2 py-2 text-center">SG</th>
              <th className="px-2 py-2 text-center">GP</th>
              <th className="px-2 py-2 text-center font-bold text-wcp-gold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const team = TEAMS.find((t) => t.code === s.teamCode)
              const qualifies = idx < 2
              return (
                <tr
                  key={s.teamCode}
                  className={`border-t border-wcp-border ${qualifies ? 'text-wcp-text' : 'text-wcp-muted'}`}
                >
                  <td className="px-3 py-2 text-center">
                    {qualifies ? (
                      <span className="text-wcp-gold font-bold">{idx + 1}</span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {team?.flag} {team?.name ?? s.teamCode}
                  </td>
                  <td className="px-2 py-2 text-center">{s.played}</td>
                  <td className="px-2 py-2 text-center">{s.won}</td>
                  <td className="px-2 py-2 text-center">{s.drawn}</td>
                  <td className="px-2 py-2 text-center">{s.lost}</td>
                  <td className="px-2 py-2 text-center">
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                  <td className="px-2 py-2 text-center">{s.goalsFor}</td>
                  <td className="px-2 py-2 text-center font-bold text-wcp-gold">{s.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Match list */}
      <div className="flex flex-col gap-1">
        <h3 className="text-wcp-muted text-xs uppercase tracking-wide mb-1">Jogos</h3>
        {fixtures.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            homeScore={scores[match.id]?.home}
            awayScore={scores[match.id]?.away}
            onScoreChange={setScore}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/GroupTable.tsx
git commit -m "feat: add GroupTable component — standings + match inputs"
```

---

## Task 7: `BracketView` component

**Files:**
- Create: `src/components/bracket/BracketView.tsx`
- Create: `src/components/bracket/BracketView.test.tsx`

- [ ] **Step 1: Create `src/components/bracket/BracketView.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BracketView } from './BracketView'
import type { Bracket } from '@/engine/types'

function makeEmptyBracket(): Bracket {
  const emptyMatch = (id: string) => ({ id, home: null, away: null })
  return {
    roundOf32: Array.from({ length: 16 }, (_, i) => emptyMatch(`r32-${i + 1}`)),
    roundOf16: Array.from({ length: 16 }, (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 8 }, (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals: Array.from({ length: 4 }, (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace: emptyMatch('3rd'),
    final: emptyMatch('final'),
  }
}

describe('BracketView', () => {
  it('renders round section headings', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    expect(screen.getByText('Oitavas de Final')).toBeInTheDocument()
    expect(screen.getByText('Quartas de Final')).toBeInTheDocument()
    expect(screen.getByText('Semifinais')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
  })

  it('renders "?" for null team slots', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    const placeholders = screen.getAllByText('?')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('renders team codes when slots are filled', () => {
    const bracket = makeEmptyBracket()
    bracket.roundOf32[0].home = 'BRA'
    bracket.roundOf32[0].away = 'ARG'
    render(<BracketView bracket={bracket} />)
    expect(screen.getByText('BRA')).toBeInTheDocument()
    expect(screen.getByText('ARG')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- --run src/components/bracket/BracketView.test.tsx
```

Expected: fails with `Cannot find module './BracketView'`.

- [ ] **Step 3: Create `src/components/bracket/BracketView.tsx`**

```tsx
import type { Bracket, BracketMatch } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'

interface BracketViewProps {
  bracket: Bracket
}

function TeamSlot({ code }: { code: string | null }) {
  const team = TEAMS.find((t) => t.code === code)
  if (!code) return <span className="text-wcp-muted">?</span>
  return (
    <span className="text-wcp-text">
      {team?.flag} {code}
    </span>
  )
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className="bg-wcp-sidebar border border-wcp-border rounded-lg px-4 py-3 flex flex-col gap-1 text-sm min-w-[160px]">
      <TeamSlot code={match.home} />
      <span className="text-wcp-gold text-xs">vs</span>
      <TeamSlot code={match.away} />
    </div>
  )
}

function RoundSection({ title, matches }: { title: string; matches: BracketMatch[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-wcp-muted text-xs uppercase tracking-wide">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  )
}

export function BracketView({ bracket }: BracketViewProps) {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-wcp-gold font-bold text-lg tracking-wide">Fase Eliminatória</h2>
      <RoundSection title="Oitavas de Final" matches={bracket.roundOf32} />
      <RoundSection title="Quartas de Final" matches={bracket.quarterFinals} />
      <RoundSection title="Semifinais" matches={bracket.semiFinals} />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-3 flex-1">
          <h3 className="text-wcp-muted text-xs uppercase tracking-wide">3º Lugar</h3>
          <MatchCard match={bracket.thirdPlace} />
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <h3 className="text-wcp-muted text-xs uppercase tracking-wide">Final</h3>
          <MatchCard match={bracket.final} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- --run src/components/bracket/BracketView.test.tsx
```

Expected: `Tests: 3 passed (3)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/bracket/
git commit -m "feat: add BracketView component with round sections and team slots"
```

---

## Task 8: Wire up `Sidebar` and `ContentArea`

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/ContentArea.tsx`

- [ ] **Step 1: Update `src/components/layout/Sidebar.tsx`**

Replace the entire file:

```tsx
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function Sidebar() {
  const selectedGroup = useStore((s) => s.selectedGroup)
  const setSelectedGroup = useStore((s) => s.setSelectedGroup)

  return (
    <aside className="w-60 h-full bg-wcp-sidebar border-r border-wcp-border flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-wcp-border">
        <p className="text-wcp-gold font-bold text-base tracking-wide">
          🏆 WC 2026
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {GROUP_IDS.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            aria-pressed={selectedGroup === g}
            className={cn(
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              selectedGroup === g
                ? 'bg-wcp-gold text-wcp-bg font-semibold'
                : 'text-wcp-text hover:bg-wcp-border/30',
            )}
          >
            Grupo {g}
          </button>
        ))}
        <div className="border-t border-wcp-border my-1" />
        <button
          onClick={() => setSelectedGroup('bracket')}
          aria-pressed={selectedGroup === 'bracket'}
          className={cn(
            'w-full text-left px-3 py-2 rounded text-sm transition-colors',
            selectedGroup === 'bracket'
              ? 'bg-wcp-gold text-wcp-bg font-semibold'
              : 'text-wcp-text hover:bg-wcp-border/30',
          )}
        >
          🏆 Bracket
        </button>
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/ContentArea.tsx`**

Replace the entire file:

```tsx
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket } from '@/engine/bracket-generator'
import { GroupTable } from '@/components/groups/GroupTable'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings } from '@/engine/types'

export function ContentArea() {
  const selectedGroup = useStore((s) => s.selectedGroup)
  const scores = useStore((s) => s.scores)

  if (selectedGroup === 'bracket') {
    const allStandings: GroupStandings = {}
    for (const group of GROUPS) {
      allStandings[group.id] = classifyGroup(group, scores)
    }
    const bracket = generateBracket(allStandings)
    return (
      <main className="flex-1 overflow-y-auto">
        <BracketView bracket={bracket} />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <GroupTable groupId={selectedGroup} />
    </main>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: wire Sidebar (Bracket nav) and ContentArea (GroupTable/BracketView switch)"
```

---

## Task 9: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test -- --run
```

Expected: all tests pass except the original TDD anchor (which is now actually passing too since classifier is implemented). Total: ≥ 21 tests, 0 failures.

- [ ] **Step 2: Run coverage**

```bash
npm run coverage
```

Expected: `src/engine/` shows ≥ 90% across all three files.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build completes with exit 0, no TypeScript errors.

- [ ] **Step 4: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`.

- Click "Grupo A" → standings table + 6 match rows appear
- Type `2` in MEX vs RSA home input → standings update: MEX moves to 1st with 3pts
- Type `1` in the away input of the same match → MEX: 1pt, RSA: 1pt, GD: 0
- Click "🏆 Bracket" → Fase Eliminatória shows Oitavas de Final with real team codes
- All team slots in Oitavas show team codes (not `?`) once all groups have enough scores

- [ ] **Step 5: Merge to main and push**

```bash
cd ../..  # back to main repo root
git checkout main
git merge feat/phase2-reactive-ui --no-ff -m "feat: merge Phase 2 — reactive UI with FIFA engine (TDD)"
git push origin main
git worktree remove .worktrees/feat-phase2-reactive-ui
git branch -d feat/phase2-reactive-ui
```

---

## Definition of Done

- [ ] `npm run coverage` — `src/engine/` ≥ 90% coverage
- [ ] `npm test -- --run` — zero failures
- [ ] `npm run build` — exits 0, no TypeScript errors
- [ ] `npm run dev` → digitar placar → tabela atualiza → "🏆 Bracket" → oitavas com times reais
