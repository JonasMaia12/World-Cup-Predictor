# Design: Cascade Knockout + E2E Tests Completos

**Data:** 2026-04-25  
**Estado:** Aprovado

---

## Contexto

### Tech Debt

Quando um score de grupo muda (via stepper, `clearScore`, ou `pickGroupOrder`), as standings do grupo podem mudar. Isso altera quais equipas estão nos slots r32 do bracket. No entanto, os scores knockout (`r32-*`, `r16-*`, `qf-*`, `sf-*`, `final`, `3rd`) continuam no store com valores antigos aplicados às novas equipas — criando vencedores propagados erroneamente.

### E2E Gap

Os testes E2E actuais cobrem apenas 3 grupos + slots r32 + share básico. Não existe teste de jornada completa (todos os grupos → bracket → campeão → share) nem testes adversariais para casos de stress.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Cascata de knockout | B2: só se standings mudarem | Evita limpar knockout quando o utilizador apenas ajusta margem de vitória |
| Scope da cascata | Downstream afectados apenas | Preserva scores de partes do bracket não relacionadas |
| Localização da lógica | Engine puro (`cascade.ts`) | Testável sem React; alinha com princípio `engine/` |
| E2E grupos | 2-3 manuais + resto via localStorage | CI rápido; UI real nos grupos críticos |
| E2E organização | 2 ficheiros separados + `helpers.ts` | Separação clara; falhas isoláveis |

---

## Part 1 — Engine: `src/engine/cascade.ts`

### Assinatura

```typescript
export function cascadeClearKnockout(
  groupId: string,
  oldStandings: Standing[],
  newStandings: Standing[],
  allNewStandings: GroupStandings,
  scores: ScoreMap,
  thirdQualifiers: string[],
): ScoreMap
```

### Algoritmo

**Fase 1 — Detectar slots r32 afectados**

- Comparar `oldStandings[0].teamCode` vs `newStandings[0].teamCode` → se diferente, o slot `1{groupId}` mudou
- Comparar `oldStandings[1].teamCode` vs `newStandings[1].teamCode` → se diferente, o slot `2{groupId}` mudou
- Comparar `oldStandings[2]?.teamCode` vs `newStandings[2]?.teamCode` → se diferente, recalcular ranking dos 8 melhores 3.os com `allNewStandings` e verificar se algum `3-N` slot mudou de equipa (afecta r32-9 a r32-16)

**Fase 2 — Mapa de dependências (estático)**

```
GROUP → R32 slots (a partir do ROUND_OF_32_TEMPLATE):
  A: slot 1A → r32-1 (home),  slot 2A → r32-2 (away)
  B: slot 2B → r32-1 (away),  slot 1B → r32-2 (home)
  C: slot 1C → r32-3 (home),  slot 2C → r32-4 (away)
  D: slot 2D → r32-3 (away),  slot 1D → r32-4 (home)
  E: slot 1E → r32-5 (home),  slot 2E → r32-6 (away)
  F: slot 2F → r32-5 (away),  slot 1F → r32-6 (home)
  G: slot 1G → r32-7 (home),  slot 2G → r32-8 (away)
  H: slot 2H → r32-7 (away),  slot 1H → r32-8 (home)
  I: slot 1I → r32-9 (home),  slot 2I → r32-13 (home)
  J: slot 1J → r32-10 (home), slot 2J → r32-14 (home)
  K: slot 1K → r32-11 (home), slot 2K → r32-15 (home)
  L: slot 1L → r32-12 (home), slot 2L → r32-16 (home)
  3rd slots: 3-1..3-8 → r32-9 (away)..r32-16 (away)

R32 → R16:
  r16-1: [r32-1,  r32-2]
  r16-2: [r32-3,  r32-4]
  r16-3: [r32-5,  r32-6]
  r16-4: [r32-7,  r32-8]
  r16-5: [r32-9,  r32-10]
  r16-6: [r32-11, r32-12]
  r16-7: [r32-13, r32-14]
  r16-8: [r32-15, r32-16]

R16 → QF:
  qf-1: [r16-1, r16-2]
  qf-2: [r16-3, r16-4]
  qf-3: [r16-5, r16-6]
  qf-4: [r16-7, r16-8]

QF → SF:
  sf-1: [qf-1, qf-2]
  sf-2: [qf-3, qf-4]

SF → Final/3rd:
  final: [sf-1, sf-2]
  3rd:   [sf-1, sf-2]
```

