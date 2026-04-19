# Fase 9 — Simulador Automático + Reset por Partida + Info de Jogo

**Data:** 2026-04-19  
**Status:** Aprovado

---

## Escopo

Três sub-features implementadas no mesmo PR:

1. **Simulação automática** — botão "🎲 Simular" preenche apenas os jogos ainda em branco com placares aleatórios ponderados por ranking FIFA (Poisson).
2. **Reset por partida** — ✕ no compact row e "Limpar" no accordion expandido removem o placar de um jogo específico, tornando-o "em branco" novamente.
3. **Info de jogo** — data, horário (timezone local do browser automático) e sede exibidos no accordion expandido de cada partida.

---

## Dados — `src/data/wc2026.ts`

### `Team` — adicionar `rank: number`

Ranking FIFA de abril de 2026 para as 48 seleções. Usado exclusivamente pelo engine de simulação.

```ts
export interface Team {
  code: string
  name: string
  flag: string
  group: string
  rank: number  // ← novo
}
```

### `Match` — adicionar `date` e `venue`

```ts
export interface Match {
  id: string
  group: string
  homeTeam: string
  awayTeam: string
  stage: 'group'
  date: string   // ← novo — ISO 8601 UTC, ex: "2026-06-11T23:00:00Z"
  venue: string  // ← novo — ex: "SoFi Stadium, Los Angeles"
}
```

O array `FIXTURES` deixa de ser gerado via `flatMap` automático e passa a ser hardcoded com os 72 jogos reais da fase de grupos, cada um com `date` e `venue` corretos conforme o calendário oficial FIFA 2026.

### Horário no browser

Formatação automática via API nativa — sem biblioteca:

```ts
new Date(match.date).toLocaleString(undefined, {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateStyle: 'short',
  timeStyle: 'short',
})
```

`undefined` como locale usa o locale do browser (PT para Portugal, pt-BR para Brasil, etc.).

---

## Engine — `src/engine/simulator.ts` (arquivo novo)

Módulo puro, zero React, 100% TDD.

### `poissonRandom(lambda: number): number`

Gera um inteiro aleatório seguindo distribuição de Poisson com parâmetro `lambda`. Algoritmo de Knuth (iterativo, adequado para λ ≤ 30).

### `simulateMatch(homeRank: number, awayRank: number): { home: number; away: number }`

Calcula λ para cada time:

```
λ_base = 1.35
fator  = (rankAdversário / rankPróprio) ^ 0.4
λ_home = λ_base * fator_home * 1.1   // leve vantagem de mandante
λ_away = λ_base * fator_away
```

Retorna `{ home: poissonRandom(λ_home), away: poissonRandom(λ_away) }`.

O expoente `0.4` suaviza a diferença de ranking — favoritos ganham mais vezes, mas surpresas são possíveis. `1.1` é a vantagem histórica do mandante em Copas.

### `simulateMissingMatches(fixtures: Match[], scores: ScoreMap, teams: Team[]): ScoreMap`

- Itera os 72 fixtures
- Pula os que já existem em `scores`
- Chama `simulateMatch` para os em branco
- Retorna `ScoreMap` com os resultados novos **merged** sobre os existentes (não sobrescreve os preenchidos pelo usuário)

---

## Store — `src/store/tournament.slice.ts`

Dois novos actions:

```ts
clearScore: (matchId: string) => void
simulateMissing: () => void
```

**`clearScore`** — deleta `scores[matchId]` do estado (torna o jogo undefined novamente):

```ts
clearScore: (matchId) =>
  set((state) => {
    const { [matchId]: _, ...rest } = state.scores
    return { scores: rest }
  }),
```

**`simulateMissing`** — lê `scores` atual, chama `simulateMissingMatches`, faz merge via `setScores`:

```ts
simulateMissing: () =>
  set((state) => ({
    scores: simulateMissingMatches(FIXTURES, state.scores, TEAMS),
  })),
```

---

## UI

### Botão "🎲 Simular" — `AppShell.tsx`

Adicionado ao header, à esquerda do botão "Compartilhar". Estilo secundário (outline), mesmo tamanho. Chama `simulateMissing` do store.

```
[Logo]                    [🎲 Simular]  [↗ Compartilhar]
```

Sem modal de confirmação — a ação é reversível (usuário pode limpar scores individualmente ou via reset geral já existente).

### Reset compact — `MatchRow.tsx` (modo compact)

Quando `homeScore !== undefined`, exibir um `✕` pequeno no canto direito do row, antes do indicador `✓`. Ao clicar, chama `onClearScore(matchId)` (nova prop).

A prop `onClearScore` é opcional (`onClearScore?: (matchId: string) => void`) — quando ausente, o ✕ não renderiza. Isso mantém MatchRow props-only e sem acesso direto ao store.

### Reset expandido — `MatchModal.tsx`

No accordion expandido, abaixo do `MatchRow`, exibir link "Limpar placar" em `text-wcp-muted text-xs` apenas quando o jogo tem score. Ao clicar, chama `clearScore(matchId)` do store e colapsa o accordion (volta para compact).

### Info de jogo — accordion expandido

No collapse header (que já mostra os times), adicionar abaixo:

```
📅 11 jun · 20:00  |  🏟 SoFi Stadium, Los Angeles
```

Renderizado com `new Date(match.date).toLocaleString(...)` automático.

---

## Testes

### `src/engine/simulator.test.ts` (novo)

- `poissonRandom`: com λ fixo via mock de `Math.random`, verifica output determinístico
- `simulateMatch`: favorito (rank 5) vs azarão (rank 150) — rodar N=1000 vezes, verificar que favorito vence >55% (propriedade estatística)
- `simulateMissingMatches`: scores parcialmente preenchidos → só os em branco são simulados; scores existentes preservados

### `src/store/tournament.slice.test.ts` (atualizar)

- `clearScore`: score existente é removido, outros preservados
- `simulateMissing`: scores em branco são preenchidos, scores existentes preservados

### `src/components/groups/MatchRow.test.tsx` (atualizar)

- ✕ não aparece quando `homeScore === undefined`
- ✕ aparece e chama `onClearScore` quando score está definido

---

## Arquivos afetados

| Arquivo | Operação |
|---|---|
| `src/data/wc2026.ts` | Atualizar — `rank` em Team, `date`+`venue` em Match, FIXTURES hardcoded |
| `src/engine/simulator.ts` | Criar |
| `src/engine/simulator.test.ts` | Criar |
| `src/store/tournament.slice.ts` | Atualizar — `clearScore` + `simulateMissing` |
| `src/store/tournament.slice.test.ts` | Atualizar |
| `src/components/layout/AppShell.tsx` | Atualizar — botão Simular |
| `src/components/groups/MatchRow.tsx` | Atualizar — ✕ + `onClearScore` prop + info de jogo |
| `src/components/groups/MatchRow.test.tsx` | Atualizar |
| `src/components/groups/MatchModal.tsx` | Atualizar — "Limpar placar" + info de jogo |

---

## Fora de escopo

- Simular torneio eliminatório (bracket)
- Histórico de simulações
- Seed reproduzível (botão "repetir simulação")
- Export da simulação como imagem
