# Fase 9 — Simulador Automático + Reset por Partida + Info de Jogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar simulação automática de partidas via distribuição de Poisson ponderada por ranking FIFA, reset individual de placar por partida, e exibição de data/horário/sede no accordion expandido de cada jogo.

**Architecture:** Engine puro (`simulator.ts`) gera placares sem depender de React; store ganha dois actions (`clearScore`, `simulateMissing`); UI conecta via props, mantendo MatchRow props-only. Fixtures passam de auto-gerados para hardcoded com `date` e `venue` reais.

**Tech Stack:** Vitest + React Testing Library, Zustand, distribuição de Poisson (Knuth), `Intl.DateTimeFormat` nativo para timezone automático.

---

## Mapa de Arquivos

| Arquivo | Operação |
|---|---|
| `src/data/wc2026.ts` | Modificar — `rank` em Team, `date`+`venue` em Match, FIXTURES hardcoded |
| `src/engine/simulator.ts` | Criar |
| `src/engine/simulator.test.ts` | Criar |
| `src/store/tournament.slice.ts` | Modificar — `clearScore` + `simulateMissing` |
| `src/store/tournament.slice.test.ts` | Modificar — testes dos novos actions |
| `src/components/layout/AppShell.tsx` | Modificar — botão 🎲 Simular |
| `src/components/groups/MatchRow.tsx` | Modificar — ✕ + `onClearScore` prop |
| `src/components/groups/MatchRow.test.tsx` | Modificar — fixture Match atualizado + testes do ✕ |
| `src/components/groups/MatchModal.tsx` | Modificar — "Limpar placar" + info de jogo |

---

## Task 1: Adicionar `rank` ao tipo Team e dados

**Files:**
- Modify: `src/data/wc2026.ts`

- [ ] **Step 1: Atualizar interface Team**

Em `src/data/wc2026.ts`, substituir:

```ts
export interface Team {
  code: string
  name: string
  flag: string
  group: string
}
```

Por:

```ts
export interface Team {
  code: string
  name: string
  flag: string
  group: string
  rank: number
}
```

- [ ] **Step 2: Adicionar `rank` a cada time no array TEAMS**

Substituir o array TEAMS completo por:

