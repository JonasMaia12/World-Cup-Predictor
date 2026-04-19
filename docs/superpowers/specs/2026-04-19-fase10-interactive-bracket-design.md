# Fase 10 — Interactive Bracket

**Data:** 2026-04-19  
**Status:** Aprovado

---

## Visão Geral

Tornar o bracket eliminatório totalmente interactivo: atualiza-se conforme os grupos são preenchidos, o utilizador entra resultados nos jogos eliminatórios, vencedores avançam automaticamente, campeão é exibido em destaque. O link de partilha já suporta tudo sem alterações.

Novas features adicionais:
- Botão "Limpar tudo" (reset global)
- Modo "só o vencedor" em jogos eliminatórios (simula placar via Poisson)
- "Definir classificação do grupo" (o utilizador escolhe 1.º/2.º/3.º → engine simula placares consistentes)

---

## Contexto FIFA 2026

- 48 seleções, 12 grupos de 4
- Classificam: 2 primeiros de cada grupo (24) + **8 melhores terceiros** dos 12 grupos = **32 equipas**
- O pool de terceiros é limitado a 8 no total — a UI bloqueia a selecção do 9.º
- Bracket eliminatório: Round of 32 → R16 → Quartas → Semis → Final + 3.º/4.º lugar

---

## Arquitectura

### Decisão central: ScoreMap unificado

Um único `ScoreMap` (`Record<string, { home: number; away: number }>`) cobre:
- Jogos de grupo: IDs `A1`, `A2`, … `L6`
- Jogos eliminatórios: IDs `r32-1`…`r32-16`, `r16-1`…`r16-8`, `qf-1`…`qf-4`, `sf-1`…`sf-2`, `final`, `3rd`

Os IDs nunca colidem. Sem novos tipos, sem novos campos no store.

O bracket continua **sempre derivado no render** — nunca armazenado no store (princípio do CLAUDE.md mantido).

---

## Engine (src/engine/)

### `bracket-generator.ts` — extensão

**Assinatura actualizada:**
```ts
export function generateBracket(
  standings: GroupStandings,
  scores?: ScoreMap,   // default {}
): Bracket
```

**Propagação de vencedores (cascata):**
```
r32[0..15] → r16[0..7]   : winner(r32[i*2]) → r16[i].home ; winner(r32[i*2+1]) → r16[i].away
r16[0..7]  → qf[0..3]    : winner(r16[i*2]) → qf[i].home  ; winner(r16[i*2+1]) → qf[i].away
qf[0..3]   → sf[0..1]    : winner(qf[i*2])  → sf[i].home  ; winner(qf[i*2+1])  → sf[i].away
sf[0..1]   → final        : winner(sf[0]) → final.home ; winner(sf[1]) → final.away
sf[0..1]   → thirdPlace   : loser(sf[0])  → thirdPlace.home ; loser(sf[1]) → thirdPlace.away
```

Se `scores[matchId]` não existe ou é empate → slot seguinte = `null` (propagação para).

**Retrocompatibilidade:** chamadas sem `scores` continuam a funcionar (sem propagação).

### Nova função `advanceWinner`
```ts
export function advanceWinner(matchId: string, scores: ScoreMap): string | null
```
Devolve o código da equipa vencedora, ou `null` se sem score ou empate. Usada internamente no bracket-generator e pela UI para derivar o campeão (`advanceWinner('final', scores)`).

### Nova função `generateGroupScoresForOrder`
```ts
export function generateGroupScoresForOrder(
  orderedTeams: string[],   // [1st, 2nd, 3rd, 4th]
  fixtures: Match[],        // só os jogos deste grupo
  teams: Team[],
): ScoreMap
```
Gera placares via Poisson que produzem os standings na ordem pedida:
- Para cada par de equipas, força o vencedor conforme a hierarquia (quem está mais acima na lista ganha)
- O placar específico é simulado com Poisson (mínimo 1-0, nunca empate entre equipas de posições diferentes)
- Empates só permitidos entre equipas da mesma posição (não aplicável — todos têm posição distinta)

### Extensão de `simulateKnockoutMatch` em `simulator.ts`
```ts
export function simulateKnockoutMatch(
  homeCode: string,
  awayCode: string,
  teams: Team[],
  forcedWinner?: string,   // code da equipa que deve vencer
): { home: number; away: number }
```
- Se `forcedWinner` definido: simula via Poisson até winner correcto (máx. 20 tentativas)
- Fallback após 20 tentativas sem resultado: `forcedWinner === homeCode ? { home: 1, away: 0 } : { home: 0, away: 1 }`
- Empate nunca é devolvido

---

## Store (src/store/tournament.slice.ts)

### Acções novas

| Acção | Assinatura | Comportamento |
|---|---|---|
| `resetAll` | `() => void` | Limpa todo o ScoreMap (grupo + eliminatória) e `thirdQualifiers`. Substitui semanticamente `resetScores`. |
| `simulateKnockoutWinner` | `(matchId: string, winnerCode: string) => void` | Chama `simulateKnockoutMatch` com `forcedWinner` e faz `setScore`. |
| `pickGroupOrder` | `(groupId: string, orderedTeams: string[]) => void` | Chama `generateGroupScoresForOrder`, faz `setScores` para os jogos do grupo (sobrescreve existentes). |
| `addThirdQualifier` | `(groupId: string) => void` | Adiciona grupo ao pool de terceiros (no-op se já 8 ou já presente). |
| `removeThirdQualifier` | `(groupId: string) => void` | Remove grupo do pool de terceiros. |

### Acções que ficam iguais
`setScore`, `setScores`, `clearScore`, `simulateMissing` — sem alterações.