**Fase 3 — Propagar afectados**

BFS/iteração sobre o grafo: se qualquer pai está no set de afectados → filho entra no set.

**Fase 4 — Retornar ScoreMap limpo**

Remover do `scores` todas as chaves knockout que estão no set de afectados.

### Testes unitários (`cascade.test.ts`)

- Alterar 1.º lugar → limpa r32 afectado + downstream; intocados permanecem
- Alterar só margem (mesmo 1.º e 2.º) → sem limpeza
- Alterar 3.º lugar que sobe ranking de best-3rds → limpa r32-9..16 afectados
- Grupo sem standings (grupo vazio) → sem crash
- Todos os knockout já vazios → retorna ScoreMap inalterado

---

## Part 2 — Store: `src/store/tournament.slice.ts`

### Utilitário local

```typescript
function getGroupId(matchId: string): string | null {
  return /^[A-L]\d$/.test(matchId) ? matchId[0] : null
}
```

### Utilitários de standings necessários em `classifier.ts`

- `computeGroupStandings(groupId, fixtures, scores, teams): Standing[]` — standings de um grupo
- `computeAllStandings(fixtures, scores, teams): GroupStandings` — standings de todos os 12 grupos

Se não existirem, extrair da lógica já presente no classifier.

### `setScore` actualizado

```
1. groupId = getGroupId(matchId) — se null, aplicar score directamente (knockout)
2. oldStandings = computeGroupStandings(groupId, FIXTURES, state.scores, TEAMS)
3. newScores = { ...state.scores, [matchId]: { home, away } }
4. newStandings = computeGroupStandings(groupId, FIXTURES, newScores, TEAMS)
5. allNewStandings = computeAllStandings(FIXTURES, newScores, TEAMS)
6. cleanScores = cascadeClearKnockout(groupId, oldStandings, newStandings, allNewStandings, newScores, state.thirdQualifiers)
7. return { scores: cleanScores }
```

### `clearScore` actualizado

Mesma lógica: calcular standings com e sem o matchId removido.

### `pickGroupOrder` actualizado

Calcular `oldStandings` para o grupo antes de aplicar `generateGroupScoresForOrder`, depois cascade.

### O que NÃO muda

- `simulateKnockoutWinner` — não altera grupos
- `resetAll` / `resetScores` — já limpam tudo
- `addThirdQualifier` / `removeThirdQualifier` — não alteram scores

---

## Part 3 — E2E Tests

### `e2e/helpers.ts` (novo)

Extrair e partilhar entre os 3 ficheiros E2E:
- `openGroupModal(page, groupLetter)`
- `closeModal(page)`
- `ensureExpanded(page, matchId)`
- `fillGroupScores(page, scores)`
- `injectScores(page, scoreMap)` — via `page.evaluate` + `localStorage`

### `e2e/journey.spec.ts` (novo, `@slow`)

```
Teste único: "Jornada completa: grupos → bracket → campeão → share"

Setup: localStorage vazio

Fase 1 — Grupos:
  - Preencher Grupo A manualmente (MEX 1º, RSA 2º)
  - Preencher Grupo C manualmente (BRA 1º, MAR 2º)
  - Injectar os 10 grupos restantes via page.evaluate (ScoreMap com vencedores claros)
  - Recarregar página
  - Verificar standings de A e C nos GroupCards
  - Verificar 16 slots r32 todos com teams (sem null)

Fase 2 — Bracket:
  - r32 × 16: abrir KnockoutMatchModal, modo "Só o vencedor", escolher winner
  - r16 × 8: idem
  - qf × 4: idem
  - sf × 2: idem
  - final × 1: idem
  - Verificar banner de campeão visível

Fase 3 — Share:
  - Clicar ShareButton → aguardar "Link copiado"
  - Copiar URL do clipboard
  - Abrir nova página com URL copiada
  - Verificar score A1 restaurado
  - Verificar score r32-1 restaurado
  - Verificar banner de campeão restaurado
```

