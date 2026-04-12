# Phase 1 — Foundation & AppShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full project stack, apply the dark gold theme, and render the AppShell (Sidebar + ContentArea) visible in the browser, with engine stubs ready for TDD.

**Architecture:** Vite + React 19 + TypeScript SPA. Zustand manages global state (scores + selected group) persisted to localStorage. TanStack Query is configured and ready for API calls in Phase 4. Engine lives in `src/engine/` as pure TypeScript with zero React dependencies, tested via Vitest.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v3, Shadcn/UI, Zustand (persist), TanStack Query v5, Vitest + @vitest/coverage-v8

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `vite.config.ts` | Modify | Add `@` path alias |
| `tsconfig.app.json` | Modify | Add paths for `@` alias |
| `tailwind.config.ts` | Create | Dark gold theme tokens |
| `src/index.css` | Replace | OKLCH CSS variables + Tailwind directives |
| `src/data/wc2026.ts` | Create | 48 teams, 12 groups, 72 fixtures |
| `src/engine/types.ts` | Create | Shared engine types |
| `src/engine/classifier.ts` | Create | Stub — classifyGroup |
| `src/engine/tiebreaker.ts` | Create | Stub — applyTiebreakers |
| `src/engine/bracket-generator.ts` | Create | Stub — generateBracket |
| `src/engine/classifier.test.ts` | Create | Failing test (TDD anchor) |
| `src/store/types.ts` | Create | StoreState combined type |
| `src/store/tournament.slice.ts` | Create | Scores state + setScore |
| `src/store/ui.slice.ts` | Create | selectedGroup + setSelectedGroup |
| `src/store/index.ts` | Create | createStore with persist |
| `src/lib/query-client.ts` | Create | TanStack Query config |
| `src/components/layout/AppShell.tsx` | Create | Root layout shell |
| `src/components/layout/Sidebar.tsx` | Create | Group list panel |
| `src/components/layout/ContentArea.tsx` | Create | Main area placeholder |
| `src/main.tsx` | Replace | Providers + AppShell entry |
| `src/App.tsx` | Delete | Not used — AppShell replaces it |
| `src/App.css` | Delete | Not used |
| `vitest.config.ts` | Create | Test environment + coverage |
| `package.json` | Modify | Add test/coverage scripts |

---

## Task 1: Create feature branch

**Files:** none

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/phase1-scaffold
```

Expected: `Switched to a new branch 'feat/phase1-scaffold'`

---

## Task 2: Scaffold Vite + React 19 + TypeScript

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Run Vite scaffolder in current directory**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?", press `y` (existing CLAUDE.md and docs/ will not be overwritten — Vite only creates its own files).

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Install path types (needed for `@` alias)**

```bash
npm install -D @types/node
```

- [ ] **Step 4: Add `@` alias to `vite.config.ts`**

Replace the entire file:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Add `@` alias to `tsconfig.app.json`**

Inside `compilerOptions`, add:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: `Local: http://localhost:5173/` with no errors. Open in browser — the default Vite + React page should appear. Stop the server.

---

## Task 3: Install and configure Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`
- Replace: `src/index.css`

- [ ] **Step 1: Install Tailwind CSS v3**

```bash
npm install -D tailwindcss@3 postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p --ts
```

