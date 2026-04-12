# Design Spec: Phase 1 — Foundation & AppShell

**Date:** 2026-04-12
**Status:** Approved

---

## Objective

Scaffold the full project stack, apply the dark gold theme, and render the AppShell (Sidebar + ContentArea) in the browser. Engine stubs are created and ready for TDD in the next steps of Phase 1.

**Success criteria:** `npm run dev` shows AppShell with dark gold theme, sidebar listing Grupos A–L, and content area placeholder. `npm run test` runs without errors.

---

## Approach

Full scaffold from day 1 — install all dependencies at once (Vite, React 19, TypeScript, Tailwind, Shadcn/UI, Zustand, TanStack Query, Vitest) before writing any logic. This avoids setup churn later and ensures TDD starts with everything in place.

---

## Project Structure

```
src/
├── data/
│   └── wc2026.ts             # 48 teams, 12 groups, official fixtures
├── engine/                   # Pure logic — zero React deps
│   ├── classifier.ts         # stub (TDD next)
│   ├── tiebreaker.ts         # stub (TDD next)
│   └── bracket-generator.ts  # stub (TDD next)
├── store/
│   ├── tournament.slice.ts   # Zustand slice — match scores
│   ├── ui.slice.ts           # Zustand slice — selected group, UI state
│   └── index.ts              # createStore with persist middleware
├── components/
│   └── layout/
│       ├── AppShell.tsx      # Root layout: sidebar + content
│       ├── Sidebar.tsx       # Fixed left panel — group list
│       └── ContentArea.tsx   # Main area — placeholder
├── lib/
│   └── query-client.ts       # TanStack Query: staleTime 5min, no refetchOnFocus
└── main.tsx                  # React 19 root, QueryClientProvider, app entry
```

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| react, react-dom | 19 | UI framework |
| typescript | latest | Type safety |
| vite | latest | Dev server + build |
| tailwindcss | latest | Utility CSS |
| @shadcn/ui | latest | Component library (cssVariables: true) |
| zustand | latest | Global state + persist middleware |
| @tanstack/react-query | v5 | Data fetching (API calls, Phase 4) |
| vitest | latest | Unit tests |
| @vitest/coverage-v8 | latest | Coverage reports |

---

## Theme

| Token | Value | Usage |
|---|---|---|
| Background | `#0c0a00` | App background |
| Sidebar bg | `#1a1500` | Sidebar panel |
| Accent | `#f59e0b` | Gold — headings, icons, active states |
| Text | `#fef3c7` | Primary text |
| Border | `#78350f` | Dividers, panel borders |

Implemented as Tailwind CSS variables (OKLCH format) in `globals.css`.

---

## Data Model (`wc2026.ts`)

```ts
export interface Team {
  code: string    // e.g. "BRA"
  name: string    // e.g. "Brasil"
  flag: string    // emoji or ISO code for flag rendering
  group: string   // e.g. "A"
}

export interface Match {
  id: string
  group: string
  homeTeam: string   // Team code
  awayTeam: string   // Team code
  stage: "group"
}

export interface Group {
  id: string         // "A" through "L"
  teams: string[]    // Team codes (4 per group)
}

export const TEAMS: Team[]
export const GROUPS: Group[]
export const FIXTURES: Match[]
```

All 48 teams and 64 group-stage fixtures use the official FIFA 2026 draw.

---

## Engine Stubs

Each file exports the function signatures needed for TDD, throwing `"not implemented"` until tests drive the implementation:

```ts
// classifier.ts
export function classifyGroup(group: Group, scores: ScoreMap): Standing[] {
  throw new Error("not implemented")
}

// tiebreaker.ts
export function applyTiebreakers(tied: Standing[], scores: ScoreMap): Standing[] {
  throw new Error("not implemented")
}

// bracket-generator.ts
export function generateBracket(standings: GroupStandings): Bracket {
  throw new Error("not implemented")
}
```

---

## Zustand Store

```ts
// tournament.slice.ts
interface TournamentState {
  scores: Record<string, { home: number; away: number }>  // keyed by Match.id
  setScore: (matchId: string, home: number, away: number) => void
}

// ui.slice.ts
interface UIState {
  selectedGroup: string  // "A" through "L"
  setSelectedGroup: (group: string) => void
}

// index.ts — persist to localStorage key: "wcp2026-state"
```

---

## TanStack Query Config

```ts
// lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Components

**AppShell:** `flex h-screen overflow-hidden` — sidebar fixed width (240px), ContentArea fills remaining space. Wraps both inside `QueryClientProvider`.

**Sidebar:** Dark gold panel. Header: "WC 2026" + trophy icon. Body: list of "Grupo A" through "Grupo L" as nav items. Active item highlighted in gold. No routing logic yet.

**ContentArea:** Centered placeholder: "Selecione um grupo para começar."

---

## Testing Setup

- `vitest.config.ts` with `environment: "jsdom"` and `coverage` via v8
- `watchTriggerPatterns` configured per CLAUDE.md
- Engine stubs have placeholder tests that fail by design — TDD begins immediately after scaffold

---

## Out of Scope for This Phase

- Match score input (Phase 2)
- Group table rendering with real data (Phase 2)
- Bracket view (Phase 2)
- API integration (Phase 4)
- E2E tests (Phase 3)
