# Fase 7 — UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertical group accordion with a responsive card grid, add a gamified score-entry modal with progressive reveal, and fix the bracket horizontal scroll cut-off.

**Architecture:** `GroupAccordion` is replaced by `GroupGrid` (responsive grid) + `GroupCard` (individual card) + `MatchModal` (gamified score entry). The modal manages reveal/expand logic in local state; Zustand handles persistence. `BracketView` is fixed by removing `overflow-hidden` from its wrapper (the root cause of the cut-off) and applying `clamp()`-based responsive sizing. `UISlice` (`openGroups`/`toggleGroup`) is removed since the accordion is gone.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v3, Vitest + Testing Library, Playwright

---

## File Map

**Create:**
- `src/components/groups/GroupCard.tsx` — card with compact standings table + progress badge
- `src/components/groups/GroupGrid.tsx` — responsive 1→2→3→4 col grid + BracketView section
- `src/components/groups/MatchModal.tsx` — gamified modal with progressive reveal + collapse
- `src/components/groups/GroupCard.test.tsx`
- `src/components/groups/GroupGrid.test.tsx`
- `src/components/groups/MatchModal.test.tsx`

**Modify:**
- `src/components/groups/MatchRow.tsx` — add `compact?: boolean` + `onClick?: () => void` props
- `src/components/groups/MatchRow.test.tsx` — add compact mode tests
- `src/components/bracket/BracketView.tsx` — fix overflow, clamp sizes, bump font sizes
- `src/components/layout/AppShell.tsx` — swap `GroupAccordion` → `GroupGrid`
- `src/store/ui.slice.ts` — remove `openGroups` / `toggleGroup`
- `src/store/index.ts` — remove UISlice from StoreState
- `tailwind.config.ts` — add `slideDown` keyframe animation

**Delete:**
- `src/components/groups/GroupAccordion.tsx`
- `src/components/groups/GroupAccordion.test.tsx`

---

### Task 1: Add `compact` mode to MatchRow

**Files:**
- Modify: `src/components/groups/MatchRow.tsx`
- Modify: `src/components/groups/MatchRow.test.tsx`

- [ ] **Step 1: Write failing tests for compact mode**

Add these tests inside `src/components/groups/MatchRow.test.tsx`, after the existing `describe` block:

```tsx
describe('MatchRow compact mode', () => {
  it('renders team codes and scores without steppers', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('away-plus-A1')).not.toBeInTheDocument()
  })

  it('renders check mark in compact mode', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('calls onClick when compact row is clicked', () => {
    const onClick = vi.fn()
    render(
      <MatchRow
        match={match}
        homeScore={1}
        awayScore={0}
        onScoreChange={vi.fn()}
        compact
        onClick={onClick}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/macbookpro/Documents/Jonas/World-Cup-Predictor
npm run test -- MatchRow
```

Expected: 3 new tests FAIL with "compact mode" not found / steppers still rendered.

- [ ] **Step 3: Implement compact mode in MatchRow**

Replace the full content of `src/components/groups/MatchRow.tsx`:

```tsx
import type { Match } from '@/data/wc2026'
import { TEAMS } from '@/data/wc2026'
import { cn } from '@/lib/utils'

interface MatchRowProps {
  match: Match
  homeScore: number | undefined
  awayScore: number | undefined
  onScoreChange: (matchId: string, home: number, away: number) => void
  compact?: boolean
  onClick?: () => void
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
        aria-label="incrementar"
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
        aria-label="decrementar"
      >
        −
      </button>
    </div>
  )
}

export function MatchRow({ match, homeScore, awayScore, onScoreChange, compact, onClick }: MatchRowProps) {
  const home = homeScore ?? 0
  const away = awayScore ?? 0
  const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
  const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-2 gap-2 hover:bg-wcp-primary-faint transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg leading-none">{homeTeam?.flag}</span>
          <span className="text-xs font-semibold text-wcp-text">{match.homeTeam}</span>
        </div>
        <span className="text-sm font-bold text-wcp-text tabular-nums">{home} × {away}</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs font-semibold text-wcp-text">{match.awayTeam}</span>
          <span className="text-lg leading-none">{awayTeam?.flag}</span>
        </div>
        <span className="text-wcp-primary text-xs font-bold ml-2">✓</span>
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-3 gap-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-3xl leading-none">{homeTeam?.flag}</span>
        <span className="text-[10px] font-semibold text-wcp-text tracking-wide">{match.homeTeam}</span>
      </div>

      <div className="flex items-center gap-3">
        <Stepper
          value={home}
          onIncrement={() => onScoreChange(match.id, home + 1, away)}
          onDecrement={() => home > 0 && onScoreChange(match.id, home - 1, away)}
          testIdPlus={`home-plus-${match.id}`}
          testIdMinus={`home-minus-${match.id}`}
          testIdValue={`score-home-${match.id}`}
        />
        <span className="text-wcp-primary font-bold px-1">×</span>
        <Stepper
          value={away}
          onIncrement={() => onScoreChange(match.id, home, away + 1)}
          onDecrement={() => away > 0 && onScoreChange(match.id, home, away - 1)}
          testIdPlus={`away-plus-${match.id}`}
          testIdMinus={`away-minus-${match.id}`}
          testIdValue={`score-away-${match.id}`}
        />
      </div>

      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-3xl leading-none">{awayTeam?.flag}</span>
        <span className="text-[10px] font-semibold text-wcp-text tracking-wide">{match.awayTeam}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm all pass**

```bash
npm run test -- MatchRow
```

Expected: all tests PASS (previous 7 + new 3 = 10 total).

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/MatchRow.tsx src/components/groups/MatchRow.test.tsx
git commit -m "feat: add compact mode to MatchRow"
```

---

### Task 2: Add `slideDown` animation to Tailwind config

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Read current tailwind.config.ts**

Open `tailwind.config.ts` and locate the `theme.extend` block. Add `keyframes` and `animation` entries.

The `theme.extend` section currently has `colors`. Add alongside it:

```ts
keyframes: {
  slideDown: {
    '0%': { opacity: '0', transform: 'translateY(-8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  slideDown: 'slideDown 0.3s ease',
},
```

- [ ] **Step 2: Confirm build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds, no Tailwind errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add slideDown animation to Tailwind config"
```

---

### Task 3: Create GroupCard

**Files:**
- Create: `src/components/groups/GroupCard.tsx`
- Create: `src/components/groups/GroupCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/groups/GroupCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupCard } from './GroupCard'

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: {} })
  ),
}))