### Pool de 3.os — estado explícito no store
O utilizador selecciona explicitamente quais grupos têm o 3.º classificado no pool de qualificados. Máximo 8 (pois só 8 terceiros avançam no FIFA 2026).

Novo campo no store: `thirdQualifiers: string[]` — lista de group IDs (ex: `['A', 'C', 'F', ...]`), máximo 8 entradas.

Novas acções:
- `addThirdQualifier(groupId)` — adiciona ao pool (bloqueado se já 8)
- `removeThirdQualifier(groupId)` — remove do pool

O `generateBracket` usa os `thirdQualifiers` para preencher os slots de 3.º lugar no Round of 32:
- Se `thirdQualifiers.length > 0`: usa os 3.os classificados desses grupos (ordenados por pontos/GD/GF entre si para atribuir os 8 slots)
- Se `thirdQualifiers` vazio (utilizador não usou `GroupPositionPicker`): fallback para `selectBest3rds(standings)` — comportamento actual

---

## Componentes UI (src/components/)

### `bracket/KnockoutMatchModal.tsx` (novo)

Abre ao clicar num `MatchCard` do bracket.

**Estrutura:**
- Cabeçalho: ronda + ID da partida (ex: "Quartas de Final · QF-3")
- Se algum slot é `null`: mostra "Aguarda resultado anterior", sem interacção
- Toggle de modo:
  - **Placar exato** — stepper +/− (igual ao MatchRow). Empate bloqueia confirmação: borda vermelha + "Defina um vencedor"
  - **Só o vencedor** — dois botões grandes (um por equipa). Clicar chama `simulateKnockoutWinner` e fecha o modal
- Botão "Limpar placar" — chama `clearScore(matchId)`. Visível apenas se score existir.

### `groups/GroupPositionPicker.tsx` (novo)

Sub-painel acessível via botão **"🏆 Definir classificação"** no header do MatchModal de cada grupo.

**Estrutura:**
- Lista das 4 equipas do grupo com botões ↑↓ para reordenar
- Toggle no 3.º lugar: **"Qualifica"** (verde, chama `addThirdQualifier`) / **"Não qualifica"** (cinza, chama `removeThirdQualifier`)
  - Se pool de 8 já completo por outros grupos: toggle desactivado + tooltip "Pool de 8 terceiros completo (remove outro para substituir)"
- Botão **"Simular com esta ordem"** — chama `pickGroupOrder(groupId, orderedTeams)`
- Botão "Cancelar" — fecha sem alterar

### Banner de Campeão (em `bracket/BracketView.tsx`)

Renderizado acima do bracket quando `champion !== null`:

```
🏆  [flag] [código]  É o Campeão do Mundo!
```

- Card com `border-2 border-wcp-primary bg-wcp-surface-subtle`
- `data-testid="champion-banner"`
- Desaparece automaticamente se o resultado da final for limpo

### Botão "Limpar tudo" (em `layout/AppShell.tsx`)

- Posição: à esquerda do "🎲 Simular" no header
- Estilo: `border border-red-300 text-red-400` (outline suave)
- Ao clicar: dialog de confirmação nativo (`window.confirm`) — "Tens a certeza? Todos os resultados serão apagados."
- Confirmar → `resetAll()`

---

## Share Link (src/lib/share.ts)

**Sem alterações.** O ScoreMap unificado já contém tudo. `encodeState`/`decodeState` continuam a funcionar — links antigos (só scores de grupo) desserializam correctamente por retrocompatibilidade.

---

## Regras de Validação

| Contexto | Regra |
|---|---|
| Jogo eliminatório — placar exato | Empate = inválido. Botão de confirmação desactivado + feedback visual. |
| Jogo eliminatório — slot null | Modal mostra aviso, sem interacção disponível. |
| Pool de 3.os | Máximo 8 grupos com 3.º "qualificado". 9.º bloqueado na UI. |
| `generateGroupScoresForOrder` | Sempre produz standings na ordem pedida — garantido pelo design da função. |

---

## Testes

### Engine (Vitest — TDD obrigatório)

| Ficheiro | Casos |
|---|---|
| `bracket-generator.test.ts` | Propaga vencedores r32→r16→qf→sf→final; empate = null; campeão derivado; sem scores = sem propagação; retrocompatibilidade sem 2.º argumento |
| `simulator.test.ts` (extensão) | `simulateKnockoutMatch` com winner forçado nunca empata; fallback 1-0 activa; sem winner forçado simula livremente |
| `group-position.test.ts` (novo) | `generateGroupScoresForOrder` — standings resultantes batem com ordem; permutações de 4 equipas |

### Store (Vitest)

| Ficheiro | Casos |
|---|---|
| `tournament.slice.test.ts` (extensão) | `resetAll` limpa tudo; `simulateKnockoutWinner` grava score sem empate; `pickGroupOrder` sobrescreve só jogos do grupo |

### Componentes (RTL)

| Componente | Casos |
|---|---|
| `KnockoutMatchModal` | Abre ao clicar card; stepper bloqueia empate; "só vencedor" chama `simulateKnockoutWinner`; "Limpar placar" chama `clearScore`; null slot mostra aviso |
| `GroupPositionPicker` | ↑↓ reordena; simular chama `pickGroupOrder`; pool de 8 bloqueia 9.º; cancelar não altera |
| `AppShell` | "Limpar tudo" abre confirmação; confirmar chama `resetAll`; cancelar não altera |
| `BracketView` | Banner campeão visível quando final resolvida; banner oculto sem score da final |

### Meta
Actualmente: **79 testes**. Estimativa Fase 10: **~110–120 testes**.

---

## Fora de Âmbito (Fase 10)

- Placar ao vivo via football-data.org (Fase futura — pós Copa 2026)
- Acertômetro / comparação de previsões (Fase futura — pós Copa 2026)
- Autenticação ou persistência remota
