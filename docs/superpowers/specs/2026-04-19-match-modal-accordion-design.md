# MatchModal — Accordion Design

**Data:** 2026-04-19  
**Status:** aprovado

## Problema

O modal de placares abre mostrando apenas 1 jogo. Ao clicar `+` pela primeira vez num jogo sem placar, o auto-advance é disparado imediatamente (porque `wasUnset` é verdadeiro desde o primeiro toque), revelando e expandindo o próximo jogo antes do usuário terminar. O resultado é um fluxo quebrado: jogos fecham sozinhos, o usuário perde o contexto.

**Causa raiz:** `handleScoreChange` checa `scores[matchId] === undefined` e avança assim que qualquer score é setado — incluindo 0×0 → 1×0 no primeiro clique.

## Solução — Accordion Puro (Opção A)

Todos os 6 jogos do grupo ficam visíveis desde o início, colapsados. O usuário controla qual está aberto. Um jogo por vez pode estar expandido.

## Estado

**Removido:**
- `revealedCount` — eliminado completamente
- `useEffect` de sync do `revealedCount` — eliminado completamente
- Lógica `wasUnset` em `handleScoreChange` — eliminada

**Mantido:**
- `expandedIndex: number` — índice do jogo aberto, ou `-1` se nenhum

**Valor inicial de `expandedIndex`:**
- Primeiro jogo sem placar → seu índice
- Todos preenchidos → `-1` (todos colapsados)

## Comportamento

**Clicar no header de um jogo colapsado:** abre esse jogo, fecha o anterior (`setExpandedIndex(idx)`)  
**Clicar no header do jogo aberto:** fecha ele (`setExpandedIndex(-1)`)  
**Mudar placar:** apenas `setScore(matchId, home, away)` — sem efeito colateral de navegação

## Renderização

Cada jogo tem dois estados visuais:

**Colapsado:**
- Linha horizontal clicável: `flag + código · score · código + flag`
- Com placar: exibe `X × Y` + ✓ verde no final (comportamento compact atual)
- Sem placar: exibe `– × –` + `›` chevron no final

**Expandido:**
- Layout atual com steppers, sem mudança visual
- Header da linha com fundo `wcp-primary-faint` ou borda `wcp-primary` indicando que está ativo

**Implementação em `MatchRow`:**
- O ícone de ✓ vs `›` é decidido internamente em `compact` com base em `homeScore !== undefined`
- Nenhuma nova prop necessária além das existentes

## Testes

**`MatchModal.test.tsx`:**
- Remover: testes de revelação progressiva (segundo jogo aparece ao preencher o primeiro)
- Adicionar: ao abrir o modal, todos os jogos estão visíveis; o primeiro sem placar está expandido
- Adicionar: clicar no header de um jogo fechado o abre e fecha o anterior
- Adicionar: clicar no header do jogo aberto o fecha
- Manter: `filledCount/fixtures.length` continua correto

**`MatchRow.test.tsx`:**
- Adicionar: compact sem placar mostra `– × –` e chevron `›`
- Manter: compact com placar mostra score e ✓

**E2E (Playwright):**
- Auditar testes que dependem de revelação progressiva e atualizar para fluxo de accordion

## Arquivos afetados

- `src/components/groups/MatchModal.tsx`
- `src/components/groups/MatchRow.tsx`
- `src/components/groups/MatchModal.test.tsx`
- `src/components/groups/MatchRow.test.tsx`
- `e2e/` — auditar testes relevantes
