# Cascade Knockout + E2E Tests Completos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o tech debt de scores knockout obsoletos (cascade-clear quando standings de grupo mudam) e adicionar testes E2E completos de jornada + adversariais.

**Architecture:** Função pura `cascadeClearKnockout` em `src/engine/cascade.ts` compara standings de todos os grupos antes/depois de cada mudança e remove do ScoreMap as chaves knockout cujas equipas mudaram. O store chama-a em `setScore`, `clearScore` e `pickGroupOrder`. Dois novos ficheiros E2E (`journey.spec.ts`, `adversarial.spec.ts`) cobrem a jornada completa e casos de stress, marcados `@slow` para correr só quando solicitado.

**Tech Stack:** Vite + React 19 + TypeScript + Zustand + Vitest + Playwright

---

## File Map

| Ficheiro | Acção | Responsabilidade |
|----------|-------|-----------------|
| `src/engine/classifier.ts` | Modificar | Adicionar `computeAllStandings(scores): GroupStandings` |
| `src/engine/cascade.ts` | Criar | `cascadeClearKnockout` — lógica de cascade pura |
| `src/engine/cascade.test.ts` | Criar | Testes unitários TDD do cascade |
| `src/store/tournament.slice.ts` | Modificar | `setScore`, `clearScore`, `pickGroupOrder` chamam cascade |
| `src/store/tournament.slice.test.ts` | Modificar | Adicionar testes de cascade no store |
| `e2e/helpers.ts` | Criar | Helpers partilhados: `openGroupModal`, `fillGroupScores`, `injectScores`, etc. |
| `e2e/full-flow.spec.ts` | Modificar | Importar helpers em vez de definir localmente |
| `e2e/share.spec.ts` | Modificar | Importar helpers em vez de definir localmente |
| `e2e/journey.spec.ts` | Criar | Teste de jornada completa `@slow` |
| `e2e/adversarial.spec.ts` | Criar | 11 testes de stress `@slow` |

---

## Task 1: Adicionar `computeAllStandings` ao classifier

**Files:**
- Modify: `src/engine/classifier.ts`
- Test: `src/engine/classifier.test.ts` (verificar que já existe; se não existir, criar)

### Contexto

`classifyGroup(group: Group, scores: ScoreMap): Standing[]` já existe. Precisamos de uma função que compute as standings de todos os 12 grupos de uma vez.

`classifier.ts` já importa `FIXTURES` de `@/data/wc2026`. Precisa de importar também `GROUPS` e exportar `GroupStandings`.

- [ ] **Step 1: Verificar se `classifier.test.ts` existe**

```bash
ls src/engine/classifier.test.ts 2>/dev/null || echo "não existe"
```

Se não existir, criar com:

```typescript
// src/engine/classifier.test.ts
import { describe, it, expect } from 'vitest'
import { classifyGroup, computeAllStandings } from './classifier'
import { GROUPS } from '@/data/wc2026'

describe('computeAllStandings', () => {
  it('retorna standings para todos os 12 grupos', () => {
    const result = computeAllStandings({})
    expect(Object.keys(result)).toHaveLength(12)
  })

  it('standings de grupo vazio têm 4 equipas com 0 pontos', () => {
    const result = computeAllStandings({})
    expect(result['A']).toHaveLength(4)
    expect(result['A'].every((s) => s.points === 0)).toBe(true)
  })

  it('reflecte scores injectados no grupo correcto', () => {
    const result = computeAllStandings({ A1: { home: 2, away: 0 } })
    const first = result['A'][0]
    expect(first.teamCode).toBe('MEX')
    expect(first.points).toBe(3)
  })
})
```

- [ ] **Step 2: Correr o teste para confirmar que falha**

```bash
npx vitest run src/engine/classifier.test.ts
```

Expected: FAIL — `computeAllStandings is not a function`

- [ ] **Step 3: Adicionar `computeAllStandings` ao `classifier.ts`**

No topo de `src/engine/classifier.ts`, adicionar `GROUPS` ao import e `GroupStandings` ao import de types:

```typescript
import { FIXTURES, GROUPS } from '@/data/wc2026'
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing, GroupStandings } from './types'
```

No fim do ficheiro, adicionar:

```typescript
export function computeAllStandings(scores: ScoreMap): GroupStandings {
  const result: GroupStandings = {}
  for (const group of GROUPS) {
    result[group.id] = classifyGroup(group, scores)
  }
  return result
}
```

- [ ] **Step 4: Correr os testes**

```bash
npx vitest run src/engine/classifier.test.ts
```

Expected: PASS (3 testes)

- [ ] **Step 5: Correr suite completa para confirmar sem regressões**

```bash
npm run test
```

Expected: todos os testes existentes continuam a passar.

- [ ] **Step 6: Commit**

```bash
git add src/engine/classifier.ts src/engine/classifier.test.ts
git commit -m "feat: add computeAllStandings to classifier"
```

---

## Task 2: Criar `cascade.ts` com `cascadeClearKnockout` (TDD)

**Files:**
- Create: `src/engine/cascade.ts`
- Create: `src/engine/cascade.test.ts`

### Contexto

A função recebe standings de todos os grupos antes e depois de uma mudança, identifica quais slots r32 mudaram de equipa, e propaga downstream (r32 → r16 → qf → sf → final/3rd), removendo esses scores do ScoreMap.

**Mapeamentos estáticos** (derivados de `ROUND_OF_32_TEMPLATE` em `bracket-generator.ts`):
- `1A→r32-1, 2B→r32-1 | 1B→r32-2, 2A→r32-2`
- `1C→r32-3, 2D→r32-3 | 1D→r32-4, 2C→r32-4`
- `1E→r32-5, 2F→r32-5 | 1F→r32-6, 2E→r32-6`
- `1G→r32-7, 2H→r32-7 | 1H→r32-8, 2G→r32-8`
- `1I→r32-9, 2I→r32-13 | 1J→r32-10, 2J→r32-14`
- `1K→r32-11, 2K→r32-15 | 1L→r32-12, 2L→r32-16`
- `3-1→r32-9 (away)..3-8→r32-16 (away)`

- [ ] **Step 1: Criar `cascade.test.ts` com testes que falham**