```ts
export const TEAMS: Team[] = [
  // Group A
  { code: 'MEX', name: 'México',          flag: '🇲🇽', group: 'A', rank: 14 },
  { code: 'RSA', name: 'África do Sul',   flag: '🇿🇦', group: 'A', rank: 68 },
  { code: 'KOR', name: 'Coreia do Sul',   flag: '🇰🇷', group: 'A', rank: 22 },
  { code: 'CZE', name: 'Tchéquia',        flag: '🇨🇿', group: 'A', rank: 36 },
  // Group B
  { code: 'CAN', name: 'Canadá',          flag: '🇨🇦', group: 'B', rank: 46 },
  { code: 'BIH', name: 'Bósnia e Herz.',  flag: '🇧🇦', group: 'B', rank: 66 },
  { code: 'QAT', name: 'Catar',           flag: '🇶🇦', group: 'B', rank: 37 },
  { code: 'SUI', name: 'Suíça',           flag: '🇨🇭', group: 'B', rank: 16 },
  // Group C
  { code: 'BRA', name: 'Brasil',          flag: '🇧🇷', group: 'C', rank: 4  },
  { code: 'MAR', name: 'Marrocos',        flag: '🇲🇦', group: 'C', rank: 13 },
  { code: 'HAI', name: 'Haiti',           flag: '🇭🇹', group: 'C', rank: 156},
  { code: 'SCO', name: 'Escócia',         flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', rank: 33 },
  // Group D
  { code: 'USA', name: 'Estados Unidos',  flag: '🇺🇸', group: 'D', rank: 11 },
  { code: 'PAR', name: 'Paraguai',        flag: '🇵🇾', group: 'D', rank: 63 },
  { code: 'AUS', name: 'Austrália',       flag: '🇦🇺', group: 'D', rank: 25 },
  { code: 'TUR', name: 'Turquia',         flag: '🇹🇷', group: 'D', rank: 30 },
  // Group E
  { code: 'GER', name: 'Alemanha',        flag: '🇩🇪', group: 'E', rank: 10 },
  { code: 'CUW', name: 'Curaçao',         flag: '🇨🇼', group: 'E', rank: 86 },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮', group: 'E', rank: 55 },
  { code: 'ECU', name: 'Equador',         flag: '🇪🇨', group: 'E', rank: 26 },
  // Group F
  { code: 'NED', name: 'Holanda',         flag: '🇳🇱', group: 'F', rank: 7  },
  { code: 'JPN', name: 'Japão',           flag: '🇯🇵', group: 'F', rank: 15 },
  { code: 'SWE', name: 'Suécia',          flag: '🇸🇪', group: 'F', rank: 28 },
  { code: 'TUN', name: 'Tunísia',         flag: '🇹🇳', group: 'F', rank: 29 },
  // Group G
  { code: 'BEL', name: 'Bélgica',         flag: '🇧🇪', group: 'G', rank: 8  },
  { code: 'EGY', name: 'Egito',           flag: '🇪🇬', group: 'G', rank: 38 },
  { code: 'IRN', name: 'Irã',             flag: '🇮🇷', group: 'G', rank: 21 },
  { code: 'NZL', name: 'Nova Zelândia',   flag: '🇳🇿', group: 'G', rank: 97 },
  // Group H
  { code: 'ESP', name: 'Espanha',         flag: '🇪🇸', group: 'H', rank: 5  },
  { code: 'CPV', name: 'Cabo Verde',      flag: '🇨🇻', group: 'H', rank: 80 },
  { code: 'KSA', name: 'Arábia Saudita',  flag: '🇸🇦', group: 'H', rank: 61 },
  { code: 'URU', name: 'Uruguai',         flag: '🇺🇾', group: 'H', rank: 12 },
  // Group I
  { code: 'FRA', name: 'França',          flag: '🇫🇷', group: 'I', rank: 2  },
  { code: 'SEN', name: 'Senegal',         flag: '🇸🇳', group: 'I', rank: 17 },
  { code: 'NOR', name: 'Noruega',         flag: '🇳🇴', group: 'I', rank: 34 },
  { code: 'IRQ', name: 'Iraque',          flag: '🇮🇶', group: 'I', rank: 73 },
  // Group J
  { code: 'ARG', name: 'Argentina',       flag: '🇦🇷', group: 'J', rank: 1  },
  { code: 'ALG', name: 'Argélia',         flag: '🇩🇿', group: 'J', rank: 42 },
  { code: 'AUT', name: 'Áustria',         flag: '🇦🇹', group: 'J', rank: 27 },
  { code: 'JOR', name: 'Jordânia',        flag: '🇯🇴', group: 'J', rank: 88 },
  // Group K
  { code: 'POR', name: 'Portugal',        flag: '🇵🇹', group: 'K', rank: 6  },
  { code: 'COD', name: 'RD Congo',        flag: '🇨🇩', group: 'K', rank: 70 },
  { code: 'UZB', name: 'Uzbequistão',     flag: '🇺🇿', group: 'K', rank: 118},
  { code: 'COL', name: 'Colômbia',        flag: '🇨🇴', group: 'K', rank: 9  },
  // Group L
  { code: 'ENG', name: 'Inglaterra',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', rank: 3  },
  { code: 'CRO', name: 'Croácia',         flag: '🇭🇷', group: 'L', rank: 18 },
  { code: 'GHA', name: 'Gana',            flag: '🇬🇭', group: 'L', rank: 58 },
  { code: 'PAN', name: 'Panamá',          flag: '🇵🇦', group: 'L', rank: 78 },
]
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros (o campo `rank` ainda não é usado em nenhum outro arquivo).

- [ ] **Step 4: Commit**

```bash
git add src/data/wc2026.ts
git commit -m "feat: adicionar ranking FIFA a cada seleção em wc2026.ts"
```

---

## Task 2: Adicionar `date` + `venue` ao Match e hardcodar FIXTURES

**Files:**
- Modify: `src/data/wc2026.ts`
- Modify: `src/components/groups/MatchRow.test.tsx` (fixture Match)

- [ ] **Step 1: Atualizar interface Match**

Em `src/data/wc2026.ts`, substituir:

```ts
export interface Match {
  id: string
  group: string
  homeTeam: string
  awayTeam: string
  stage: 'group'
}
```

Por:

```ts
export interface Match {
  id: string
  group: string
  homeTeam: string
  awayTeam: string
  stage: 'group'
  date: string   // ISO 8601 UTC — ex: "2026-06-11T23:00:00Z"
  venue: string  // ex: "AT&T Stadium, Dallas"
}
```

- [ ] **Step 2: Substituir FIXTURES por array hardcoded**

Remover o `export const FIXTURES: Match[] = GROUPS.flatMap(...)` atual e substituir por um array explícito com todos os 72 jogos. Os IDs devem ser mantidos iguais (`A1`–`A6`, `B1`–`B6`, …, `L1`–`L6`) para compatibilidade com o ScoreMap persistido no LocalStorage.

**Regra de ID (preservada do sistema atual):**
- `<Grupo><N>` onde N vai de 1 a 6 conforme:
  - 1: T1 vs T2 (MD1)
  - 2: T3 vs T4 (MD1)
  - 3: T1 vs T3 (MD2)
  - 4: T2 vs T4 (MD2)
  - 5: T1 vs T4 (MD3)
  - 6: T2 vs T3 (MD3)

**Fonte de dados:** os horários e sedes exatos para todos os 72 jogos devem ser obtidos no calendário oficial em `https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicoousa2026/schedule`. Todos os horários devem ser armazenados em UTC.

**Exemplo completo do Grupo A** (use como modelo para os demais grupos):

```ts
export const FIXTURES: Match[] = [
  // ── Grupo A ──────────────────────────────────────────────────────────────
  { id: 'A1', group: 'A', homeTeam: 'MEX', awayTeam: 'RSA', stage: 'group',
    date: '2026-06-11T23:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'A2', group: 'A', homeTeam: 'KOR', awayTeam: 'CZE', stage: 'group',
    date: '2026-06-12T02:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'A3', group: 'A', homeTeam: 'MEX', awayTeam: 'KOR', stage: 'group',
    date: '2026-06-16T23:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'A4', group: 'A', homeTeam: 'RSA', awayTeam: 'CZE', stage: 'group',
    date: '2026-06-17T02:00:00Z', venue: 'Levi\'s Stadium, San Jose' },
  { id: 'A5', group: 'A', homeTeam: 'MEX', awayTeam: 'CZE', stage: 'group',
    date: '2026-06-21T02:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'A6', group: 'A', homeTeam: 'RSA', awayTeam: 'KOR', stage: 'group',
    date: '2026-06-21T02:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },

  // ── Grupo B ──────────────────────────────────────────────────────────────
  // Preencher com dados do calendário oficial FIFA 2026
  // Seguir o mesmo padrão: IDs B1–B6, times conforme GROUPS[1] = [CAN, BIH, QAT, SUI]

  // ── Grupo C ──────────────────────────────────────────────────────────────
  // IDs C1–C6, times: [BRA, MAR, HAI, SCO]

  // ── Grupo D ──────────────────────────────────────────────────────────────
  // IDs D1–D6, times: [USA, PAR, AUS, TUR]

  // ── Grupo E ──────────────────────────────────────────────────────────────
  // IDs E1–E6, times: [GER, CUW, CIV, ECU]

  // ── Grupo F ──────────────────────────────────────────────────────────────
  // IDs F1–F6, times: [NED, JPN, SWE, TUN]

  // ── Grupo G ──────────────────────────────────────────────────────────────
  // IDs G1–G6, times: [BEL, EGY, IRN, NZL]

  // ── Grupo H ──────────────────────────────────────────────────────────────
  // IDs H1–H6, times: [ESP, CPV, KSA, URU]

  // ── Grupo I ──────────────────────────────────────────────────────────────
  // IDs I1–I6, times: [FRA, SEN, NOR, IRQ]

  // ── Grupo J ──────────────────────────────────────────────────────────────
  // IDs J1–J6, times: [ARG, ALG, AUT, JOR]

  // ── Grupo K ──────────────────────────────────────────────────────────────
  // IDs K1–K6, times: [POR, COD, UZB, COL]

  // ── Grupo L ──────────────────────────────────────────────────────────────
  // IDs L1–L6, times: [ENG, CRO, GHA, PAN]
]
```

- [ ] **Step 3: Atualizar fixture Match no MatchRow.test.tsx**

Em `src/components/groups/MatchRow.test.tsx`, adicionar `date` e `venue` ao objeto `match`:

```ts
const match: Match = {
  id: 'A1',
  group: 'A',
  homeTeam: 'MEX',
  awayTeam: 'RSA',
  stage: 'group',
  date: '2026-06-11T23:00:00Z',
  venue: 'AT&T Stadium, Dallas',
}
```

- [ ] **Step 4: Verificar build TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Rodar testes existentes**

```bash
npm test -- --run
```

Esperado: todos os testes passando (os testes de MatchRow não dependem de `date`/`venue`).

- [ ] **Step 6: Commit**

```bash
git add src/data/wc2026.ts src/components/groups/MatchRow.test.tsx
git commit -m "feat: adicionar date e venue às partidas, FIXTURES hardcoded com calendário FIFA 2026"
```

---

## Task 3: Engine — `simulator.ts` (TDD)

**Files:**
- Create: `src/engine/simulator.ts`
- Create: `src/engine/simulator.test.ts`

- [ ] **Step 1: Criar o arquivo de testes**

Criar `src/engine/simulator.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { poissonRandom, simulateMatch, simulateMissingMatches } from './simulator'
import type { ScoreMap } from './types'
import { FIXTURES, TEAMS } from '@/data/wc2026'

describe('poissonRandom', () => {
  it('retorna 0 quando Math.random retorna valor alto (loop termina imediatamente)', () => {
    // Algoritmo de Knuth: enquanto p > L (L = e^-lambda), incrementa k.
    // Com lambda=1, L=e^-1≈0.368. Se Math.random() retorna 0.9 (p=0.9 > L),
    // então p *= 0.9 → 0.81 > L, → 0.729 > L, ... até cruzar L. Com valores
    // altos consecutivos, k fica baixo. Para lambda muito pequeno (0.001),
    // L≈0.999 e qualquer random < 1 termina em k=0.
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = poissonRandom(0.001)
    expect(result).toBe(0)
    vi.restoreAllMocks()
  })

  it('retorna inteiro não-negativo para lambda típico', () => {
    const results = Array.from({ length: 100 }, () => poissonRandom(1.35))
    expect(results.every((r) => Number.isInteger(r) && r >= 0)).toBe(true)
  })

  it('média amostral aproxima lambda para N grande', () => {
    const N = 5000
    const lambda = 1.5
    const sum = Array.from({ length: N }, () => poissonRandom(lambda)).reduce((a, b) => a + b, 0)
    const mean = sum / N
    // Tolerar ±0.15 (3 desvios padrão / sqrt(N) ≈ 0.017, mas queremos margem para testes rápidos)
    expect(mean).toBeGreaterThan(lambda - 0.15)
    expect(mean).toBeLessThan(lambda + 0.15)
  })
})

describe('simulateMatch', () => {
  it('retorna objeto com home e away inteiros não-negativos', () => {
    const result = simulateMatch(10, 50)
    expect(Number.isInteger(result.home)).toBe(true)
    expect(Number.isInteger(result.away)).toBe(true)
    expect(result.home).toBeGreaterThanOrEqual(0)
    expect(result.away).toBeGreaterThanOrEqual(0)
  })

  it('favorito (rank baixo) vence azarão (rank alto) mais de 50% das vezes', () => {
    let favoriteWins = 0
    const N = 2000
    for (let i = 0; i < N; i++) {
      const { home, away } = simulateMatch(5, 150) // rank 5 (forte) vs rank 150 (fraco)
      if (home > away) favoriteWins++
    }
    const winRate = favoriteWins / N
    expect(winRate).toBeGreaterThan(0.50)
  })

  it('times de ranking igual têm win rate próximo de 50% (entre 35% e 65%)', () => {
    let homeWins = 0
    const N = 2000
    for (let i = 0; i < N; i++) {
      const { home, away } = simulateMatch(20, 20)
      if (home > away) homeWins++
    }
    const winRate = homeWins / N
    expect(winRate).toBeGreaterThan(0.35) // home advantage existe
    expect(winRate).toBeLessThan(0.65)
  })
})

describe('simulateMissingMatches', () => {
  it('preenche os jogos em branco e preserva os já preenchidos', () => {
    const existingScores: ScoreMap = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
    }
    const result = simulateMissingMatches(FIXTURES, existingScores, TEAMS)

    // Scores originais preservados
    expect(result.A1).toEqual({ home: 2, away: 0 })
    expect(result.A2).toEqual({ home: 1, away: 1 })

    // Todos os 72 fixtures agora têm score
    expect(Object.keys(result)).toHaveLength(72)
  })

  it('com ScoreMap vazio, preenche todos os 72 jogos', () => {
    const result = simulateMissingMatches(FIXTURES, {}, TEAMS)
    expect(Object.keys(result)).toHaveLength(72)
  })

  it('com ScoreMap completo, não altera nada', () => {
    const full: ScoreMap = {}
    FIXTURES.forEach((f) => { full[f.id] = { home: 1, away: 0 } })
    const result = simulateMissingMatches(FIXTURES, full, TEAMS)
    FIXTURES.forEach((f) => {
      expect(result[f.id]).toEqual({ home: 1, away: 0 })
    })
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npm test -- --run src/engine/simulator.test.ts
```

Esperado: FAIL — `Cannot find module './simulator'`

- [ ] **Step 3: Criar `src/engine/simulator.ts`**

```ts
import type { Match, Team } from '@/data/wc2026'
import type { ScoreMap } from './types'

const LAMBDA_BASE = 1.35
const HOME_ADVANTAGE = 1.1

// Algoritmo de Knuth para distribuição de Poisson
export function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

export function simulateMatch(homeRank: number, awayRank: number): { home: number; away: number } {
  const lambdaHome = LAMBDA_BASE * Math.pow(awayRank / homeRank, 0.4) * HOME_ADVANTAGE
  const lambdaAway = LAMBDA_BASE * Math.pow(homeRank / awayRank, 0.4)
  return {
    home: poissonRandom(lambdaHome),
    away: poissonRandom(lambdaAway),
  }
}

export function simulateMissingMatches(
  fixtures: Match[],
  scores: ScoreMap,
  teams: Team[],
): ScoreMap {
  const result: ScoreMap = { ...scores }
  for (const fixture of fixtures) {
    if (result[fixture.id] !== undefined) continue
    const homeTeam = teams.find((t) => t.code === fixture.homeTeam)!
    const awayTeam = teams.find((t) => t.code === fixture.awayTeam)!
    result[fixture.id] = simulateMatch(homeTeam.rank, awayTeam.rank)
  }
  return result
}
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
npm test -- --run src/engine/simulator.test.ts
```

Esperado: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulator.ts src/engine/simulator.test.ts
git commit -m "feat: engine simulateMissingMatches com distribuição de Poisson ponderada por ranking FIFA"
```

---

## Task 4: Store — `clearScore` + `simulateMissing` (TDD)

**Files:**
- Modify: `src/store/tournament.slice.ts`
- Modify: `src/store/tournament.slice.test.ts`

- [ ] **Step 1: Escrever testes para os novos actions**

Adicionar ao final de `src/store/tournament.slice.test.ts`:

```ts
import { FIXTURES, TEAMS } from '@/data/wc2026'

describe('TournamentSlice — clearScore', () => {
  it('remove o score de um jogo específico, mantendo os demais', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 1)
    store.getState().setScore('A2', 0, 0)
    store.getState().clearScore('A1')
    expect(store.getState().scores['A1']).toBeUndefined()
    expect(store.getState().scores['A2']).toEqual({ home: 0, away: 0 })
  })

  it('não lança erro ao tentar limpar jogo que já está em branco', () => {
    const store = makeStore()
    expect(() => store.getState().clearScore('A1')).not.toThrow()
    expect(store.getState().scores['A1']).toBeUndefined()
  })
})

describe('TournamentSlice — simulateMissing', () => {
  it('preenche todos os jogos em branco sem sobrescrever os existentes', () => {
    const store = makeStore()
    store.getState().setScore('A1', 3, 0)
    store.getState().simulateMissing()
    const scores = store.getState().scores
    expect(scores['A1']).toEqual({ home: 3, away: 0 }) // preservado
    expect(Object.keys(scores)).toHaveLength(72)        // todos preenchidos
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npm test -- --run src/store/tournament.slice.test.ts
```

Esperado: FAIL — `clearScore is not a function`, `simulateMissing is not a function`

- [ ] **Step 3: Atualizar `src/store/tournament.slice.ts`**

```ts
import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'
import { simulateMissingMatches } from '@/engine/simulator'
import { FIXTURES, TEAMS } from '@/data/wc2026'

export interface TournamentSlice {
  scores: ScoreMap
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
  clearScore: (matchId: string) => void
  simulateMissing: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  setScores: (scores) => set({ scores }),
  resetScores: () => set({ scores: {} }),
  clearScore: (matchId) =>
    set((state) => {
      const { [matchId]: _removed, ...rest } = state.scores
      return { scores: rest }
    }),
  simulateMissing: () =>
    set((state) => ({
      scores: simulateMissingMatches(FIXTURES, state.scores, TEAMS),
    })),
})
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
npm test -- --run src/store/tournament.slice.test.ts
```

Esperado: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/store/tournament.slice.ts src/store/tournament.slice.test.ts
git commit -m "feat: store — clearScore e simulateMissing"
```

---

## Task 5: MatchRow — botão ✕ e prop `onClearScore`

**Files:**
- Modify: `src/components/groups/MatchRow.tsx`
- Modify: `src/components/groups/MatchRow.test.tsx`

- [ ] **Step 1: Escrever testes para o botão ✕**

Adicionar ao final de `src/components/groups/MatchRow.test.tsx`:

```ts
describe('MatchRow compact — botão ✕ de limpar score', () => {
  it('não exibe ✕ quando homeScore é undefined', () => {
    render(
      <MatchRow
        match={match}
        homeScore={undefined}
        awayScore={undefined}
        onScoreChange={vi.fn()}
        compact
        onClearScore={vi.fn()}
      />
    )
    expect(screen.queryByTestId('clear-score-A1')).not.toBeInTheDocument()
  })

  it('exibe ✕ quando score está definido e onClearScore é fornecido', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
        onClearScore={vi.fn()}
      />
    )
    expect(screen.getByTestId('clear-score-A1')).toBeInTheDocument()
  })

  it('chama onClearScore com o matchId ao clicar no ✕', () => {
    const onClearScore = vi.fn()
    render(
      <MatchRow
        match={match}
        homeScore={1}
        awayScore={0}
        onScoreChange={vi.fn()}
        compact
        onClearScore={onClearScore}
      />
    )
    fireEvent.click(screen.getByTestId('clear-score-A1'))
    expect(onClearScore).toHaveBeenCalledWith('A1')
  })

  it('não exibe ✕ quando onClearScore não é fornecido', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.queryByTestId('clear-score-A1')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
npm test -- --run src/components/groups/MatchRow.test.tsx
```

Esperado: FAIL — `Unable to find an element by: [data-testid="clear-score-A1"]`

- [ ] **Step 3: Atualizar `src/components/groups/MatchRow.tsx`**

Adicionar `onClearScore` à interface e ao compact mode:

```tsx
import type { Match } from '@/data/wc2026'
import { TEAMS } from '@/data/wc2026'
import { cn } from '@/lib/utils'

interface MatchRowProps {
  match: Match
  homeScore: number | undefined
  awayScore: number | undefined
  onScoreChange: (matchId: string, home: number, away: number) => void
  onClearScore?: (matchId: string) => void
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

export function MatchRow({ match, homeScore, awayScore, onScoreChange, onClearScore, compact, onClick }: MatchRowProps) {
  const home = homeScore ?? 0
  const away = awayScore ?? 0
  const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
  const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

  if (compact) {
    const hasSco = homeScore !== undefined
    const scoreLabel = hasSco ? `${home} × ${away}` : '– × –'
    const indicator = hasSco ? '✓' : '›'
    const showClear = hasSco && onClearScore !== undefined

    return (
      <div className="relative w-full">
        <button
          onClick={onClick}
          data-testid={`compact-${match.id}`}
          className="w-full flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-2 gap-2 hover:bg-wcp-primary-faint transition-colors"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg leading-none">{homeTeam?.flag}</span>
            <span className="text-xs font-semibold text-wcp-text">{match.homeTeam}</span>
          </div>
          <span className="text-sm font-bold text-wcp-text tabular-nums">{scoreLabel}</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-xs font-semibold text-wcp-text">{match.awayTeam}</span>
            <span className="text-lg leading-none">{awayTeam?.flag}</span>
          </div>
          <span className={cn('text-xs font-bold ml-2', hasSco ? 'text-wcp-primary' : 'text-wcp-muted')}>
            {indicator}
          </span>
        </button>
        {showClear && (
          <button
            data-testid={`clear-score-${match.id}`}
            onClick={(e) => {
              e.stopPropagation()
              onClearScore!(match.id)
            }}
            aria-label="Limpar placar"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-wcp-muted hover:text-wcp-text hover:bg-wcp-surface-subtle transition-colors text-[10px] font-bold"
          >
            ✕
          </button>
        )}
      </div>
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

- [ ] **Step 4: Rodar testes**

```bash
npm test -- --run src/components/groups/MatchRow.test.tsx
```

Esperado: todos passando.

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/MatchRow.tsx src/components/groups/MatchRow.test.tsx
git commit -m "feat: MatchRow — botão ✕ para limpar placar individual (prop onClearScore)"
```

---

## Task 6: MatchModal — "Limpar placar" + info de jogo

**Files:**
- Modify: `src/components/groups/MatchModal.tsx`

- [ ] **Step 1: Atualizar MatchModal com Limpar placar + info de jogo**

Substituir o conteúdo de `src/components/groups/MatchModal.tsx` por:

```tsx
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { MatchRow } from './MatchRow'

interface MatchModalProps {
  groupId: string
  onClose: () => void
}

function formatMatchDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MatchModal({ groupId, onClose }: MatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)
  const clearScore = useStore((s) => s.clearScore)

  const fixtures = useMemo(
    () => FIXTURES.filter((f) => f.group === groupId),
    [groupId]
  )

  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length

  const firstUnfilledIdx = fixtures.findIndex((f) => scores[f.id] === undefined)
  const [expandedIndex, setExpandedIndex] = useState(firstUnfilledIdx)

  const toggleExpand = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? -1 : idx))
  }

  const handleClear = (matchId: string) => {
    clearScore(matchId)
    setExpandedIndex(-1)
  }

  const progressPct = Math.round((filledCount / fixtures.length) * 100)

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <div>
            <h2 className="font-bold text-wcp-text text-base">Grupo {groupId}</h2>
            <span className="text-xs text-wcp-muted tabular-nums" data-testid="modal-progress">
              {filledCount}/{fixtures.length}
            </span>
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
          {fixtures.map((match, idx) => {
            const isExpanded = idx === expandedIndex
            const hasScore = scores[match.id] !== undefined
            const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
            const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

            if (isExpanded) {
              return (
                <div key={match.id} className="flex flex-col rounded-xl overflow-hidden border border-wcp-primary">
                  {/* Collapse header */}
                  <button
                    data-testid={`collapse-header-${match.id}`}
                    onClick={() => toggleExpand(idx)}
                    className="flex items-center justify-between bg-wcp-primary-faint px-4 py-2 text-xs font-semibold text-wcp-text hover:bg-wcp-surface-subtle transition-colors"
                  >
                    <span>{homeTeam?.flag} {match.homeTeam}</span>
                    <span className="text-wcp-primary">▲</span>
                    <span>{match.awayTeam} {awayTeam?.flag}</span>
                  </button>

                  {/* Info de jogo */}
                  <div className="px-4 py-1.5 bg-wcp-surface-subtle border-b border-wcp-border flex items-center gap-3 text-[10px] text-wcp-muted">
                    <span>📅 {formatMatchDate(match.date)}</span>
                    <span className="text-wcp-border">|</span>
                    <span>🏟 {match.venue}</span>
                  </div>

                  <MatchRow
                    match={match}
                    homeScore={scores[match.id]?.home}
                    awayScore={scores[match.id]?.away}
                    onScoreChange={setScore}
                  />

                  {/* Limpar placar */}
                  {hasScore && (
                    <button
                      onClick={() => handleClear(match.id)}
                      className="text-[10px] text-wcp-muted hover:text-wcp-text py-2 transition-colors"
                    >
                      Limpar placar
                    </button>
                  )}
                </div>
              )
            }

            return (
              <MatchRow
                key={match.id}
                match={match}
                homeScore={scores[match.id]?.home}
                awayScore={scores[match.id]?.away}
                onScoreChange={setScore}
                onClearScore={clearScore}
                compact
                onClick={() => toggleExpand(idx)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

- [ ] **Step 2: Rodar todos os testes**

```bash
npm test -- --run
```

Esperado: todos os testes passando.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/MatchModal.tsx
git commit -m "feat: MatchModal — Limpar placar e info de jogo (data, horário local, sede)"
```

---

## Task 7: AppShell — botão 🎲 Simular

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Adicionar botão Simular ao header**

Substituir o conteúdo de `src/components/layout/AppShell.tsx` por:

```tsx
import { GroupGrid } from '@/components/groups/GroupGrid'
import { useShareLink } from '@/hooks/useShareLink'
import { useStore } from '@/store'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 shrink-0">
        <div className="w-9 h-9 rounded-full bg-wcp-surface-subtle border-2 border-wcp-primary flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="7" y="14" width="6" height="2" rx="0.5" fill="#00a854" />
            <rect x="5.5" y="16" width="9" height="1.5" rx="0.5" fill="#00a854" />
            <path
              d="M6 3 H14 V10 Q14 14 10 14 Q6 14 6 10 Z"
              fill="#00a854"
              fillOpacity="0.2"
              stroke="#00a854"
              strokeWidth="1.2"
            />
            <path d="M6 5 Q3 5 3 8 Q3 11 6 11" stroke="#00a854" strokeWidth="1.2" fill="none" />
            <path d="M14 5 Q17 5 17 8 Q17 11 14 11" stroke="#00a854" strokeWidth="1.2" fill="none" />
            <circle cx="10" cy="7.5" r="1.5" fill="#00a854" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 bg-wcp-primary text-white text-[6px] font-black w-[13px] h-[13px] rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
          26
        </div>
      </div>

      <div>
        <div className="font-bold text-sm text-wcp-text leading-tight">World Cup Predictor</div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1 h-1 rounded-full bg-wcp-primary" />
          <span className="text-[8px] tracking-wide text-wcp-muted">FIFA 2026</span>
          <div className="w-1 h-1 rounded-full bg-wcp-primary opacity-40" />
          <span className="text-[8px] tracking-wide text-wcp-muted">48 seleções</span>
        </div>
      </div>
    </div>
  )
}

function SimulateButton() {
  const simulateMissing = useStore((s) => s.simulateMissing)
  return (
    <button
      onClick={simulateMissing}
      data-testid="simulate-button"
      className="border border-wcp-primary text-wcp-primary text-xs font-semibold rounded-full px-4 py-1.5 transition-opacity hover:opacity-75 active:opacity-50"
    >
      🎲 Simular
    </button>
  )
}

function ShareButton() {
  const { share, copied } = useShareLink()
  return (
    <button
      onClick={share}
      data-testid="share-button"
      className="bg-wcp-primary text-white text-xs font-semibold rounded-full px-4 py-1.5 transition-opacity hover:opacity-90 active:opacity-75"
    >
      {copied ? 'Link copiado!' : '↗ Compartilhar'}
    </button>
  )
}

export function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-wcp-bg text-wcp-text">
      <header className="flex items-center justify-between px-4 py-3 bg-wcp-surface border-b border-wcp-border sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-2">
          <SimulateButton />
          <ShareButton />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <GroupGrid />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Rodar todos os testes**

```bash
npm test -- --run
```

Esperado: todos os testes passando.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Esperado: build limpo sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: header — botão 🎲 Simular para preencher jogos em branco automaticamente"
```

---

## Task 8: Verificação final e abertura de PR

- [ ] **Step 1: Rodar suite completa**

```bash
npm test -- --run
```

Esperado: todos os testes passando (mínimo 80 testes).

- [ ] **Step 2: Build limpo**

```bash
npm run build
```

Esperado: sem erros de TypeScript nem de bundle.

- [ ] **Step 3: Abrir PR**

```bash
gh pr create \
  --title "feat: Fase 9 — simulador automático, reset por partida, info de jogo" \
  --body "$(cat <<'EOF'
## Summary
- Botão 🎲 Simular no header preenche jogos em branco com Poisson ponderada por ranking FIFA
- ✕ no compact row e "Limpar placar" no accordion permitem reset individual de placar
- Data, horário (timezone automático do browser) e sede exibidos no accordion expandido de cada jogo
- Rankings FIFA adicionados às 48 seleções em wc2026.ts
- Fixtures hardcoded com date e venue reais do calendário FIFA 2026

## Test Plan
- [ ] Clicar 🎲 Simular com alguns grupos já preenchidos — verificar que só os em branco são preenchidos
- [ ] Clicar ✕ num jogo preenchido no compact row — placar some, jogo volta para "em branco"
- [ ] Abrir accordion de um jogo — verificar data/hora no timezone local e nome da sede
- [ ] Clicar "Limpar placar" no accordion — jogo volta a "em branco", accordion fecha
- [ ] Testar em Portugal (UTC+1) e verificar horário correto
EOF
)"
```

- [ ] **Step 4: Solicitar code review**

```bash
gh pr comment <número-do-pr> --body "@claude please review this PR"
```