### `e2e/adversarial.spec.ts` (novo, `@slow`)

| # | Teste | Verificação |
|---|-------|-------------|
| 1 | **Cascade: alterar score de grupo pós-knockout** | Injectar grupos + r32 scores via localStorage; alterar Grupo A score; verificar r32-1 e r32-2 limpos; verificar r32-3 intacto |
| 2 | **Cascade: clearScore num jogo de grupo** | Mesma setup; clicar "Limpar placar" num jogo; verificar cascade |
| 3 | **Cascade: pickGroupOrder** | Usar GroupPositionPicker para reordenar Grupo A; verificar r32-1 e r32-2 limpos |
| 4 | **Cascade: mudança de margem sem mudar standings** | Setup: injectar Grupo A completo (MEX 1º) + r32-1 score; alterar A1 de 2-0 para 3-0 (MEX continua 1º); verificar r32-1 intacto |
| 5 | **Empate bloqueado no KnockoutMatchModal** | Abrir r32-1, definir 1-1; verificar botão "Confirmar" disabled + mensagem de erro |
| 6 | **Slot nulo no KnockoutMatchModal** | Estado vazio; abrir r32-1 (teams null); verificar "Aguarda resultado anterior" |
| 7 | **"Limpar tudo" com estado completo** | Injectar estado completo; clicar "Limpar tudo"; verificar ScoreMap vazio e bracket sem teams |
| 8 | **URL com base64 inválido** | Navegar para `/?s=!!!INVALID!!!`; verificar app carrega sem crash e estado vazio |
| 9 | **URL com JSON válido mas schema errado** | Navegar para `/?s=<base64 de {foo: "bar"}>`; verificar app funcional e estado vazio |
| 10 | **Share URL restaura knockout scores** | Injectar grupos + knockout via localStorage; share; abrir em nova página; verificar knockout scores presentes |
| 11 | **thirdQualifiers não persistem na share URL** | Adicionar 3.os qualificadores; share; nova página; verificar thirdQualifiers vazios (comportamento esperado documentado) |

### Setup dos testes adversariais

Cada teste em `adversarial.spec.ts` tem `beforeEach` com localStorage vazio e injecta o seu próprio estado mínimo necessário via `page.evaluate` + `page.reload()`. Sem dependências entre testes.

### Execução

```bash
# Só quando solicitado:
npx playwright test --grep "@slow"

# CI padrão (não inclui @slow):
npm run test:e2e
```

Os testes `@slow` são marcados com `test.slow()` e têm a tag `@slow` no nome para filtragem via grep.

---

## Ficheiros a criar/modificar

| Ficheiro | Acção |
|----------|-------|
| `src/engine/cascade.ts` | Criar |
| `src/engine/cascade.test.ts` | Criar |
| `src/store/tournament.slice.ts` | Modificar (`setScore`, `clearScore`, `pickGroupOrder`) |
| `src/store/tournament.slice.test.ts` | Adicionar testes de cascade |
| `e2e/helpers.ts` | Criar (extrair de `full-flow.spec.ts` e `share.spec.ts`) |
| `e2e/full-flow.spec.ts` | Modificar (importar helpers) |
| `e2e/share.spec.ts` | Modificar (importar helpers) |
| `e2e/journey.spec.ts` | Criar |
| `e2e/adversarial.spec.ts` | Criar |

---

## Invariantes a garantir

- `engine/cascade.ts` zero dependências React
- `cascadeClearKnockout` é pura: dado o mesmo input, retorna sempre o mesmo ScoreMap
- Standings e bracket continuam derivados no render (nunca armazenados)
- Nenhum score knockout é apagado quando a mudança de grupo não afecta 1.º, 2.º ou 3.º classificados