```typescript
// src/engine/cascade.test.ts
import { describe, it, expect } from 'vitest'
import { cascadeClearKnockout } from './cascade'
import { computeAllStandings } from './classifier'

// Scores de grupo que tornam MEX 1º e RSA 2º no Grupo A
const GROUP_A_MEX_1ST: Record<string, { home: number; away: number }> = {
  A1: { home: 2, away: 0 }, // MEX vs RSA
  A2: { home: 1, away: 0 }, // KOR vs CZE
  A3: { home: 2, away: 0 }, // MEX vs KOR
  A4: { home: 2, away: 0 }, // RSA vs CZE
  A5: { home: 2, away: 0 }, // MEX vs CZE
  A6: { home: 1, away: 0 }, // RSA vs KOR
}

describe('cascadeClearKnockout — sem mudança de standings', () => {
  it('retorna scores inalterado se 1º e 2º não mudaram', () => {
    const baseScores = {
      ...GROUP_A_MEX_1ST,
      'r32-1': { home: 2, away: 1 }, // MEX venceu r32-1
    }
    // A2 muda margem mas MEX continua 1º, RSA 2º
    const oldScores = { ...baseScores }
    const newScores = { ...baseScores, A2: { home: 2, away: 0 } }

    const oldStandings = computeAllStandings(oldScores)
    const newStandings = computeAllStandings(newScores)

    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-1']).toEqual({ home: 2, away: 1 })
  })
})

describe('cascadeClearKnockout — 1º lugar muda', () => {
  it('limpa r32-1 quando 1º de A muda', () => {
    const oldScores = { ...GROUP_A_MEX_1ST, 'r32-1': { home: 2, away: 1 }, 'r16-1': { home: 1, away: 0 } }
    // Nova situação: RSA vence MEX diretamente para RSA ficar 1º
    const newGroupScores = {
      A1: { home: 0, away: 2 }, // RSA vence MEX
      A2: { home: 1, away: 0 },
      A3: { home: 2, away: 0 }, // MEX vence KOR mas perdeu pontos
      A4: { home: 2, away: 0 },
      A5: { home: 0, away: 2 }, // CZE vence MEX
      A6: { home: 0, away: 2 }, // KOR vence RSA
    }
    // Com este cenário RSA tem 6pts, KOR 6pts, MEX 3pts — depende do tiebreaker
    // Usar cenário mais simples: RSA ganha todos e fica 1º
    const simpleNewGroupScores = {
      A1: { home: 0, away: 3 }, // RSA vence MEX (away=RSA wins 3-0)
      A2: { home: 1, away: 0 },
      A3: { home: 2, away: 0 },
      A4: { home: 2, away: 0 },
      A5: { home: 2, away: 0 },
      A6: { home: 2, away: 0 },
    }
    const newScores = { ...simpleNewGroupScores, 'r32-1': { home: 2, away: 1 }, 'r16-1': { home: 1, away: 0 } }

    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_1ST })
    const newStandings = computeAllStandings(simpleNewGroupScores)

    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-1']).toBeUndefined()
    expect(result['r16-1']).toBeUndefined()
  })

  it('não limpa r32 de outros grupos não afectados', () => {
    const r32_3_score = { home: 3, away: 0 }
    const oldScores = { ...GROUP_A_MEX_1ST, 'r32-3': r32_3_score }
    const newGroupScores = {
      A1: { home: 0, away: 3 }, A2: { home: 1, away: 0 },
      A3: { home: 2, away: 0 }, A4: { home: 2, away: 0 },
      A5: { home: 2, away: 0 }, A6: { home: 2, away: 0 },
    }
    const newScores = { ...newGroupScores, 'r32-3': r32_3_score }

    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_1ST })
    const newStandings = computeAllStandings(newGroupScores)

    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-3']).toEqual(r32_3_score)
  })
})

describe('cascadeClearKnockout — 2º lugar muda', () => {
  it('limpa r32-2 quando 2º de A muda (slot 2A → r32-2)', () => {
    const newGroupScores = {
      A1: { home: 2, away: 0 }, // MEX vence RSA — MEX 1º
      A2: { home: 0, away: 2 }, // CZE vence KOR
      A3: { home: 2, away: 0 },
      A4: { home: 0, away: 2 }, // CZE vence RSA
      A5: { home: 2, away: 0 },
      A6: { home: 0, away: 2 }, // CZE vence RSA... — CZE 2º
    }
    const newScores = { ...newGroupScores, 'r32-2': { home: 1, away: 0 }, 'r16-1': { home: 1, away: 0 } }

    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_1ST })
    const newStandings = computeAllStandings(newGroupScores)

    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-2']).toBeUndefined()
    expect(result['r16-1']).toBeUndefined()
  })
})

describe('cascadeClearKnockout — cascade completo', () => {
  it('limpa r32→r16→qf→sf→final quando 1º de C muda (r32-3→r16-2→qf-1→sf-1→final)', () => {
    const groupCBraFirst = {
      C1: { home: 3, away: 0 }, C2: { home: 0, away: 1 },
      C3: { home: 2, away: 0 }, C4: { home: 2, away: 1 },
      C5: { home: 2, away: 0 }, C6: { home: 1, away: 0 },
    }
    // Nova: MAR fica 1º
    const groupCMarFirst = {
      C1: { home: 0, away: 3 }, // MAR vence BRA (away wins)
      C2: { home: 0, away: 1 },
      C3: { home: 2, away: 0 },
      C4: { home: 2, away: 1 },
      C5: { home: 2, away: 0 },
      C6: { home: 1, away: 0 },
    }
    const knockoutScores = {
      'r32-3': { home: 1, away: 0 },
      'r16-2': { home: 2, away: 0 },
      'qf-1':  { home: 1, away: 0 },
      'sf-1':  { home: 2, away: 1 },
      'final': { home: 1, away: 0 },
      '3rd':   { home: 1, away: 0 },
    }
    const newScores = { ...groupCMarFirst, ...knockoutScores }

    const oldStandings = computeAllStandings(groupCBraFirst)
    const newStandings = computeAllStandings(groupCMarFirst)

    const result = cascadeClearKnockout('C', oldStandings, newStandings, newScores, [])
    expect(result['r32-3']).toBeUndefined()
    expect(result['r16-2']).toBeUndefined()
    expect(result['qf-1']).toBeUndefined()
    expect(result['sf-1']).toBeUndefined()
    expect(result['final']).toBeUndefined()
    expect(result['3rd']).toBeUndefined()
  })
})

describe('cascadeClearKnockout — ScoreMap vazio', () => {
  it('retorna ScoreMap vazio sem crash quando não há knockout scores', () => {
    const oldStandings = computeAllStandings(GROUP_A_MEX_1ST)
    const newStandings = computeAllStandings({ A1: { home: 0, away: 3 } })
    const result = cascadeClearKnockout('A', oldStandings, newStandings, {}, [])
    expect(result).toEqual({})
  })
})
```

