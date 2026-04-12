# Design Spec: Phase 2 — Interface Reativa

**Date:** 2026-04-12
**Status:** Approved

---

## Objetivo

Implementar o motor FIFA via TDD e construir a interface reativa completa: o usuário digita placares, a tabela de classificação atualiza em tempo real, e o bracket eliminatório reflete os classificados automaticamente.

**Critério de saída:** `npm run dev` → digitar placares em qualquer grupo → standings atualizam em tempo real → sidebar "Bracket" → oitavas de final refletem os classificados.

---

## Ordem de Implementação

**Engine primeiro (TDD obrigatório), depois UI.**

O engine é a fundação. Com ele 100% testado, a UI nunca precisa de mocks e o fluxo completo é garantido por testes antes de chegar no browser.

---

## Seção 1 — Engine TDD

### `classifier.ts`

Recebe um `Group` e um `ScoreMap`, calcula standings para os 4 times e retorna ordenado por pontos (critério primário). Sem critérios de desempate — delega ao `tiebreaker` quando necessário.

**Cálculo por time:**
- Pontos: vitória=3, empate=1, derrota=0
- GD: gols marcados − gols sofridos
- GF: gols marcados

### `tiebreaker.ts`

Recebe um slice de standings empatados em pontos e o `ScoreMap` completo do grupo. Aplica critérios FIFA em cascata:

1. Pontos nos confrontos diretos entre os empatados
2. GD nos confrontos diretos
3. GF nos confrontos diretos
4. GD geral no grupo
5. GF geral no grupo
6. Ordem de sorteio (posição original no array — determinística para testes)

### `bracket-generator.ts`

Recebe `GroupStandings` (todos os 12 grupos classificados). Identifica os 8 melhores terceiros colocados (por pontos → GD → GF). Posiciona os 32 classificados nos slots pré-definidos da FIFA 2026 no `roundOf32`.

Rodadas subsequentes (`roundOf16`, `quarterFinals`, etc.) ficam com `home: null, away: null` — preenchidas na Fase 3.

**Cobertura alvo:** 100% em `src/engine/`.

---

## Seção 2 — Componentes UI

### `MatchRow`

Props: `match: Match`, `homeScore: number | undefined`, `awayScore: number | undefined`, `onScoreChange: (matchId, home, away) => void`

- Dois `input[type=number]` com `min=0`, sempre visíveis
- `onChange` dispara `onScoreChange` imediatamente (sem debounce)
- Sem acesso direto ao store — testável de forma isolada

### `GroupTable`

Props: `groupId: string`

- Lê `scores` do store via `useStore`
- Chama `classifyGroup(group, scores)` na hora do render
- Renderiza:
  1. Tabela de standings: posição, bandeira, nome, J / G / E / P / SG / GP / PTS
  2. Lista dos 6 jogos com `MatchRow` para cada um

### `BracketView`

Props: `bracket: Bracket`

- Renderiza cards por rodada: Oitavas → Quartas → Semis → Final + 3º lugar
- Times não definidos (`null`) aparecem como `"?"`
- Componente puramente de display — zero lógica própria

### `ContentArea` (atualizado)

- Se `selectedGroup === 'bracket'`: renderiza `BracketView` com bracket derivado de todos os grupos
- Caso contrário: renderiza `GroupTable` com o grupo selecionado

### `Sidebar` (atualizado)

- Adiciona item `"🏆 Bracket"` fixo após os 12 grupos, separado por divisor
- Ao clicar: `setSelectedGroup('bracket')`

---

## Seção 3 — Fluxo de Dados

```
input onChange
    → store.setScore(matchId, home, away)
        → GroupTable re-renderiza
            → classifyGroup(group, store.scores) → standings atualizados
        → BracketView re-renderiza (quando visível)
            → generateBracket(allGroupStandings) → bracket atualizado
```

**Regras:**
- `classifyGroup` é computação derivada chamada no render — sem cache, sem estado extra
- `generateBracket` chamado no render do BracketView com standings de todos os 12 grupos
- O store guarda **apenas `scores`** — standings e bracket são sempre derivados
- `MatchRow` recebe callbacks via props, nunca acessa o store diretamente

---

## Layout das Views

### GroupTable View

```
┌─────────────────────────────────────┐
│ GRUPO A                             │
│                                     │
│  #  Seleção        J  G  E  P  SG  │
│  1  🇲🇽 México     3  3  0  9  +7  │
│  2  🇰🇷 Coreia     3  1  1  4  +1  │
│  3  🇨🇿 Tchéquia   3  1  1  4  -1  │
│  4  🇿🇦 África     3  0  0  0  -7  │
│                                     │
│  JOGOS                              │
│  🇲🇽 México    [2] — [0] 🇿🇦 África │
│  🇰🇷 Coreia    [1] — [1] 🇨🇿 Tchéq │
│  ...                                │
└─────────────────────────────────────┘
```

### BracketView

Cards empilhados por rodada (mobile-first):

```
┌─────────────────────────────────────┐
│ OITAVAS DE FINAL                    │
│  🇲🇽 México  vs  🇪🇸 Espanha        │
│  🇧🇷 Brasil  vs  🇫🇷 França         │
│  ...                                │
│                                     │
│ QUARTAS DE FINAL                    │
│  ?  vs  ?                           │
│  ...                                │
└─────────────────────────────────────┘
```

---

## Testes

- **Engine:** TDD red-green para cada função. 100% de cobertura em `src/engine/`.
- **MatchRow:** teste de unidade — renderiza inputs com valores corretos, dispara callback no onChange.
- **GroupTable:** teste de integração — standings derivados corretamente dos scores.
- **BracketView:** teste de snapshot — renderiza `"?"` para slots não definidos.

---

## Fora do Escopo desta Fase

- Rodadas subsequentes do bracket além de `roundOf32` (Fase 3)
- E2E tests (Fase 3)
- Compartilhamento / stats da comunidade (Fase 4)
- Integração com football-data.org (Fase 4)