- [ ] **Step 2: Replace `tailwind.config.ts` with dark gold theme**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wcp: {
          bg:      '#0c0a00',
          sidebar: '#1a1500',
          gold:    '#f59e0b',
          text:    '#fef3c7',
          border:  '#78350f',
          muted:   '#92400e',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 3: Replace `src/index.css` with Tailwind directives and CSS variables**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-wcp-border;
  }
  body {
    @apply bg-wcp-bg text-wcp-text;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 4: Make sure `src/main.tsx` imports `index.css`**

Open `src/main.tsx`. It should already have `import './index.css'`. If not, add it as the first import.

---

## Task 4: Install and configure Shadcn/UI

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `tailwind.config.ts` (Shadcn merges its config)

- [ ] **Step 1: Run Shadcn init**

```bash
npx shadcn@latest init
```

Answer the prompts:
- Style: **Default**
- Base color: **Neutral** (we'll override with our theme)
- CSS variables: **yes**

This creates `components.json` and `src/lib/utils.ts` (with `cn` helper).

- [ ] **Step 2: Confirm `src/lib/utils.ts` was created**

```bash
cat src/lib/utils.ts
```

Expected:
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Task 5: Install Zustand and TanStack Query

**Files:** `package.json` (only changes)

- [ ] **Step 1: Install state and data-fetching libraries**

```bash
npm install zustand @tanstack/react-query
```

- [ ] **Step 2: Verify install**

```bash
npm ls zustand @tanstack/react-query
```

Expected: both packages listed without errors.

---

## Task 6: Install and configure Vitest

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install Vitest and testing utilities**

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/engine/**'],
      exclude: ['src/engine/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `"scripts"` section, add or replace:

```json
"test": "vitest",
"coverage": "vitest run --coverage"
```

Full scripts section should be:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "coverage": "vitest run --coverage"
}
```

---

## Task 7: Create `src/data/wc2026.ts`

**Files:**
- Create: `src/data/wc2026.ts`

- [ ] **Step 1: Create the data file**

```ts
// Official FIFA World Cup 2026 — Draw held December 5, 2025, Kennedy Center, Washington D.C.

export interface Team {
  code: string
  name: string
  flag: string
  group: string
}

export interface Match {
  id: string
  group: string
  homeTeam: string
  awayTeam: string
  stage: 'group'
}

export interface Group {
  id: string
  teams: string[] // 4 team codes, in draw order
}

export const TEAMS: Team[] = [
  // Group A
  { code: 'MEX', name: 'México',        flag: '🇲🇽', group: 'A' },
  { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', group: 'A' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', group: 'A' },
  { code: 'CZE', name: 'Tchéquia',      flag: '🇨🇿', group: 'A' },
  // Group B
  { code: 'CAN', name: 'Canadá',        flag: '🇨🇦', group: 'B' },
  { code: 'BIH', name: 'Bósnia e Herz.',flag: '🇧🇦', group: 'B' },
  { code: 'QAT', name: 'Catar',         flag: '🇶🇦', group: 'B' },
  { code: 'SUI', name: 'Suíça',         flag: '🇨🇭', group: 'B' },
  // Group C
  { code: 'BRA', name: 'Brasil',        flag: '🇧🇷', group: 'C' },
  { code: 'MAR', name: 'Marrocos',      flag: '🇲🇦', group: 'C' },
  { code: 'HAI', name: 'Haiti',         flag: '🇭🇹', group: 'C' },
  { code: 'SCO', name: 'Escócia',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  // Group D
  { code: 'USA', name: 'Estados Unidos',flag: '🇺🇸', group: 'D' },
  { code: 'PAR', name: 'Paraguai',      flag: '🇵🇾', group: 'D' },
  { code: 'AUS', name: 'Austrália',     flag: '🇦🇺', group: 'D' },
  { code: 'TUR', name: 'Turquia',       flag: '🇹🇷', group: 'D' },
  // Group E
  { code: 'GER', name: 'Alemanha',      flag: '🇩🇪', group: 'E' },
  { code: 'CUW', name: 'Curaçao',       flag: '🇨🇼', group: 'E' },
  { code: 'CIV', name: 'Costa do Marfim',flag:'🇨🇮', group: 'E' },
  { code: 'ECU', name: 'Equador',       flag: '🇪🇨', group: 'E' },
  // Group F
  { code: 'NED', name: 'Holanda',       flag: '🇳🇱', group: 'F' },
  { code: 'JPN', name: 'Japão',         flag: '🇯🇵', group: 'F' },
  { code: 'SWE', name: 'Suécia',        flag: '🇸🇪', group: 'F' },
  { code: 'TUN', name: 'Tunísia',       flag: '🇹🇳', group: 'F' },
  // Group G
  { code: 'BEL', name: 'Bélgica',       flag: '🇧🇪', group: 'G' },
  { code: 'EGY', name: 'Egito',         flag: '🇪🇬', group: 'G' },
  { code: 'IRN', name: 'Irã',           flag: '🇮🇷', group: 'G' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿', group: 'G' },
  // Group H
  { code: 'ESP', name: 'Espanha',       flag: '🇪🇸', group: 'H' },
  { code: 'CPV', name: 'Cabo Verde',    flag: '🇨🇻', group: 'H' },
  { code: 'KSA', name: 'Arábia Saudita',flag: '🇸🇦', group: 'H' },
  { code: 'URU', name: 'Uruguai',       flag: '🇺🇾', group: 'H' },
  // Group I
  { code: 'FRA', name: 'França',        flag: '🇫🇷', group: 'I' },
  { code: 'SEN', name: 'Senegal',       flag: '🇸🇳', group: 'I' },
  { code: 'NOR', name: 'Noruega',       flag: '🇳🇴', group: 'I' },
  { code: 'IRQ', name: 'Iraque',        flag: '🇮🇶', group: 'I' },
  // Group J
  { code: 'ARG', name: 'Argentina',     flag: '🇦🇷', group: 'J' },
  { code: 'ALG', name: 'Argélia',       flag: '🇩🇿', group: 'J' },
  { code: 'AUT', name: 'Áustria',       flag: '🇦🇹', group: 'J' },
  { code: 'JOR', name: 'Jordânia',      flag: '🇯🇴', group: 'J' },
  // Group K
  { code: 'POR', name: 'Portugal',      flag: '🇵🇹', group: 'K' },
  { code: 'COD', name: 'RD Congo',      flag: '🇨🇩', group: 'K' },
  { code: 'UZB', name: 'Uzbequistão',   flag: '🇺🇿', group: 'K' },
  { code: 'COL', name: 'Colômbia',      flag: '🇨🇴', group: 'K' },
  // Group L
  { code: 'ENG', name: 'Inglaterra',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { code: 'CRO', name: 'Croácia',       flag: '🇭🇷', group: 'L' },
  { code: 'GHA', name: 'Gana',          flag: '🇬🇭', group: 'L' },
  { code: 'PAN', name: 'Panamá',        flag: '🇵🇦', group: 'L' },
]

export const GROUPS: Group[] = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'NOR', 'IRQ'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
]

// Generate 72 group-stage fixtures (6 per group, 3 matchdays)
// Matchday 1: T1 vs T2, T3 vs T4
// Matchday 2: T1 vs T3, T2 vs T4
// Matchday 3: T1 vs T4, T2 vs T3
export const FIXTURES: Match[] = GROUPS.flatMap(({ id, teams: [t1, t2, t3, t4] }) => [
  { id: `${id}1`, group: id, homeTeam: t1, awayTeam: t2, stage: 'group' },
  { id: `${id}2`, group: id, homeTeam: t3, awayTeam: t4, stage: 'group' },
  { id: `${id}3`, group: id, homeTeam: t1, awayTeam: t3, stage: 'group' },
  { id: `${id}4`, group: id, homeTeam: t2, awayTeam: t4, stage: 'group' },
  { id: `${id}5`, group: id, homeTeam: t1, awayTeam: t4, stage: 'group' },
  { id: `${id}6`, group: id, homeTeam: t2, awayTeam: t3, stage: 'group' },
])
```

- [ ] **Step 2: Verify counts via TypeScript**

The data will be validated during `npm run build` (Task 13 Step 5). No manual verification needed here — the TypeScript compiler will catch any type mismatches, and the test in Task 8 will fail if the fixture IDs don't match.

---

## Task 8: Create engine types and stubs

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/classifier.ts`
- Create: `src/engine/tiebreaker.ts`
- Create: `src/engine/bracket-generator.ts`
- Create: `src/engine/classifier.test.ts`

- [ ] **Step 1: Create `src/engine/types.ts`**

```ts
import type { Group, Match } from '@/data/wc2026'

export interface Standing {
  teamCode: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

// keyed by Match.id → score
export type ScoreMap = Record<string, { home: number; away: number }>

// keyed by Group.id → sorted standings
export type GroupStandings = Record<string, Standing[]>

export interface BracketMatch {
  id: string
  home: string | null  // team code or null if not yet determined
  away: string | null
}

export interface Bracket {
  roundOf32: BracketMatch[]
  quarterFinals: BracketMatch[]
  semiFinals: BracketMatch[]
  thirdPlace: BracketMatch
  final: BracketMatch
}
```

- [ ] **Step 2: Create `src/engine/classifier.ts`**

```ts
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'

export function classifyGroup(_group: Group, _scores: ScoreMap): Standing[] {
  throw new Error('not implemented')
}
```

- [ ] **Step 3: Create `src/engine/tiebreaker.ts`**

```ts
import type { ScoreMap, Standing } from './types'

export function applyTiebreakers(_tied: Standing[], _scores: ScoreMap): Standing[] {
  throw new Error('not implemented')
}
```

- [ ] **Step 4: Create `src/engine/bracket-generator.ts`**

```ts
import type { GroupStandings, Bracket } from './types'

export function generateBracket(_standings: GroupStandings): Bracket {
  throw new Error('not implemented')
}
```

- [ ] **Step 5: Create the TDD anchor test `src/engine/classifier.test.ts`**

```ts
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
```

- [ ] **Step 6: Run the test — confirm it FAILS with "not implemented"**

```bash
npm test -- --run src/engine/classifier.test.ts
```

Expected output:
```
FAIL src/engine/classifier.test.ts
  classifyGroup
    × returns 4 standings for a completed group
      Error: not implemented
```

This confirms the TDD baseline is set. The test will pass once `classifyGroup` is implemented in the next development phase.

- [ ] **Step 7: Commit engine stubs and failing test**

```bash
git add src/engine/ src/data/
git commit -m "feat: add wc2026 data, engine stubs, and TDD anchor test"
```

---

## Task 9: Create Zustand store

**Files:**
- Create: `src/store/tournament.slice.ts`
- Create: `src/store/ui.slice.ts`
- Create: `src/store/index.ts`

- [ ] **Step 1: Create `src/store/tournament.slice.ts`**

```ts
import type { StateCreator } from 'zustand'

export interface TournamentSlice {
  scores: Record<string, { home: number; away: number }>
  setScore: (matchId: string, home: number, away: number) => void
  resetScores: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  resetScores: () => set({ scores: {} }),
})
```

- [ ] **Step 2: Create `src/store/ui.slice.ts`**

```ts
import type { StateCreator } from 'zustand'

export interface UISlice {
  selectedGroup: string
  setSelectedGroup: (group: string) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  selectedGroup: 'A',
  setSelectedGroup: (group) => set({ selectedGroup: group }),
})
```

- [ ] **Step 3: Create `src/store/index.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTournamentSlice, TournamentSlice } from './tournament.slice'
import { createUISlice, UISlice } from './ui.slice'

export type StoreState = TournamentSlice & UISlice

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createTournamentSlice(...a),
      ...createUISlice(...a),
    }),
    { name: 'wcp2026-state' }
  )
)
```

---

## Task 10: Create TanStack Query client

**Files:**
- Create: `src/lib/query-client.ts`

- [ ] **Step 1: Create `src/lib/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes — respects football-data.org 10 req/min limit
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Task 11: Create layout components

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/ContentArea.tsx`

- [ ] **Step 1: Create `src/components/layout/ContentArea.tsx`**

```tsx
export function ContentArea() {
  return (
    <main className="flex-1 flex items-center justify-center overflow-y-auto">
      <p className="text-wcp-text/40 text-sm tracking-wide">
        Selecione um grupo para começar.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

```tsx
import { useStore } from '@/store'

const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function Sidebar() {
  const selectedGroup = useStore((s) => s.selectedGroup)
  const setSelectedGroup = useStore((s) => s.setSelectedGroup)

  return (
    <aside className="w-60 h-full bg-wcp-sidebar border-r border-wcp-border flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-wcp-border">
        <h1 className="text-wcp-gold font-bold text-base tracking-wide">
          🏆 WC 2026
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {GROUP_IDS.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={[
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              selectedGroup === g
                ? 'bg-wcp-gold text-wcp-bg font-semibold'
                : 'text-wcp-text hover:bg-wcp-border/30',
            ].join(' ')}
          >
            Grupo {g}
          </button>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/AppShell.tsx`**

```tsx
import { Sidebar } from './Sidebar'
import { ContentArea } from './ContentArea'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-wcp-bg text-wcp-text">
      <Sidebar />
      <ContentArea />
    </div>
  )
}
```

---

## Task 12: Wire up `main.tsx` and delete boilerplate

**Files:**
- Replace: `src/main.tsx`
- Delete: `src/App.tsx`, `src/App.css`

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AppShell } from '@/components/layout/AppShell'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Delete boilerplate files**

```bash
rm src/App.tsx src/App.css
```

If `src/assets/` exists and is empty or only has the default Vite SVG, remove it too:

```bash
rm -rf src/assets
```

---

## Task 13: Verify in browser and run tests

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:5173` in the browser.

**Expected:** Dark black background (`#0c0a00`), sidebar on the left showing "🏆 WC 2026" header and 12 group buttons (A–L), "Grupo A" highlighted in gold. Main area shows "Selecione um grupo para começar." in muted text.

- [ ] **Step 2: Verify sidebar interaction**

Click "Grupo C" — it should highlight in gold and "Grupo A" should deselect.

- [ ] **Step 3: Verify localStorage persistence**

Open DevTools → Application → localStorage. Confirm `wcp2026-state` key exists with `selectedGroup` value.

Refresh the page — the selected group should persist.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected:
```
FAIL src/engine/classifier.test.ts
  × returns 4 standings for a completed group
    Error: not implemented

Test Files: 1 failed (1)
```

One failing test is correct — it is the TDD anchor for the engine implementation phase.

- [ ] **Step 5: Run build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds with no type errors.

---

## Task 14: Final commit

- [ ] **Step 1: Stage all files**

```bash
git add .
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: scaffold Phase 1 — full stack, dark gold AppShell, engine stubs"
```

- [ ] **Step 3: Confirm status**

```bash
git log --oneline -3
```

Expected (top 2 lines):
```
<hash> feat: scaffold Phase 1 — full stack, dark gold AppShell, engine stubs
<hash> feat: add wc2026 data, engine stubs, and TDD anchor test
```

---

## Definition of Done

- [ ] `npm run dev` shows dark gold AppShell with sidebar (Grupos A–L) and content placeholder
- [ ] Clicking group buttons changes the active selection and persists on refresh
- [ ] `npm run build` completes without TypeScript errors
- [ ] `npm test -- --run` shows exactly 1 failing test (`classifyGroup — not implemented`)
- [ ] `git log` shows 3 commits on `feat/phase1-scaffold`