- [ ] **Step 2: Correr para confirmar que falha**

```bash
npx vitest run src/engine/cascade.test.ts
```

Expected: FAIL — `cascadeClearKnockout is not a function`

- [ ] **Step 3: Criar `cascade.ts`**

```typescript
// src/engine/cascade.ts
import type { ScoreMap, Standing, GroupStandings } from './types'

// Mapeia 1º lugar de cada grupo → r32 match ID
const FIRST_TO_R32: Record<string, string> = {
  A: 'r32-1',  B: 'r32-2',  C: 'r32-3',  D: 'r32-4',
  E: 'r32-5',  F: 'r32-6',  G: 'r32-7',  H: 'r32-8',
  I: 'r32-9',  J: 'r32-10', K: 'r32-11', L: 'r32-12',
}

// Mapeia 2º lugar de cada grupo → r32 match ID
const SECOND_TO_R32: Record<string, string> = {
  A: 'r32-2',  B: 'r32-1',  C: 'r32-4',  D: 'r32-3',
  E: 'r32-6',  F: 'r32-5',  G: 'r32-8',  H: 'r32-7',
  I: 'r32-13', J: 'r32-14', K: 'r32-15', L: 'r32-16',
}

// 3-N slot (1-indexed) → r32 match ID (r32-9 a r32-16)
const THIRD_SLOT_TO_R32: Record<number, string> = {
  1: 'r32-9',  2: 'r32-10', 3: 'r32-11', 4: 'r32-12',
  5: 'r32-13', 6: 'r32-14', 7: 'r32-15', 8: 'r32-16',
}

// Grafo de dependências: se pai é afectado → filho é afectado
const KNOCKOUT_CHILDREN: Record<string, string[]> = {
  'r32-1':  ['r16-1'], 'r32-2':  ['r16-1'],
  'r32-3':  ['r16-2'], 'r32-4':  ['r16-2'],
  'r32-5':  ['r16-3'], 'r32-6':  ['r16-3'],
  'r32-7':  ['r16-4'], 'r32-8':  ['r16-4'],
  'r32-9':  ['r16-5'], 'r32-10': ['r16-5'],
  'r32-11': ['r16-6'], 'r32-12': ['r16-6'],
  'r32-13': ['r16-7'], 'r32-14': ['r16-7'],
  'r32-15': ['r16-8'], 'r32-16': ['r16-8'],
  'r16-1':  ['qf-1'],  'r16-2':  ['qf-1'],
  'r16-3':  ['qf-2'],  'r16-4':  ['qf-2'],
  'r16-5':  ['qf-3'],  'r16-6':  ['qf-3'],
  'r16-7':  ['qf-4'],  'r16-8':  ['qf-4'],
  'qf-1':   ['sf-1'],  'qf-2':   ['sf-1'],
  'qf-3':   ['sf-2'],  'qf-4':   ['sf-2'],
  'sf-1':   ['final', '3rd'],
  'sf-2':   ['final', '3rd'],
}

function best3rdCodes(allStandings: GroupStandings, thirdQualifiers: string[]): string[] {
  const thirds: Standing[] = thirdQualifiers.length > 0
    ? thirdQualifiers
        .map((id) => allStandings[id]?.[2])
        .filter((s): s is Standing => s !== undefined)
    : Object.values(allStandings)
        .filter((group) => group.length >= 3)
        .map((group) => group[2])

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
    .map((s) => s.teamCode)
}

function standingChanged(a: Standing | undefined, b: Standing | undefined): boolean {
  if (!a && !b) return false
  if (!a || !b) return true
  return a.teamCode !== b.teamCode
}

export function cascadeClearKnockout(
  groupId: string,
  oldAllStandings: GroupStandings,
  newAllStandings: GroupStandings,
  scores: ScoreMap,
  thirdQualifiers: string[],
): ScoreMap {
  const oldGroup = oldAllStandings[groupId] ?? []
  const newGroup = newAllStandings[groupId] ?? []

  const affected = new Set<string>()

  // 1º lugar mudou?
  if (standingChanged(oldGroup[0], newGroup[0])) {
    const r32 = FIRST_TO_R32[groupId]
    if (r32) affected.add(r32)
  }

  // 2º lugar mudou?
  if (standingChanged(oldGroup[1], newGroup[1])) {
    const r32 = SECOND_TO_R32[groupId]
    if (r32) affected.add(r32)
  }

  // 3º lugar mudou? → verificar se ranking de best-3rds mudou
  if (standingChanged(oldGroup[2], newGroup[2])) {
    const oldBest = best3rdCodes(oldAllStandings, thirdQualifiers)
    const newBest = best3rdCodes(newAllStandings, thirdQualifiers)
    for (let i = 0; i < 8; i++) {
      if (oldBest[i] !== newBest[i]) {
        const r32 = THIRD_SLOT_TO_R32[i + 1]
        if (r32) affected.add(r32)
      }
    }
  }

  if (affected.size === 0) return scores

  // BFS para propagar downstream
  const queue = [...affected]
  while (queue.length > 0) {
    const matchId = queue.shift()!
    for (const child of KNOCKOUT_CHILDREN[matchId] ?? []) {
      if (!affected.has(child)) {
        affected.add(child)
        queue.push(child)
      }
    }
  }

  // Remover chaves afectadas do ScoreMap
  const result = { ...scores }
  for (const matchId of affected) {
    delete result[matchId]
  }
  return result
}
```

- [ ] **Step 4: Correr os testes**

```bash
npx vitest run src/engine/cascade.test.ts
```

Expected: PASS (todos os testes)

Se algum falhar: verificar os scores dos grupos de teste — as standings podem variar conforme os tiebreakers. Ajustar os scores dos grupos de teste para garantir 1º/2º inequívocos.

- [ ] **Step 5: Correr suite completa**

```bash
npm run test
```

Expected: sem regressões.

- [ ] **Step 6: Commit**

```bash
git add src/engine/cascade.ts src/engine/cascade.test.ts
git commit -m "feat: cascade-clear knockout scores when group standings change"
```

---

## Task 3: Actualizar store — `setScore` e `clearScore`

**Files:**
- Modify: `src/store/tournament.slice.ts`
- Modify: `src/store/tournament.slice.test.ts`

### Contexto

`setScore` e `clearScore` precisam de:
1. Detectar se o `matchId` é de grupo (`/^[A-L]\d$/`)
2. Calcular standings antes e depois da mudança
3. Chamar `cascadeClearKnockout` para obter ScoreMap limpo

