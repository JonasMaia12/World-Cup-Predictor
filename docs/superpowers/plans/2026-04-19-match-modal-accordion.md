# MatchModal Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o sistema de revelação progressiva do MatchModal por um accordion puro — todos os 6 jogos visíveis desde o início, um expandido por vez, sem auto-advance.

**Architecture:** `MatchModal` perde `revealedCount` e o `useEffect` de sync; passa a renderizar todos os fixtures sempre; o `handleScoreChange` torna-se apenas `setScore`. O `MatchRow compact` passa a distinguir entre "preenchido" (`score + ✓`) e "vazio" (`– × –` + `›`) internamente. O header clicável para colapsar um jogo expandido é um `<button>` fino renderizado diretamente no `MatchModal`, acima do `MatchRow`.

**Tech Stack:** React 19, Vitest, Playwright, Tailwind (tokens `wcp-*`)

---

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/components/groups/MatchRow.tsx` | Compact: mostra `– × –` + `›` quando sem score, `X × Y` + `✓` quando com score |
| `src/components/groups/MatchModal.tsx` | Remove `revealedCount`, `useEffect`, lógica `wasUnset`; renderiza todos os fixtures; accordion com header colapsável |
| `src/components/groups/MatchRow.test.tsx` | Adiciona teste de compact sem score |
| `src/components/groups/MatchModal.test.tsx` | Remove testes de revelação progressiva; adiciona testes de accordion |
| `e2e/full-flow.spec.ts` | Substitui teste "progressive reveal" por teste de accordion; atualiza comentário do helper |

---

## Task 0: Criar branch de feature

- [ ] **Step 1: Criar e publicar a branch**

```bash
git checkout main && git pull origin main
git checkout -b feat/match-modal-accordion
git push -u origin feat/match-modal-accordion
```

---

## Task 1: MatchRow — compact sem score

**Files:**
- Modify: `src/components/groups/MatchRow.tsx:67-85`
- Test: `src/components/groups/MatchRow.test.tsx`

- [ ] **Step 1: Escrever o teste que deve falhar**

Adicione ao final do describe `'MatchRow compact mode'` em `src/components/groups/MatchRow.test.tsx`:

```tsx
it('compact without score shows em-dashes and chevron', () => {
  render(
    <MatchRow
      match={match}
      homeScore={undefined}
      awayScore={undefined}
      onScoreChange={vi.fn()}
      compact
    />
  )
  expect(screen.getByText('– × –')).toBeInTheDocument()
  expect(screen.getByText('›')).toBeInTheDocument()
  expect(screen.queryByText('✓')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
cd /Users/macbookpro/Documents/Jonas/World-Cup-Predictor
npm run test -- --reporter=verbose src/components/groups/MatchRow.test.tsx
```

Esperado: `FAIL` com "Unable to find an element with the text: – × –"

- [ ] **Step 3: Implementar — atualizar o bloco compact em MatchRow.tsx**

Substituir o bloco `if (compact)` atual (linhas 67-86) por:

```tsx
if (compact) {
  const hasSco = homeScore !== undefined
  const scoreLabel = hasSco ? `${home} × ${away}` : '– × –'
  const indicator = hasSco ? '✓' : '›'

  return (
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
      <span className={`text-xs font-bold ml-2 ${hasSco ? 'text-wcp-primary' : 'text-wcp-muted'}`}>
        {indicator}
      </span>
    </button>
  )
}
```

- [ ] **Step 4: Rodar todos os testes de MatchRow e confirmar que passam**

```bash
npm run test -- --reporter=verbose src/components/groups/MatchRow.test.tsx
```

Esperado: todos os testes PASS (incluindo os anteriores de compact com score).

- [ ] **Step 5: Commit**

```bash
git add src/components/groups/MatchRow.tsx src/components/groups/MatchRow.test.tsx
git commit -m "feat: MatchRow compact distingue score preenchido vs vazio"
```

---

## Task 2: MatchModal — accordion puro

**Files:**
- Modify: `src/components/groups/MatchModal.tsx`
- Test: `src/components/groups/MatchModal.test.tsx`

- [ ] **Step 1: Reescrever os testes de MatchModal**

Substituir o conteúdo completo de `src/components/groups/MatchModal.test.tsx` por:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchModal } from './MatchModal'
import { useStore, type StoreState } from '@/store'

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
  vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
    sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
  )
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

  it('shows all 6 matches on open (accordion — all visible)', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // First match expanded — steppers visible
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    // Remaining 5 matches collapsed — their compact rows are present
    expect(screen.getByTestId('compact-A2')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A3')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A4')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A5')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A6')).toBeInTheDocument()
  })

  it('clicking a collapsed match expands it and collapses the previous', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 starts expanded
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    // Click A2 compact row → A2 expands, A1 collapses
    fireEvent.click(screen.getByTestId('compact-A2'))
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
  })

  it('clicking the collapse header of the expanded match closes it', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 is expanded — collapse header button is visible
    fireEvent.click(screen.getByTestId('collapse-header-A1'))
    // A1 steppers gone — all matches now collapsed
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.getByTestId('compact-A1')).toBeInTheDocument()
  })

  it('incrementing score does not auto-advance to next match', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 expanded — click + on home score
    fireEvent.click(screen.getByTestId('home-plus-A1'))
    expect(mockSetScore).toHaveBeenCalledWith('A1', 1, 0)
    // A1 remains expanded, A2 remains collapsed
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A2')).not.toBeInTheDocument()
  })

  it('opens last unfilled match when all previous are filled', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A6 is the first unfilled → should be expanded
    expect(screen.getByTestId('home-plus-A6')).toBeInTheDocument()
  })

  it('all matches collapsed when all already scored on open', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // No steppers visible
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A6')).not.toBeInTheDocument()
    // All compact rows present
    expect(screen.getByTestId('compact-A1')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A6')).toBeInTheDocument()
  })

  it('shows progress 6/6 when all matches scored', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar os novos testes e confirmar que os novos falham (os velhos ainda passam)**

```bash
npm run test -- --reporter=verbose src/components/groups/MatchModal.test.tsx
```

Esperado: testes `shows all 6 matches on open`, `clicking a collapsed match`, `clicking the collapse header`, `incrementing score does not auto-advance` **FAIL**. Testes de `group name`, `close button`, `progress 0/6` e `6/6` continuam PASS.

- [ ] **Step 3: Reescrever MatchModal.tsx**

Substituir o conteúdo completo de `src/components/groups/MatchModal.tsx` por:

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

export function MatchModal({ groupId, onClose }: MatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)

  const fixtures = useMemo(
    () => FIXTURES.filter((f) => f.group === groupId),
    [groupId]
  )

  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length

  const firstUnfilledIdx = fixtures.findIndex((f) => scores[f.id] === undefined)
  const [expandedIndex, setExpandedIndex] = useState(firstUnfilledIdx)

  const handleScoreChange = (matchId: string, home: number, away: number) => {
    setScore(matchId, home, away)
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? -1 : idx))
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

            if (isExpanded) {
              const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
              const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)
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
                  <MatchRow
                    match={match}
                    homeScore={scores[match.id]?.home}
                    awayScore={scores[match.id]?.away}
                    onScoreChange={handleScoreChange}
                  />
                </div>
              )
            }

            return (
              <MatchRow
                key={match.id}
                match={match}
                homeScore={scores[match.id]?.home}
                awayScore={scores[match.id]?.away}
                onScoreChange={handleScoreChange}
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

- [ ] **Step 4: Rodar todos os testes de MatchModal e confirmar que passam**

```bash
npm run test -- --reporter=verbose src/components/groups/MatchModal.test.tsx
```

Esperado: todos os testes PASS.

- [ ] **Step 5: Rodar toda a suíte de unit tests**

```bash
npm run test
```

Esperado: todos os testes PASS (nenhuma regressão).

- [ ] **Step 6: Commit**

```bash
git add src/components/groups/MatchModal.tsx src/components/groups/MatchModal.test.tsx
git commit -m "feat: MatchModal accordion — todos os jogos visíveis, sem auto-advance"
```

---

## Task 3: Atualizar E2E

**Files:**
- Modify: `e2e/full-flow.spec.ts`

- [ ] **Step 1: Substituir o teste "progressive reveal" por teste de accordion**

No arquivo `e2e/full-flow.spec.ts`:

1. **Atualizar o comentário do helper `fillGroupScores`** — remover as linhas sobre "progressive reveal" e substituir:

```ts
// Fill scores for a group inside the open modal.
// Keys are match IDs, values are [home, away].
// Matches start collapsed in accordion mode; ensureExpanded opens them before clicking steppers.
async function fillGroupScores(page: Page, scores: Record<string, [number, number]>) {
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
```

2. **Substituir o teste `'Group card opens modal with progressive reveal'`** pelo novo:

```ts
test('Group card opens modal with accordion — all matches visible', async ({ page }) => {
  await openGroupModal(page, 'A')

  // First match (A1) is expanded — steppers visible
  await expect(page.getByTestId('home-plus-A1')).toBeVisible()

  // All other matches are collapsed but visible (compact rows present)
  await expect(page.getByTestId('compact-A2')).toBeVisible()
  await expect(page.getByTestId('compact-A6')).toBeVisible()

  // Click A3 — A3 expands, A1 collapses
  await page.getByTestId('compact-A3').click()
  await expect(page.getByTestId('home-plus-A3')).toBeVisible()
  await expect(page.getByTestId('compact-A1')).toBeVisible()

  // Score A3 — no auto-advance, A3 stays expanded
  await page.getByTestId('home-plus-A3').click()
  await expect(page.getByTestId('home-plus-A3')).toBeVisible()

  // Close modal — progress badge updates (1 scored out of 6)
  await closeModal(page)
  await expect(page.getByTestId('group-card-A')).toContainText('1/6')
})
```

- [ ] **Step 2: Rodar o build para confirmar sem erros de TypeScript**

```bash
npm run build
```

Esperado: build limpo, zero erros.

- [ ] **Step 3: Rodar os E2E (dev server deve estar rodando)**

Em terminal separado: `npm run dev`

```bash
npm run test:e2e
```

Esperado: todos os testes E2E PASS, incluindo o novo `'Group card opens modal with accordion'`.

- [ ] **Step 4: Commit**

```bash
git add e2e/full-flow.spec.ts
git commit -m "test(e2e): atualizar full-flow para accordion — remove progressive reveal"
```

---

## Task 4: PR

- [ ] **Step 1: Criar o PR**

```bash
gh pr create \
  --title "feat: MatchModal accordion — todos os jogos visíveis, sem auto-advance" \
  --body "$(cat <<'EOF'
## Summary
- Remove revelação progressiva do MatchModal (bug: auto-advance disparava no primeiro clique no +)
- Todos os 6 jogos do grupo visíveis desde o início, colapsados
- Accordion: um jogo expandido por vez; usuário controla qual está aberto
- MatchRow compact distingue visualmente jogos preenchidos (✓) de vazios (›)

## Test Plan
- [ ] Unit tests: MatchRow compact sem score, MatchModal accordion behavior
- [ ] E2E: accordion visível, sem auto-advance, progresso correto
- [ ] Build limpo
EOF
)"
```

- [ ] **Step 2: Solicitar code review**

```bash
gh pr comment <número-do-pr> --body "@claude please review this PR"
```

Substituir `<número-do-pr>` pelo número gerado no passo anterior.
