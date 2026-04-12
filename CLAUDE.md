# World Cup Predictor 2026 — CLAUDE.md

Contexto completo do projeto para sessões futuras.

---

## O Projeto

Simulador interativo da Copa do Mundo 2026. O usuário preenche placares da fase de grupos, o motor de regras FIFA classifica automaticamente as seleções (com todos os critérios de desempate oficiais), e o bracket eliminatório é gerado e atualizado em tempo real.

**Foco central:** precisão matemática dos critérios FIFA + UX mobile-first + código testável via TDD.

---

## Stack Final

| Camada | Tecnologia | Notas |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript | useActionState, useOptimistic disponíveis |
| UI | Shadcn/UI + Tailwind | cssVariables: true, OKLCH color format |
| Estado global | Zustand (slices + persist middleware) | persist → LocalStorage key: `wcp2026-state` |
| Data fetching | TanStack Query v5 | staleTime 5min, refetchOnWindowFocus: false |
| ORM | Drizzle ORM + @libsql/client (Turso) | Apenas Fase 4 |
| Testes unitários | Vitest | watchTriggerPatterns configurado |
| Testes E2E | Playwright + CT experimental | |
| Deploy | Vercel | CI/CD via GitHub Actions |

---

## Decisões de Design (não alterar sem consultar o usuário)

- **Autenticação:** sem auth no MVP — brackets salvos apenas via LocalStorage
- **Layout:** Sidebar + Content (grupos listados na sidebar, tabela/bracket no conteúdo principal)
- **Bracket:** Cards por Rodada (mobile-first) — uma seção por fase eliminatória (Oitavas, Quartas, Semi, Final)
- **Tema:** Dark Dourado/Troféu — fundo preto `#0c0a00`, acentos dourados `#f59e0b`, texto claro `#fef3c7`
- **Arquitetura de estado:** Zustand + TanStack Query (não usar Context API ou Redux)

---

## API Externa — football-data.org

- **Tier:** Gratuito — **limite de 10 requisições por minuto**
- **Variável de ambiente:** `VITE_FOOTBALL_API_KEY` em `.env.local` (nunca commitar)
- **Estratégia obrigatória:** sempre usar TanStack Query com `staleTime: 5 * 60 * 1000` e `refetchOnWindowFocus: false`
- **Uso:** dados de confronto histórico (H2H) exibidos no bracket — feature nice-to-have

---

## Arquitetura de Pastas

```
src/
├── engine/          ← Lógica pura FIFA (zero React, 100% testável via TDD)
│   ├── classifier.ts
│   ├── tiebreaker.ts
│   └── bracket-generator.ts
├── store/
│   ├── tournament.slice.ts
│   ├── ui.slice.ts
│   └── index.ts     ← createStore com persist
├── hooks/
│   ├── useH2H.ts    ← TanStack Query → football-data.org
│   └── useCommunityStats.ts  ← Fase 4
├── components/
│   ├── layout/      ← AppShell, Sidebar, ContentArea
│   ├── groups/      ← GroupTable, MatchRow, StandingsRow
│   ├── bracket/     ← BracketView, RoundSection, MatchCard
│   └── share/       ← ShareCard (Fase 4)
├── data/
│   └── wc2026.ts    ← 48 seleções, 12 grupos, fixtures oficiais FIFA 2026
└── lib/
    └── query-client.ts  ← TanStack Query config
```

---

## Princípios de Engenharia

- **`engine/` isolado:** zero dependências de React. Pode ser testado sem montar componentes.
- **TDD obrigatório no engine:** testes escritos antes da implementação. Usar skill `superpowers:test-driven-development`.
- **MatchRow recebe callbacks via props:** não acessa o store Zustand diretamente — facilita testes.
- **BracketView é derivado:** sem lógica própria, apenas renderiza o que o engine calculou.
- **SOLID / DRY / KISS / YAGNI:** não implementar features complexas antes do necessário.

---

## Fases de Desenvolvimento

### Fase 1 — Fundação & Motor FIFA (TDD)
- Scaffold do projeto, instalação de dependências
- `src/data/wc2026.ts` com os 48 times e grupos oficiais
- TDD: `classifier.ts` → `tiebreaker.ts` → `bracket-generator.ts`
- Meta: 100% de cobertura no `engine/`
- **Critério de saída:** `vitest run --coverage` verde

### Fase 2 — Interface Reativa
- Store Zustand + TanStack Query client
- AppShell + Sidebar + GroupTable + BracketView
- Fluxo completo: digitar placar → tabela atualiza → bracket reflete
- **Critério de saída:** fluxo completo funcional no browser

### Fase 3 — E2E & Estabilidade
- `e2e/full-flow.spec.ts`: Grupo A completo → bracket → final
- GitHub Actions: vitest → playwright → build
- Deploy Vercel (preview)
- **Critério de saída:** CI verde

### Fase 4 — Social & Comunidade (nice-to-have)
- ShareCard (imagem do bracket via html-to-image)
- Vercel Edge Function + Turso: stats anônimas da comunidade
- SEO / Open Graph
- **Critério de saída:** compartilhamento funcionando no deploy

---

## Comandos Relevantes (preencher após scaffold)

```bash
npm run dev          # dev server
npm run build        # build de produção
npm run test         # vitest
npm run test:e2e     # playwright
npm run coverage     # vitest com cobertura
```

---

## Skills Úteis Durante o Desenvolvimento

- `superpowers:test-driven-development` — Fase 1, para cada arquivo do engine
- `superpowers:verification-before-completion` — antes de marcar cada fase como concluída
- `superpowers:dispatching-parallel-agents` — para componentes UI independentes em paralelo (Fase 2)
- `superpowers:requesting-code-review` — ao final de cada fase
- `superpowers:systematic-debugging` — quando critérios de desempate FIFA derem resultados inesperados

---

## Git — Fluxo de Trabalho

- **Criar uma branch nova por funcionalidade** antes de começar qualquer implementação
- Padrão de nome de branch: `feat/<nome-da-feature>` (ex: `feat/engine-classifier`, `feat/group-table-ui`)
- **Commit ao final de cada funcionalidade concluída** — nunca acumular mudanças grandes
- Padrão de mensagem de commit: convencional (`feat:`, `fix:`, `test:`, `chore:`)
- Branch `main` recebe apenas via merge de feature branches

---

## Contexto Adicional

- Os grupos e fixtures da Copa 2026 já foram anunciados pela FIFA — usar dados reais
- O torneio tem 48 seleções, 12 grupos de 4 times, 3 times classificam por grupo (os 2 primeiros + os melhores terceiros)
- O bracket segue as chaves pré-definidas pela FIFA para 2026 (não sorteio pós-grupos)