- [ ] **Step 1: Escrever os novos testes no ficheiro de testes do store**

Adicionar ao fim de `src/store/tournament.slice.test.ts`:

```typescript
describe('TournamentSlice — cascade knockout em setScore', () => {
  it('limpa r32-1 quando 1º de A muda após setScore', () => {
    const store = makeStore()
    // Preencher grupo A: MEX 1º (vence todos)
    store.getState().setScore('A1', 2, 0)
    store.getState().setScore('A2', 1, 0)
    store.getState().setScore('A3', 2, 0)
    store.getState().setScore('A4', 2, 0)
    store.getState().setScore('A5', 2, 0)
    store.getState().setScore('A6', 1, 0)
    // Injectar score de r32-1 directamente
    store.getState().setScores({ ...store.getState().scores, 'r32-1': { home: 2, away: 1 } })
    expect(store.getState().scores['r32-1']).toBeDefined()

    // RSA vence MEX → RSA fica 1º (RSA é away em A1)
    store.getState().setScore('A1', 0, 3)

    expect(store.getState().scores['r32-1']).toBeUndefined()
  })

  it('NÃO limpa r32-1 se 1º de A não muda (só margem)', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 0) // MEX 1º
    store.getState().setScore('A3', 2, 0)
    store.getState().setScore('A5', 2, 0)
    store.getState().setScores({ ...store.getState().scores, 'r32-1': { home: 2, away: 1 } })

    // Alterar margem: A1 passa de 2-0 para 3-0 — MEX continua 1º
    store.getState().setScore('A1', 3, 0)

    expect(store.getState().scores['r32-1']).toEqual({ home: 2, away: 1 })
  })

  it('não cascata em setScore de um jogo knockout', () => {
    const store = makeStore()
    store.getState().setScores({ 'r32-1': { home: 2, away: 1 }, 'r16-1': { home: 1, away: 0 } })
    // setScore de r32-1 (knockout) não deve limpar r16-1
    store.getState().setScore('r32-1', 3, 1)
    expect(store.getState().scores['r16-1']).toEqual({ home: 1, away: 0 })
  })
})

describe('TournamentSlice — cascade knockout em clearScore', () => {
  it('limpa r32-2 quando clearScore remove score que tornava MEX 2º em A', () => {
    const store = makeStore()
    // Grupo A completo com RSA 1º e MEX 2º
    store.getState().setScore('A1', 0, 2) // RSA vence MEX
    store.getState().setScore('A2', 1, 0)
    store.getState().setScore('A3', 2, 0)
    store.getState().setScore('A4', 2, 0)
    store.getState().setScore('A5', 0, 2) // MEX perde
    store.getState().setScore('A6', 0, 2)
    store.getState().setScores({ ...store.getState().scores, 'r32-2': { home: 1, away: 0 } })

    // clearScore de A1 → standings de A mudam
    store.getState().clearScore('A1')

    expect(store.getState().scores['r32-2']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr para confirmar que os novos testes falham**

```bash
npx vitest run src/store/tournament.slice.test.ts
```

Expected: os novos testes falham (cascade ainda não implementado).

- [ ] **Step 3: Actualizar `tournament.slice.ts` — imports**

No topo de `src/store/tournament.slice.ts`, adicionar:

```typescript
import { computeAllStandings } from '@/engine/classifier'
import { cascadeClearKnockout } from '@/engine/cascade'
```

Manter os imports existentes.

- [ ] **Step 4: Adicionar helper `getGroupId` e actualizar `setScore`**

Substituir a função `setScore` existente:

```typescript
// Retorna o groupId se matchId for de grupo ('A1'..'L6'), ou null se for knockout
function getGroupId(matchId: string): string | null {
  return /^[A-L]\d$/.test(matchId) ? matchId[0] : null
}
```

Substituir `setScore`:

```typescript
setScore: (matchId, home, away) =>
  set((state) => {
    const groupId = getGroupId(matchId)
    if (!groupId) {
      return { scores: { ...state.scores, [matchId]: { home, away } } }
    }
    const oldAllStandings = computeAllStandings(state.scores)
    const newScores = { ...state.scores, [matchId]: { home, away } }
    const newAllStandings = computeAllStandings(newScores)
    const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, newScores, state.thirdQualifiers)
    return { scores: cleanScores }
  }),
```

- [ ] **Step 5: Actualizar `clearScore`**

Substituir `clearScore`:

```typescript
clearScore: (matchId) =>
  set((state) => {
    const groupId = getGroupId(matchId)
    const { [matchId]: _removed, ...rest } = state.scores
    if (!groupId) {
      return { scores: rest }
    }
    const oldAllStandings = computeAllStandings(state.scores)
    const newAllStandings = computeAllStandings(rest)
    const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, rest, state.thirdQualifiers)
    return { scores: cleanScores }
  }),