vi.mock('@/engine/classifier', () => ({
  classifyGroup: () => [
    { teamCode: 'MEX', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'RSA', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'KOR', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'CZE', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
  ],
}))

vi.mock('@/data/wc2026', () => ({
  GROUPS: [{ id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] }],
  FIXTURES: [
    { id: 'A1', group: 'A', homeTeam: 'MEX', awayTeam: 'RSA', stage: 'group' },
    { id: 'A2', group: 'A', homeTeam: 'KOR', awayTeam: 'CZE', stage: 'group' },
    { id: 'A3', group: 'A', homeTeam: 'MEX', awayTeam: 'KOR', stage: 'group' },
    { id: 'A4', group: 'A', homeTeam: 'CZE', awayTeam: 'RSA', stage: 'group' },
    { id: 'A5', group: 'A', homeTeam: 'MEX', awayTeam: 'CZE', stage: 'group' },
    { id: 'A6', group: 'A', homeTeam: 'RSA', awayTeam: 'KOR', stage: 'group' },
  ],
  TEAMS: [
    { code: 'MEX', name: 'México', flag: '🇲🇽', group: 'A' },
    { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', group: 'A' },
    { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', group: 'A' },
    { code: 'CZE', name: 'Tchéquia', flag: '🇨🇿', group: 'A' },
  ],
}))

describe('GroupCard', () => {
  it('renders group name', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('GRUPO A')).toBeInTheDocument()
  })

  it('renders all 4 team codes in standings', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.getByText('KOR')).toBeInTheDocument()
    expect(screen.getByText('CZE')).toBeInTheDocument()
  })

  it('shows progress as 0/6 when no scores', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('0/6')).toBeInTheDocument()
  })

  it('shows progress as 6/6 when all matches scored', async () => {
    const { useStore } = await import('@/store')
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({
        scores: {
          A1: { home: 1, away: 0 },
          A2: { home: 0, away: 0 },
          A3: { home: 2, away: 1 },
          A4: { home: 0, away: 1 },
          A5: { home: 3, away: 0 },
          A6: { home: 1, away: 1 },
        },
      })) as never)
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<GroupCard groupId="A" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test -- GroupCard
```

Expected: FAIL — `GroupCard` module not found.

- [ ] **Step 3: Implement GroupCard**

Create `src/components/groups/GroupCard.tsx`:

```tsx
import { useStore } from '@/store'
import { GROUPS, FIXTURES, TEAMS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { cn } from '@/lib/utils'

interface GroupCardProps {
  groupId: string
  onClick: () => void
}

export function GroupCard({ groupId, onClick }: GroupCardProps) {
  const scores = useStore((s) => s.scores)
  const group = GROUPS.find((g) => g.id === groupId)
  if (!group) return null

  const standings = classifyGroup(group, scores)
  const fixtures = FIXTURES.filter((f) => f.group === groupId)
  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length
  const isComplete = filledCount === fixtures.length

  return (
    <button
      onClick={onClick}
      data-testid={`group-card-${groupId}`}
      className={cn(
        'w-full text-left rounded-xl border transition-colors bg-wcp-surface hover:bg-wcp-primary-faint',
        isComplete ? 'border-wcp-primary' : 'border-wcp-border',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wcp-border">
        <span className="text-[10px] tracking-[3px] uppercase font-semibold text-wcp-primary">
          GRUPO {groupId}
        </span>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full',
            isComplete
              ? 'bg-wcp-primary text-white'
              : 'bg-wcp-surface-subtle text-wcp-muted',
          )}
        >
          {filledCount}/{fixtures.length}
        </span>
      </div>

      {/* Standings */}
      <div className="px-3 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-wcp-muted text-[9px] uppercase tracking-wide">
              <th className="text-left py-1 pr-2">#</th>
              <th className="text-left py-1">Seleção</th>
              <th className="text-center py-1 px-1">J</th>
              <th className="text-center py-1 px-1">SG</th>
              <th className="text-center py-1 px-1 text-wcp-primary font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const team = TEAMS.find((t) => t.code === s.teamCode)
              const qualifies = idx < 2
              return (
                <tr
                  key={s.teamCode}
                  className={cn(
                    'border-t border-wcp-border text-xs',
                    qualifies ? 'text-wcp-text' : 'text-wcp-muted',
                  )}
                >
                  <td className="py-1.5 pr-2">
                    <span className={cn('font-bold', qualifies && 'text-wcp-primary')}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <span className="mr-1">{team?.flag}</span>
                    <span className="font-semibold">{s.teamCode}</span>
                  </td>
                  <td className="py-1.5 text-center px-1 tabular-nums">{s.played}</td>
                  <td className="py-1.5 text-center px-1 tabular-nums">
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                  <td className="py-1.5 text-center px-1 font-bold text-wcp-primary tabular-nums">
                    {s.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm run test -- GroupCard
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/GroupCard.tsx src/components/groups/GroupCard.test.tsx
git commit -m "feat: add GroupCard component with compact standings and progress badge"
```

---

### Task 4: Create MatchModal

**Files:**
- Create: `src/components/groups/MatchModal.tsx`
- Create: `src/components/groups/MatchModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/groups/MatchModal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchModal } from './MatchModal'

const mockSetScore = vi.fn()
let mockScores: Record<string, { home: number; away: number }> = {}

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: mockScores, setScore: mockSetScore })
  ),
}))

