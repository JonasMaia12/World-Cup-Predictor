# UX Improvements — Design Spec
**Data:** 2026-04-19
**Status:** Aprovado

---

## Contexto

A interface atual tem três problemas principais:
1. 12 grupos listados verticalmente geram scroll excessivo
2. Todos os jogos de um grupo aparecem de uma vez, sem progressão
3. Bracket com scroll horizontal cortando as oitavas de final + cards pequenos

---

## Seção 1 — Tela Principal: Grid de Grupos

### Mudança
Substituir o `GroupAccordion` por um grid responsivo de cards (`GroupGrid` + `GroupCard`).

### Layout Grid
| Breakpoint | Colunas |
|---|---|
| `sm` (< 640px) | 1 |
| `md` (≥ 768px) | 2 |
| `lg` (≥ 1024px) | 3 |
| `xl` (≥ 1280px) | 4 |

### GroupCard
- **Header:** nome do grupo ("Grupo A") + badge de progresso (`3/6 jogos`)
- **Body:** tabela de standings compacta — posição, bandeira, código do time, P / J / GD
- **Footer:** borda verde mais intensa quando grupo está 100% preenchido
- **Interação:** clicar em qualquer lugar no card abre o `MatchModal`

### Font Size
- Tabelas de standings: `text-sm` → `text-base` no desktop
- Labels e badges: `text-xs` → `text-sm` onde couber

### Componentes
- `GroupAccordion.tsx` → removido
- `GroupTable.tsx` → mantido internamente mas renderizado dentro do modal
- Novos: `GroupGrid.tsx`, `GroupCard.tsx`

---

## Seção 2 — Modal Gamificado (Entrada de Placares)

### Novo Componente: `MatchModal.tsx`

Abre ao clicar num `GroupCard`. Estrutura:

```
┌─────────────────────────────────┐
│  Grupo A                   [×]  │
│  ████████░░░░  3/6 jogos        │  ← barra de progresso
├─────────────────────────────────┤
│  [COMPACTO] BRA 2 × 1 ARG  ✓   │  ← jogos preenchidos (colapsados)
│  [COMPACTO] FRA 1 × 0 GER  ✓   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  🇵🇹 POR  vs  🇪🇸 ESP      │  │  ← jogo atual (expandido)
│  │   −  0  +      −  0  +   │  │
│  └───────────────────────────┘  │
│  [próximo jogo aparece aqui]    │  ← ainda oculto
└─────────────────────────────────┘
```

### Comportamento de Reveal Progressivo
1. Modal abre com o **primeiro jogo sem placar** expandido
2. Ao preencher qualquer placar (home ou away definido), o próximo jogo faz **slide-down + fade-in**
3. Jogo preenchido colapsa automaticamente para linha compacta: `🏳️ COD  2 × 1  COD 🏳️ ✓`
4. Clicar num jogo compacto o re-expande (para corrigir placar) — o jogo que estava expandido colapsa
5. Fechar o modal persiste automaticamente (estado no Zustand, sem ação extra)

### Estilo do Modal
- Overlay: `backdrop-blur-sm` + fundo escuro semitransparente
- Modal: centralizado, `max-h-[85vh] overflow-y-auto`, `rounded-2xl`
- Barra de progresso: `bg-wcp-primary` fill animado via `width` CSS transition
- Jogo expandido: `MatchRow` existente (steppers +/−)
- Jogo compacto: nova variante `MatchRow` com `compact` prop — só times + placar, sem steppers, `py-1.5`

### Animações
- Reveal do próximo jogo: `transition: max-height 300ms ease, opacity 300ms ease`
- Colapso: mesma transition invertida

---

## Seção 3 — Bracket: Fix + Responsividade

### Bug do Corte das Oitavas
**Causa:** `overflow-y-auto` no container pai (`main` no AppShell) cria stacking context que interfere com `overflow-x-auto` do bracket, cortando o lado esquerdo.

**Fix:** wrapper do bracket recebe `overflow-x-auto` independente, com `padding-left` explícito. Remover qualquer `overflow-hidden` nos ancestrais diretos do bracket.

### Tamanhos com `clamp()`
```css
/* Cards das rodadas */
min-width: clamp(110px, 11vw, 150px);

/* Gap entre rounds */
gap: clamp(12px, 2vw, 32px);
```

Resultado:
- `xl` (≥ 1280px): cards ~150px, bracket confortável sem scroll
- `lg` (1024px): cards ~130px
- `md` (768px): scroll horizontal funciona, oitavas visíveis à esquerda

### Font Size no Bracket
| Elemento | Antes | Depois |
|---|---|---|
| Nome dos times | `text-xs` | `text-sm` |
| Labels das rodadas | `text-[8px]` | `text-[10px]` |
| Winner badge | `text-[9px]` | `text-[9px]` (mantém) |

### Mobile
Sem mudança — `BracketMinimap` + cards por rodada continuam como estão.

---

## Arquitetura de Componentes

### Novos
- `src/components/groups/GroupGrid.tsx` — grid responsivo dos 12 grupos
- `src/components/groups/GroupCard.tsx` — card individual com standings + badge progresso
- `src/components/groups/MatchModal.tsx` — modal gamificado com reveal progressivo

### Modificados
- `src/components/groups/MatchRow.tsx` — adicionar prop `compact?: boolean`
- `src/components/bracket/BracketView.tsx` — fix overflow + clamp nos cards
- `src/components/layout/AppShell.tsx` — substituir `GroupAccordion` por `GroupGrid`

### Removidos
- `src/components/groups/GroupAccordion.tsx`

---

## Testes
- Unitários (Vitest): `GroupCard`, `MatchModal` (reveal progressivo, collapse, re-expand)
- E2E (Playwright): fluxo completo — clicar grupo → preencher jogos progressivamente → fechar modal → standings atualizadas no card
- Regressão: bracket visível sem corte, share button ainda funciona, community stats visíveis