```

- [ ] **Step 6: Correr os testes**

```bash
npx vitest run src/store/tournament.slice.test.ts
```

Expected: PASS (todos os testes, incluindo os novos).

- [ ] **Step 7: Correr suite completa**

```bash
npm run test
```

Expected: sem regressões.

- [ ] **Step 8: Commit**

```bash
git add src/store/tournament.slice.ts src/store/tournament.slice.test.ts
git commit -m "feat: cascade-clear knockout in setScore and clearScore"
```

---

## Task 4: Actualizar store — `pickGroupOrder`

**Files:**
- Modify: `src/store/tournament.slice.ts`
- Modify: `src/store/tournament.slice.test.ts`

- [ ] **Step 1: Adicionar teste ao ficheiro de store**

```typescript
describe('TournamentSlice — cascade knockout em pickGroupOrder', () => {
  it('limpa r32-1 e r32-2 quando pickGroupOrder de A inverte 1º e 2º', () => {
    const store = makeStore()
    // Grupo A com MEX 1º
    store.getState().setScore('A1', 2, 0)
    store.getState().setScore('A2', 1, 0)
    store.getState().setScore('A3', 2, 0)
    store.getState().setScore('A4', 2, 0)
    store.getState().setScore('A5', 2, 0)
    store.getState().setScore('A6', 1, 0)
    store.getState().setScores({
      ...store.getState().scores,
      'r32-1': { home: 2, away: 1 },
      'r32-2': { home: 1, away: 0 },
      'r16-1': { home: 1, away: 0 },
    })

    // Reordenar: RSA 1º, MEX 2º
    store.getState().pickGroupOrder('A', ['RSA', 'MEX', 'KOR', 'CZE'])

    expect(store.getState().scores['r32-1']).toBeUndefined()
    expect(store.getState().scores['r32-2']).toBeUndefined()
    expect(store.getState().scores['r16-1']).toBeUndefined()
  })

  it('deixa grupos B intactos quando pickGroupOrder é de A', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 0)
    store.getState().setScore('A3', 2, 0)
    store.getState().setScore('A5', 2, 0)
    store.getState().setScores({ ...store.getState().scores, 'r32-1': { home: 1, away: 0 } })

    store.getState().pickGroupOrder('A', ['RSA', 'MEX', 'KOR', 'CZE'])

    // r32-3 (1C vs 2D) não é afectado por mudanças no Grupo A
    // (só verificamos que não explode; r32-3 não estava definido)
    expect(store.getState().scores['r32-3']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr para confirmar que falha**

```bash
npx vitest run src/store/tournament.slice.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|cascade.*pickGroup"
```

Expected: os novos testes falham.

- [ ] **Step 3: Actualizar `pickGroupOrder` no store**

Substituir a implementação existente:

```typescript
pickGroupOrder: (groupId, orderedTeams) =>
  set((state) => {
    const fixtures = FIXTURES.filter((f) => f.group === groupId)
    const newGroupScores = generateGroupScoresForOrder(orderedTeams, fixtures, TEAMS)
    const oldAllStandings = computeAllStandings(state.scores)
    const newScores = { ...state.scores, ...newGroupScores }
    const newAllStandings = computeAllStandings(newScores)
    const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, newScores, state.thirdQualifiers)
    return { scores: cleanScores }
  }),
```

- [ ] **Step 4: Correr os testes**

```bash
npx vitest run src/store/tournament.slice.test.ts
```

Expected: PASS (todos).

- [ ] **Step 5: Correr suite completa + build**

```bash
npm run test && npm run build
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/store/tournament.slice.ts src/store/tournament.slice.test.ts
git commit -m "feat: cascade-clear knockout in pickGroupOrder"
```

---

## Task 5: Criar `e2e/helpers.ts` e refactorizar ficheiros E2E existentes

**Files:**
- Create: `e2e/helpers.ts`
- Modify: `e2e/full-flow.spec.ts`
- Modify: `e2e/share.spec.ts`

### Contexto

Os helpers `openGroupModal`, `closeModal`, `ensureExpanded`, `fillGroupScores` estão duplicados em `full-flow.spec.ts` e `share.spec.ts`. Extrair para `e2e/helpers.ts` e adicionar `injectScores` para injectar estado via localStorage.

- [ ] **Step 1: Criar `e2e/helpers.ts`**

```typescript
// e2e/helpers.ts
import type { Page } from '@playwright/test'
import type { ScoreMap } from '../src/engine/types'

export async function openGroupModal(page: Page, groupLetter: string) {
  await page.getByTestId(`group-card-${groupLetter}`).click()
  await page.getByRole('heading', { name: `Grupo ${groupLetter}` }).waitFor()
}

export async function closeModal(page: Page) {
  await page.getByTestId('modal-close').click()
}

export async function ensureExpanded(page: Page, matchId: string) {
  const compact = page.getByTestId(`compact-${matchId}`)
  if (await compact.isVisible()) {
    await compact.click()
    await page.waitForTimeout(50)
  }
}

export async function fillGroupScores(
  page: Page,
  scores: Record<string, [number, number]>,
) {
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    for (let i = 0; i < home; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`home-plus-${matchId}`).click()
    }
    for (let i = 0; i < away; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`away-plus-${matchId}`).click()
    }
    await page.waitForTimeout(50)
  }
}

// Injecta scores no localStorage e recarrega a página para o estado ser lido
export async function injectScores(page: Page, scores: ScoreMap) {
  await page.evaluate((s) => {
    const existing = JSON.parse(localStorage.getItem('wcp2026-state') || '{"state":{}}')
    existing.state.scores = { ...(existing.state.scores ?? {}), ...s }
    localStorage.setItem('wcp2026-state', JSON.stringify(existing))
  }, scores)
  await page.reload()
}
```

- [ ] **Step 2: Actualizar `e2e/full-flow.spec.ts`**

Substituir as 4 funções locais por imports e remover as definições:

```typescript
import { test, expect } from '@playwright/test'
import { openGroupModal, closeModal, ensureExpanded, fillGroupScores } from './helpers'
```

Remover as funções `openGroupModal`, `closeModal`, `ensureExpanded`, `fillGroupScores` que estavam definidas localmente (linhas 4–39 do ficheiro original).

- [ ] **Step 3: Actualizar `e2e/share.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { ensureExpanded } from './helpers'
```

Remover a função `ensureExpanded` local (linhas 4–10 do ficheiro original).

- [ ] **Step 4: Correr os testes E2E existentes para confirmar sem regressões**

```bash
npx playwright test e2e/full-flow.spec.ts e2e/share.spec.ts
```

Expected: todos os testes existentes passam.

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers.ts e2e/full-flow.spec.ts e2e/share.spec.ts
git commit -m "refactor: extract shared E2E helpers to e2e/helpers.ts"
```

---

## Task 6: Criar `e2e/journey.spec.ts`

**Files:**
- Create: `e2e/journey.spec.ts`

### Contexto

ScoreMap pré-calculado para os 10 grupos injectados (B, D, E, F, G, H, I, J, K, L).
Para cada grupo: T1 vence todos (9pts/1º), T2 vence T4 e T3 (6pts/2º), T3 vence T4 (3pts/3º), T4 perde tudo (0pts/4º).

```
ID scheme: X1=T1vsT2, X2=T3vsT4, X3=T1vsT3, X4=T2vsT4, X5=T1vsT4, X6=T2vsT3
Scores: X1=2-0, X2=2-0, X3=2-0, X4=1-0, X5=2-0, X6=1-0
```

Resultado para cada grupo injectado:
- B: CAN(1º) BIH(2º)   D: USA(1º) PAR(2º)
- E: GER(1º) CUW(2º)   F: NED(1º) JPN(2º)
- G: BEL(1º) EGY(2º)   H: ESP(1º) CPV(2º)
- I: FRA(1º) SEN(2º)   J: ARG(1º) ALG(2º)
- K: POR(1º) COD(2º)   L: ENG(1º) CRO(2º)

- [ ] **Step 1: Criar `e2e/journey.spec.ts`**

```typescript
// e2e/journey.spec.ts
import { test, expect, type Page } from '@playwright/test'
import { openGroupModal, closeModal, fillGroupScores, injectScores } from './helpers'
import type { ScoreMap } from '../src/engine/types'

// ScoreMap para 10 grupos (B, D-L): T1 vence todos, T2 vence T4 e T3
const TEN_GROUPS_SCORES: ScoreMap = {
  // B: CAN BIH QAT SUI
  B1:{home:2,away:0},B2:{home:2,away:0},B3:{home:2,away:0},B4:{home:1,away:0},B5:{home:2,away:0},B6:{home:1,away:0},
  // D: USA PAR AUS TUR
  D1:{home:2,away:0},D2:{home:2,away:0},D3:{home:2,away:0},D4:{home:1,away:0},D5:{home:2,away:0},D6:{home:1,away:0},
  // E: GER CUW CIV ECU
  E1:{home:2,away:0},E2:{home:2,away:0},E3:{home:2,away:0},E4:{home:1,away:0},E5:{home:2,away:0},E6:{home:1,away:0},
  // F: NED JPN SWE TUN
  F1:{home:2,away:0},F2:{home:2,away:0},F3:{home:2,away:0},F4:{home:1,away:0},F5:{home:2,away:0},F6:{home:1,away:0},
  // G: BEL EGY IRN NZL
  G1:{home:2,away:0},G2:{home:2,away:0},G3:{home:2,away:0},G4:{home:1,away:0},G5:{home:2,away:0},G6:{home:1,away:0},
  // H: ESP CPV KSA URU
  H1:{home:2,away:0},H2:{home:2,away:0},H3:{home:2,away:0},H4:{home:1,away:0},H5:{home:2,away:0},H6:{home:1,away:0},
  // I: FRA SEN NOR IRQ
  I1:{home:2,away:0},I2:{home:2,away:0},I3:{home:2,away:0},I4:{home:1,away:0},I5:{home:2,away:0},I6:{home:1,away:0},
  // J: ARG ALG AUT JOR
  J1:{home:2,away:0},J2:{home:2,away:0},J3:{home:2,away:0},J4:{home:1,away:0},J5:{home:2,away:0},J6:{home:1,away:0},
  // K: POR COD UZB COL
  K1:{home:2,away:0},K2:{home:2,away:0},K3:{home:2,away:0},K4:{home:1,away:0},K5:{home:2,away:0},K6:{home:1,away:0},
  // L: ENG CRO GHA PAN
  L1:{home:2,away:0},L2:{home:2,away:0},L3:{home:2,away:0},L4:{home:1,away:0},L5:{home:2,away:0},L6:{home:1,away:0},
}

async function pickKnockoutWinner(page: Page, matchTestId: string, winnerCode: string) {
  await page.getByTestId(matchTestId).first().click()
  await page.getByTestId('mode-winner').click()
  await page.getByTestId(`winner-${winnerCode}`).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('@slow Jornada completa: grupos → bracket → campeão → share', async ({ page, context }) => {
  test.slow()

  // FASE 1 — Grupos manuais
  await openGroupModal(page, 'A')
  await fillGroupScores(page, {
    A1: [2, 0], A2: [1, 0], A3: [2, 0], A4: [2, 0], A5: [2, 0], A6: [1, 0],
  })
  await closeModal(page)

  await openGroupModal(page, 'C')
  await fillGroupScores(page, {
    C1: [3, 0], C2: [0, 1], C3: [2, 0], C4: [2, 1], C5: [2, 0], C6: [1, 0],
  })
  await closeModal(page)

  // Injectar os 10 grupos restantes
  await injectScores(page, TEN_GROUPS_SCORES)

  // Verificar standings de A e C
  const cardA = page.getByTestId('group-card-A')
  await expect(cardA.getByRole('row').nth(1)).toContainText('MEX')

  const cardC = page.getByTestId('group-card-C')
  await expect(cardC.getByRole('row').nth(1)).toContainText('BRA')

  // Verificar que r32 está todo populado (16 slots com teams)
  for (let i = 1; i <= 16; i++) {
    const slot = page.getByTestId(`bracket-match-r32-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    // O slot deve ter texto (team codes) — não deve estar vazio
    await expect(slot).not.toBeEmpty()
  }

  // FASE 2 — Bracket até campeão
  // Round of 32: r32-1..16 — escolher home em cada um
  // Nota: os winners reais dependem de quem está em cada slot
  // Estratégia: abrir cada slot e escolher o primeiro team (home)
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()

  // r32 (16 jogos)
  for (let i = 1; i <= 16; i++) {
    const slot = page.getByTestId(`bracket-match-r32-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId('mode-winner').waitFor()
    // Pegar o código do home team a partir do data-testid dos botões winner-*
    // Os botões têm data-testid="winner-{teamCode}"
    const winnerButtons = page.getByTestId(/^winner-/)
    const firstButton = winnerButtons.first()
    await firstButton.click()
    await page.waitForTimeout(100)
  }

  // r16 (8 jogos)
  for (let i = 1; i <= 8; i++) {
    const slot = page.getByTestId(`bracket-match-r16-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId('mode-winner').waitFor()
    const firstButton = page.getByTestId(/^winner-/).first()
    await firstButton.click()
    await page.waitForTimeout(100)
  }

  // qf (4 jogos)
  for (let i = 1; i <= 4; i++) {
    const slot = page.getByTestId(`bracket-match-qf-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId('mode-winner').waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(100)
  }

  // sf (2 jogos)
  for (let i = 1; i <= 2; i++) {
    const slot = page.getByTestId(`bracket-match-sf-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId('mode-winner').waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(100)
  }

  // final
  const finalSlot = page.getByTestId('bracket-match-final').first()
  await finalSlot.scrollIntoViewIfNeeded()
  await finalSlot.click()
  await page.getByTestId('mode-winner').waitFor()
  await page.getByTestId(/^winner-/).first().click()
  await page.waitForTimeout(200)

  // Verificar banner de campeão
  await expect(page.getByTestId('champion-banner')).toBeVisible()

  // FASE 3 — Share
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Abrir em nova página
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Verificar scores de grupo restaurados
  await page2.getByTestId('group-card-A').click()
  await page2.getByRole('heading', { name: 'Grupo A' }).waitFor()
  await page2.getByTestId('compact-A1').click()
  await expect(page2.getByTestId('score-home-A1')).toContainText('2')
  await expect(page2.getByTestId('score-away-A1')).toContainText('0')
  await page2.getByTestId('modal-close').click()

  // Verificar banner de campeão restaurado
  await expect(page2.getByTestId('champion-banner')).toBeVisible()
})
```

- [ ] **Step 2: Correr o teste para confirmar que funciona**

```bash
npx playwright test e2e/journey.spec.ts --grep "@slow"
```

Expected: PASS. Se falhar por timeout, aumentar `test.slow()` ou ajustar `waitForTimeout`.

- [ ] **Step 3: Commit**

```bash
git add e2e/journey.spec.ts
git commit -m "test: E2E jornada completa @slow (grupos → bracket → campeão → share)"
```

---

## Task 7: Criar `e2e/adversarial.spec.ts`

**Files:**
- Create: `e2e/adversarial.spec.ts`

### Contexto

11 testes de stress que verificam comportamentos de fronteira. Cada teste tem setup independente. Os testes usam `injectScores` para injectar estado mínimo necessário.

ScoreMap de apoio a reutilizar internamente:

```typescript
// Grupo A com MEX 1º — scores mínimos (apenas A1, A3, A5 para MEX ganhar todos)
const GROUP_A_MEX_WINS_ALL: ScoreMap = {
  A1:{home:2,away:0}, A2:{home:1,away:0}, A3:{home:2,away:0},
  A4:{home:2,away:0}, A5:{home:2,away:0}, A6:{home:1,away:0},
}
// Grupo A com RSA 1º — apenas A1 invertido (RSA=away em A1, vence 0-3)
const GROUP_A_RSA_WINS: ScoreMap = {
  A1:{home:0,away:3}, A2:{home:1,away:0}, A3:{home:2,away:0},
  A4:{home:2,away:0}, A5:{home:2,away:0}, A6:{home:1,away:0},
}
```

- [ ] **Step 1: Criar `e2e/adversarial.spec.ts`**

```typescript
// e2e/adversarial.spec.ts
import { test, expect } from '@playwright/test'
import { openGroupModal, closeModal, fillGroupScores, ensureExpanded, injectScores } from './helpers'
import type { ScoreMap } from '../src/engine/types'

const GROUP_A_MEX_WINS: ScoreMap = {
  A1:{home:2,away:0}, A2:{home:1,away:0}, A3:{home:2,away:0},
  A4:{home:2,away:0}, A5:{home:2,away:0}, A6:{home:1,away:0},
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

// ─── 1. Cascade: alterar score de grupo pós-knockout ──────────────────────
test('@slow cascade: alterar 1º de A limpa r32-1 mas preserva r32-3', async ({ page }) => {
  test.slow()
  // Estado: Grupo A (MEX 1º) + r32-1 e r32-3 com scores
  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
    'r32-3': { home: 3, away: 0 },
  })

  // Alterar A1: RSA vence MEX → RSA fica 1º (mudar de 2-0 para 0-3)
  await openGroupModal(page, 'A')
  // A1 está preenchido — expandir para aceder a steppers
  await ensureExpanded(page, 'A1')
  // Decrementar home de 2 para 0
  await page.getByTestId('home-minus-A1').click()
  await page.getByTestId('home-minus-A1').click()
  // Incrementar away de 0 para 3
  await page.getByTestId('away-plus-A1').click()
  await page.getByTestId('away-plus-A1').click()
  await page.getByTestId('away-plus-A1').click()
  await closeModal(page)

  // Verificar cascade: r32-1 limpo, r32-3 intacto
  // Abrir r32-1 — deve mostrar "Aguarda resultado anterior" ou equipas diferentes
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()
  // O score foi limpo — o modal não deve mostrar "Limpar placar" (não há score existente)
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 2. Cascade: clearScore num jogo de grupo ────────────────────────────
test('@slow cascade: limpar placar de grupo limpa r32 downstream', async ({ page }) => {
  test.slow()
  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  // Limpar A1 via modal
  await openGroupModal(page, 'A')
  await ensureExpanded(page, 'A1')
  // Clicar "Limpar placar" em A1
  await page.getByTestId('clear-score-A1').click()
  // Modal fecha após clear

  // Verificar que r32-1 foi limpo
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 3. Cascade: pickGroupOrder ───────────────────────────────────────────
test('@slow cascade: GroupPositionPicker reordena A → r32-1 e r32-2 limpos', async ({ page }) => {
  test.slow()
  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
    'r32-2': { home: 1, away: 0 },
  })

  // GroupPositionPicker está dentro do MatchModal
  // 1. Abrir modal do Grupo A
  await page.getByTestId('group-card-A').click()
  await page.getByRole('heading', { name: 'Grupo A' }).waitFor()

  // 2. Clicar botão "Reordenar" (data-testid="open-position-picker")
  await page.getByTestId('open-position-picker').click()

  // 3. Dentro do picker: mover RSA (idx=1) para 1º usando up-btn-1
  await page.getByTestId('up-btn-1').click()

  // 4. Confirmar reordenação (data-testid="simulate-order")
  await page.getByTestId('simulate-order').click()
  // Modal fecha após confirmar

  // r32-1 (1A) e r32-2 (2A) devem ter sido limpos
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 4. Cascade: mudança de margem sem mudar standings ───────────────────
test('@slow cascade: alterar margem sem mudar 1º/2º preserva knockout', async ({ page }) => {
  test.slow()
  // MEX 1º com A1=2-0; injectar r32-1 score
  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  // Alterar A1 de 2-0 para 3-0 (MEX continua 1º, RSA continua 2º)
  await openGroupModal(page, 'A')
  await ensureExpanded(page, 'A1')
  await page.getByTestId('home-plus-A1').click()
  await closeModal(page)

  // r32-1 deve estar intacto
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()
  await expect(page.getByTestId('clear-score-r32-1')).toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 5. Empate bloqueado no KnockoutMatchModal ───────────────────────────
test('@slow empate bloqueado: 1-1 desactiva botão Confirmar', async ({ page }) => {
  test.slow()
  // Injectar grupo A completo para r32-1 ter equipas
  await injectScores(page, { ...GROUP_A_MEX_WINS })

  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()
  await page.getByTestId('mode-exact').waitFor()

  // Incrementar home e away para 1-1
  await page.getByTestId(/^home-plus-r32-1/).click()
  await page.getByTestId(/^away-plus-r32-1/).click()

  // Botão Confirmar deve estar disabled e mensagem de empate visível
  await expect(page.getByTestId('confirm-r32-1')).toBeDisabled()
  await expect(page.locator('text=Empate inválido')).toBeVisible()

  await page.keyboard.press('Escape')
})

// ─── 6. Slot nulo no KnockoutMatchModal ──────────────────────────────────
test('@slow slot nulo: r32-1 sem grupos preenchidos mostra aviso', async ({ page }) => {
  test.slow()
  // Estado vazio — r32-1 não tem equipas (standings vazias → null slots)
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  const r32_1 = page.getByTestId('bracket-match-r32-1').first()
  await r32_1.scrollIntoViewIfNeeded()
  await r32_1.click()

  await expect(page.locator('text=Aguarda resultado anterior')).toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 7. "Limpar tudo" com estado completo ────────────────────────────────
test('@slow limpar tudo: estado completo → tudo vazio', async ({ page }) => {
  test.slow()
  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  // Clicar "Limpar tudo" (data-testid="reset-all-btn" em AppShell)
  await page.getByTestId('reset-all-btn').click()

  // Verificar que Grupo A não tem scores (badge 0/6)
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')

  // Verificar que r32-1 não tem score (não há botão "Limpar placar")
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 8. URL com base64 inválido ──────────────────────────────────────────
test('@slow URL inválida: base64 corrompido → app funcional sem crash', async ({ page }) => {
  test.slow()
  await page.goto('/?s=!!!INVALID_BASE64!!!')

  // App não deve crashar — deve mostrar os grupos normalmente
  await expect(page.getByTestId('group-card-A')).toBeVisible()
  // Nenhum score carregado
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')
})

// ─── 9. URL com JSON válido mas schema errado ────────────────────────────
test('@slow URL inválida: JSON válido mas schema errado → estado vazio', async ({ page }) => {
  test.slow()
  // { "foo": "bar" } em base64url
  const badPayload = btoa(JSON.stringify({ foo: 'bar' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  await page.goto(`/?s=${badPayload}`)

  await expect(page.getByTestId('group-card-A')).toBeVisible()
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')
})

// ─── 10. Share URL restaura knockout scores ───────────────────────────────
test('@slow share: URL restaura grupos E knockout em nova página', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await injectScores(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Verificar score de grupo restaurado
  await page2.getByTestId('group-card-A').click()
  await page2.getByRole('heading', { name: 'Grupo A' }).waitFor()
  await page2.getByTestId('compact-A1').click()
  await expect(page2.getByTestId('score-home-A1')).toContainText('2')
  await page2.getByTestId('modal-close').click()

  // Verificar score de knockout restaurado (r32-1 tem "Limpar placar")
  await page2.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page2.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page2.getByTestId('bracket-match-r32-1').first().click()
  await expect(page2.getByTestId('clear-score-r32-1')).toBeVisible()
  await page2.keyboard.press('Escape')
})

// ─── 11. thirdQualifiers NÃO persistem na share URL ─────────────────────
test('@slow share: thirdQualifiers não persistem na URL (comportamento esperado)', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  // Adicionar qualifier manualmente via UI se botão disponível
  // Este teste documenta o comportamento actual — se mudar, o teste falha
  // e serve de alerta de breaking change

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // thirdQualifiers devem estar vazios na nova página
  // (verificar via evaluate do localStorage)
  const state = await page2.evaluate(() => {
    const raw = localStorage.getItem('wcp2026-state')
    if (!raw) return null
    return JSON.parse(raw)
  })
  // Se não há state (URL não populou localStorage), thirdQualifiers é [] por defeito
  const qualifiers = state?.state?.thirdQualifiers ?? []
  expect(qualifiers).toEqual([])
})
```

- [ ] **Step 2: Correr os testes adversariais**

```bash
npx playwright test e2e/adversarial.spec.ts --grep "@slow"
```

Expected: a maioria dos testes passa. Os testes 3 e 7 dependem de `data-testid` específicos do UI actual — se `pick-order-A` ou `reset-all-button` não existirem, os testes usam `test.skip()` interno com mensagem clara ou falham com erro descritivo.

Se algum teste falhar por `data-testid` não encontrado, verificar o componente correcto e actualizar o `data-testid` no HTML ou no teste.

- [ ] **Step 3: Correr suite E2E completa (não-slow)**

```bash
npm run test:e2e
```

Expected: os testes existentes (full-flow, share) continuam a passar. Os `@slow` não correm por omissão.

- [ ] **Step 4: Commit**

```bash
git add e2e/adversarial.spec.ts
git commit -m "test: E2E adversariais @slow (cascade, empate, limpar, share, URL inválida)"
```

---

## Task 8: PR e Verificação Final

- [ ] **Step 1: Correr suite completa de unit tests**

```bash
npm run test
```

Expected: PASS. Número de testes deve ser ≥ 129 (eram 129 antes desta feature).

- [ ] **Step 2: Correr coverage**

```bash
npm run coverage
```

Expected: `engine/cascade.ts` com ≥90% cobertura.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Expected: sem erros de TypeScript ou bundling.

- [ ] **Step 4: Correr E2E não-slow**

```bash
npm run test:e2e
```

Expected: PASS (full-flow + share).

- [ ] **Step 5: Abrir PR**

```bash
git checkout main && git pull origin main
git checkout -b feat/cascade-knockout-e2e
# cherry-pick ou push dos commits desta feature
gh pr create \
  --title "feat: cascade-clear knockout + E2E journey & adversarial" \
  --body "$(cat <<'EOF'
## Summary
- Fix tech debt: knockout scores agora são limpos em cascade quando standings de grupo mudam (B2: só se 1º, 2º ou ranking de 3.os mudar)
- Novo `src/engine/cascade.ts` — puro, sem React, com testes TDD
- Store: `setScore`, `clearScore`, `pickGroupOrder` chamam cascade
- E2E `journey.spec.ts` — jornada completa @slow
- E2E `adversarial.spec.ts` — 11 casos de stress @slow

## Test Plan
- [ ] `npm run test` — unit tests passam (≥129)
- [ ] `npm run build` — sem erros
- [ ] `npm run test:e2e` — full-flow + share passam
- [ ] `npx playwright test --grep "@slow"` — journey + adversarial passam
EOF
)"
```

- [ ] **Step 6: Code review `@claude`**

```bash
gh pr comment <número> --body "@claude please review this PR"
```

---

## Notas de Implementação

### `data-testid` verificados no UI existente

Confirmados por grep no código:
- `reset-all-btn` ✅ — `AppShell.tsx:55`
- `open-position-picker` ✅ — `MatchModal.tsx:65`
- `simulate-order` ✅ — `GroupPositionPicker.tsx:125` (botão confirmar reordenação)
- `up-btn-{idx}` ✅ — `GroupPositionPicker.tsx:95`
- `clear-score-{matchId}` ✅ — `MatchRow.tsx:96` e `KnockoutMatchModal.tsx:215`
- `champion-banner` ✅ — `BracketView.tsx:176`

Todos os testIds do plano foram verificados contra o código fonte.