vi.mock('@/data/wc2026', () => ({
  FIXTURES: [
    { id: 'A1', group: 'A', homeTeam: 'MEX', awayTeam: 'RSA', stage: 'group' },
    { id: 'A2', group: 'A', homeTeam: 'KOR', awayTeam: 'CZE', stage: 'group' },
    { id: 'A3', group: 'A', homeTeam: 'MEX', awayTeam: 'KOR', stage: 'group' },
    { id: 'A4', group: 'A', homeTeam: 'CZE', awayTeam: 'RSA', stage: 'group' },
    { id: 'A5', group: 'A', homeTeam: 'MEX', awayTeam: 'CZE', stage: 'group' },
    { id: 'A6', group: 'A', homeTeam: 'RSA', awayTeam: 'KOR', stage: 'group' },
  ],
  TEAMS: [
    { code: 'MEX', name: 'México', flag: '🇲🇽', group: 'A' },
    { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', group: 'A' },
    { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', group: 'A' },
    { code: 'CZE', name: 'Tchéquia', flag: '🇨🇿', group: 'A' },
  ],
}))

beforeEach(() => {
  mockScores = {}
  mockSetScore.mockClear()
})

describe('MatchModal', () => {
  it('renders group name in header', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
  })

  it('shows close button', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('modal-close')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<MatchModal groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows progress 0/6 initially', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('0/6')).toBeInTheDocument()
  })

  it('shows first match expanded (steppers visible)', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
  })

  it('second match hidden before first is scored', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.queryByTestId('home-plus-A2')).not.toBeInTheDocument()
  })

  it('reveals second match after first is scored', async () => {
    const { useStore } = await import('@/store')
    const { rerender } = render(<MatchModal groupId="A" onClose={vi.fn()} />)

    fireEvent.click(screen.getByTestId('home-plus-A1'))
    expect(mockSetScore).toHaveBeenCalledWith('A1', 1, 0)

    // Simulate store update
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    rerender(<MatchModal groupId="A" onClose={vi.fn()} />)

    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
  })

  it('shows first match as compact after second is revealed', async () => {
    const { useStore } = await import('@/store')
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)

    // A1 should be compact (no steppers)
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    // A2 should be expanded (steppers visible)
    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
    // A1 shows check mark
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('re-expands a compact match when clicked', async () => {
    const { useStore } = await import('@/store')
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)

    // A1 is compact — click it to re-expand
    fireEvent.click(screen.getByRole('button', { name: /MEX.*RSA/i }))
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
  })

  it('shows progress 6/6 when all matches scored', async () => {
    const { useStore } = await import('@/store')
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test -- MatchModal
```

Expected: FAIL — `MatchModal` module not found.

- [ ] **Step 3: Implement MatchModal**

Create `src/components/groups/MatchModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { MatchRow } from './MatchRow'
import { cn } from '@/lib/utils'

interface MatchModalProps {
  groupId: string
  onClose: () => void
}

export function MatchModal({ groupId, onClose }: MatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)

  const fixtures = FIXTURES.filter((f) => f.group === groupId)
  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length

  const firstUnfilledIdx = fixtures.findIndex((f) => scores[f.id] === undefined)
  const initialRevealedCount = firstUnfilledIdx === -1 ? fixtures.length : firstUnfilledIdx + 1
  const initialExpandedIndex = firstUnfilledIdx === -1 ? 0 : firstUnfilledIdx

  const [revealedCount, setRevealedCount] = useState(initialRevealedCount)
  const [expandedIndex, setExpandedIndex] = useState(initialExpandedIndex)

  // Sync revealed count if scores change externally (e.g., share link load)
  useEffect(() => {
    const newFirstUnfilled = fixtures.findIndex((f) => scores[f.id] === undefined)
    const newRevealed = newFirstUnfilled === -1 ? fixtures.length : newFirstUnfilled + 1
    if (newRevealed > revealedCount) {
      setRevealedCount(newRevealed)
    }
  }, [scores]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScoreChange = (matchId: string, home: number, away: number) => {
    const wasUnset = scores[matchId] === undefined
    setScore(matchId, home, away)
    if (wasUnset) {
      const matchIndex = fixtures.findIndex((f) => f.id === matchId)
      const nextIndex = matchIndex + 1
      if (nextIndex < fixtures.length && nextIndex >= revealedCount) {
        setRevealedCount(nextIndex + 1)
        setExpandedIndex(nextIndex)
      }
    }
  }

  const progressPct = Math.round((filledCount / fixtures.length) * 100)

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <div>
            <h2 className="font-bold text-wcp-text text-base">Grupo {groupId}</h2>
            <span className="text-xs text-wcp-muted tabular-nums">{filledCount}/{fixtures.length} jogos</span>
          </div>
          <button
            data-testid="modal-close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wcp-surface-subtle hover:bg-wcp-primary-faint flex items-center justify-center text-wcp-muted transition-colors"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-wcp-surface-subtle shrink-0">
          <div
            className="h-1 bg-wcp-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Matches */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-2">
          {fixtures.slice(0, revealedCount).map((match, idx) => {
            const isFilled = scores[match.id] !== undefined
            const isExpanded = idx === expandedIndex
            const isCompact = isFilled && !isExpanded

            if (isCompact) {
              return (
                <div key={match.id} className="animate-slideDown">
                  <MatchRow
                    match={match}
                    homeScore={scores[match.id]?.home}
                    awayScore={scores[match.id]?.away}
                    onScoreChange={handleScoreChange}
                    compact
                    onClick={() => setExpandedIndex(idx)}
                  />
                </div>
              )
            }

            return (
              <div
                key={match.id}
                className={cn('animate-slideDown', idx === revealedCount - 1 && idx !== 0 && 'animate-slideDown')}
              >
                <MatchRow
                  match={match}
                  homeScore={scores[match.id]?.home}
                  awayScore={scores[match.id]?.away}
                  onScoreChange={handleScoreChange}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm run test -- MatchModal
```

Expected: all 9 tests PASS. If the "re-expands compact match" test fails due to role query, adjust the test query to `screen.getByTestId('compact-A1')` and add `data-testid={`compact-${match.id}`}` to the compact button wrapper in MatchModal.

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/MatchModal.tsx src/components/groups/MatchModal.test.tsx
git commit -m "feat: add MatchModal with progressive reveal and compact collapse"
```

---

### Task 5: Create GroupGrid

**Files:**
- Create: `src/components/groups/GroupGrid.tsx`
- Create: `src/components/groups/GroupGrid.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/groups/GroupGrid.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupGrid } from './GroupGrid'

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: {} })
  ),
}))

vi.mock('@/engine/classifier', () => ({
  classifyGroup: () => [],
}))

vi.mock('@/engine/bracket-generator', () => ({
  generateBracket: () => ({
    roundOf32: Array.from({ length: 16 }, (_, i) => ({ id: `r32-${i + 1}`, home: null, away: null })),
    roundOf16: Array.from({ length: 16 }, (_, i) => ({ id: `r16-${i + 1}`, home: null, away: null })),
    quarterFinals: Array.from({ length: 8 }, (_, i) => ({ id: `qf-${i + 1}`, home: null, away: null })),
    semiFinals: Array.from({ length: 4 }, (_, i) => ({ id: `sf-${i + 1}`, home: null, away: null })),
    thirdPlace: { id: '3rd', home: null, away: null },
    final: { id: 'final', home: null, away: null },
  }),
}))

vi.mock('@/data/wc2026', () => ({
  GROUPS: 'ABCDEFGHIJKL'.split('').map((id) => ({ id, teams: [] })),
  FIXTURES: [],
  TEAMS: [],
}))

vi.mock('./GroupCard', () => ({
  GroupCard: ({ groupId, onClick }: { groupId: string; onClick: () => void }) => (
    <button data-testid={`group-card-${groupId}`} onClick={onClick}>
      Grupo {groupId}
    </button>
  ),
}))

vi.mock('./MatchModal', () => ({
  MatchModal: ({ groupId, onClose }: { groupId: string; onClose: () => void }) => (
    <div data-testid={`modal-${groupId}`}>
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}))

describe('GroupGrid', () => {
  it('renders 12 group cards', () => {
    render(<GroupGrid />)
    for (const g of 'ABCDEFGHIJKL'.split('')) {
      expect(screen.getByTestId(`group-card-${g}`)).toBeInTheDocument()
    }
  })

  it('does not show modal initially', () => {
    render(<GroupGrid />)
    expect(screen.queryByTestId('modal-A')).not.toBeInTheDocument()
  })

  it('shows modal when a group card is clicked', () => {
    render(<GroupGrid />)
    fireEvent.click(screen.getByTestId('group-card-A'))
    expect(screen.getByTestId('modal-A')).toBeInTheDocument()
  })

  it('closes modal when onClose is called', () => {
    render(<GroupGrid />)
    fireEvent.click(screen.getByTestId('group-card-A'))
    fireEvent.click(screen.getByText('Fechar'))
    expect(screen.queryByTestId('modal-A')).not.toBeInTheDocument()
  })

  it('renders bracket section', () => {
    render(<GroupGrid />)
    expect(screen.getByText('FASE ELIMINATÓRIA')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test -- GroupGrid
```

Expected: FAIL — `GroupGrid` module not found.

- [ ] **Step 3: Implement GroupGrid**

Create `src/components/groups/GroupGrid.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket } from '@/engine/bracket-generator'
import { GroupCard } from './GroupCard'
import { MatchModal } from './MatchModal'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings } from '@/engine/types'

const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function GroupGrid() {
  const scores = useStore((s) => s.scores)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  const allStandings = useMemo(() => {
    const result: GroupStandings = {}
    for (const group of GROUPS) {
      result[group.id] = classifyGroup(group, scores)
    }
    return result
  }, [scores])

  const bracket = useMemo(() => generateBracket(allStandings), [allStandings])

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
          <BracketView bracket={bracket} />
        </div>
      </div>

      {/* Modal */}
      {activeGroupId && (
        <MatchModal
          groupId={activeGroupId}
          onClose={() => setActiveGroupId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm run test -- GroupGrid
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/GroupGrid.tsx src/components/groups/GroupGrid.test.tsx
git commit -m "feat: add GroupGrid with responsive layout and modal integration"
```

---

### Task 6: Fix BracketView overflow and sizing

**Files:**
- Modify: `src/components/bracket/BracketView.tsx`

The root cause of the cut-off: `GroupAccordion` wraps the bracket in `overflow-hidden`, which clips the horizontal scroll area. The new `GroupGrid` no longer uses `overflow-hidden` on the bracket wrapper, so the bug is fixed at the container level. However, `BracketView` itself also needs `px-4` (instead of `px-2`) on the scroll container so left-side oitavas have breathing room, plus `clamp()`-based sizing and updated font sizes.

- [ ] **Step 1: Read current BracketView.test.tsx**

```bash
cat src/components/bracket/BracketView.test.tsx
```

Check which text strings are asserted (e.g., font size classes). Tests should not need changes since they check content, not CSS classes.

- [ ] **Step 2: Update BracketView**

In `src/components/bracket/BracketView.tsx`, make these targeted changes:

**a) DesktopBracket scroll wrapper** — change `px-2` to `px-4` and remove `min-w-[900px]` fixed width:

```tsx
// Before:
<div className="overflow-x-auto py-4 px-2">
  <div className="flex items-center justify-center gap-2 min-w-[900px]">

// After:
<div className="overflow-x-auto py-4 px-4">
  <div className="flex items-center justify-center min-w-fit" style={{ gap: 'clamp(12px, 2vw, 32px)' }}>
```

**b) MatchCard** — add responsive `minWidth` via inline style:

```tsx
// Before:
<div
  data-testid={`bracket-match-${match.id}`}
  className="bg-wcp-surface border border-wcp-border rounded-lg overflow-hidden min-w-[110px]"
>

// After:
<div
  data-testid={`bracket-match-${match.id}`}
  className="bg-wcp-surface border border-wcp-border rounded-lg overflow-hidden"
  style={{ minWidth: 'clamp(110px, 11vw, 150px)' }}
>
```

**c) TeamSlot** — bump font size from `text-xs` to `text-sm`:

```tsx
// Before:
className={cn(
  'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs',
  ...
)}

// After:
className={cn(
  'flex items-center gap-1.5 px-2 py-1.5 rounded text-sm',
  ...
)}
```

**d) RoundColumn label** — bump from `text-[8px]` to `text-[10px]`:

```tsx
// Before:
<span className="text-[8px] text-wcp-muted tracking-[2px] uppercase mb-1">{title}</span>

// After:
<span className="text-[10px] text-wcp-muted tracking-[2px] uppercase mb-1">{title}</span>
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- BracketView
```

Expected: all existing BracketView tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/bracket/BracketView.tsx
git commit -m "fix: bracket overflow cut-off, responsive clamp sizing, larger fonts"
```

---

### Task 7: Update AppShell and remove UISlice

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/store/ui.slice.ts`
- Modify: `src/store/index.ts`

- [ ] **Step 1: Update AppShell to use GroupGrid**

In `src/components/layout/AppShell.tsx`, replace the import and usage:

```tsx
// Remove:
import { GroupAccordion } from '@/components/groups/GroupAccordion'

// Add:
import { GroupGrid } from '@/components/groups/GroupGrid'
```

And in the JSX:

```tsx
// Remove:
<GroupAccordion />

// Add:
<GroupGrid />
```

- [ ] **Step 2: Clear UISlice (openGroups no longer needed)**

Replace `src/store/ui.slice.ts` with an empty slice:

```ts
// openGroups/toggleGroup removed in Fase 7 — accordion replaced by GroupGrid + MatchModal
```

Actually, since we're removing UISlice entirely, just delete its contents and remove it from the store. Replace `src/store/ui.slice.ts` with:

```ts
// UISlice intentionally empty — removed with accordion in Fase 7
export interface UISlice {}
export const createUISlice = () => ({})
```

- [ ] **Step 3: Update store/index.ts**

The `StoreState` still composes correctly with an empty UISlice. No change needed to `src/store/index.ts` if UISlice exports remain compatible. Verify the build passes.

- [ ] **Step 4: Build to check TypeScript**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds. If TypeScript complains about `openGroups` or `toggleGroup` used anywhere, trace the error and remove the usage (should only be in GroupAccordion which we're deleting next).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppShell.tsx src/store/ui.slice.ts
git commit -m "feat: swap GroupAccordion for GroupGrid in AppShell, clear UISlice"
```

---

### Task 8: Delete GroupAccordion and run full test suite

**Files:**
- Delete: `src/components/groups/GroupAccordion.tsx`
- Delete: `src/components/groups/GroupAccordion.test.tsx`

- [ ] **Step 1: Delete GroupAccordion files**

```bash
cd /Users/macbookpro/Documents/Jonas/World-Cup-Predictor
rm src/components/groups/GroupAccordion.tsx
rm src/components/groups/GroupAccordion.test.tsx
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

Expected: all tests pass. If any test imports `GroupAccordion`, update or remove that import.

- [ ] **Step 3: Build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove GroupAccordion (replaced by GroupGrid + MatchModal)"
```

---

### Task 9: E2E test update

**Files:**
- Modify: `e2e/` — update or add test for the new group card → modal flow

- [ ] **Step 1: Check existing E2E tests**

```bash
ls e2e/
cat e2e/*.spec.ts 2>/dev/null || cat e2e/*.test.ts 2>/dev/null
```

- [ ] **Step 2: Add E2E test for modal flow**

Add to the appropriate E2E spec file (or create `e2e/groups-modal.spec.ts`):

```ts
import { test, expect } from '@playwright/test'

test('group card opens modal with match entry', async ({ page }) => {
  await page.goto('/')
  
  // Group cards are visible
  await expect(page.getByTestId('group-card-A')).toBeVisible()
  
  // Click group A card
  await page.getByTestId('group-card-A').click()
  
  // Modal opens with group name
  await expect(page.getByText('Grupo A')).toBeVisible()
  
  // First match is expanded (stepper visible)
  const firstPlusBtn = page.getByTestId(/home-plus-A/).first()
  await expect(firstPlusBtn).toBeVisible()
  
  // Score a goal
  await firstPlusBtn.click()
  
  // Progress bar updates (no assertion needed — visual)
  
  // Close modal
  await page.getByTestId('modal-close').click()
  
  // Modal is gone
  await expect(page.getByTestId('modal-close')).not.toBeVisible()
  
  // Card progress badge updates to 1/6
  await expect(page.getByTestId('group-card-A').getByText('1/6')).toBeVisible()
})

test('bracket is visible without horizontal cut-off', async ({ page }) => {
  await page.goto('/')
  
  // Scroll to bracket section
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  
  // First round column (Oitavas) is visible
  const firstOitavasMatch = page.getByTestId('bracket-match-r32-1')
  await expect(firstOitavasMatch).toBeVisible()
})
```

- [ ] **Step 3: Run E2E tests**

```bash
npm run test:e2e
```

Expected: new tests pass alongside existing ones.

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test: add E2E for group modal flow and bracket visibility"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Grid responsivo 1→2→3→4 colunas | Task 5 (GroupGrid) |
| GroupCard com standings + progress badge | Task 3 (GroupCard) |
| MatchModal com reveal progressivo | Task 4 (MatchModal) |
| Jogo preenchido colapsa para compact | Task 4 (MatchModal) |
| Re-expand ao clicar compacto | Task 4 (MatchModal) + Task 1 (MatchRow compact onClick) |
| Bracket overflow fix | Task 6 (BracketView) |
| Bracket clamp() sizing | Task 6 (BracketView) |
| Font size aumentado no bracket | Task 6 (BracketView) |
| slideDown animation | Task 2 (tailwind.config.ts) |
| UISlice limpeza | Task 7 |
| AppShell swap | Task 7 |
| GroupAccordion removido | Task 8 |

**Placeholder scan:** None found.

**Type consistency:**
- `MatchRowProps.compact?: boolean` defined in Task 1, used in Task 4 ✓
- `MatchRowProps.onClick?: () => void` defined in Task 1, used in Task 4 ✓
- `GroupCardProps` defined in Task 3, consumed in Task 5 ✓
- `MatchModalProps` defined in Task 4, consumed in Task 5 ✓
- `GroupStandings` type imported from `@/engine/types` in Task 5 ✓
