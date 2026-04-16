# World Cup Predictor 2026 — CLAUDE.md

Simulador interativo da Copa do Mundo 2026: placares da fase de grupos → classificação FIFA automática → bracket eliminatório em tempo real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| UI | Shadcn/UI + Tailwind (cssVariables, OKLCH) |
| Estado | Zustand + persist (`wcp2026-state` → LocalStorage) |
| Data fetching | TanStack Query v5 (staleTime 5min, refetchOnWindowFocus: false) |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Deploy | GitHub Pages + GitHub Actions |
| ORM (Fase 4) | Drizzle ORM + @libsql/client (Turso) |

---

## Decisões de Design

- Sem auth no MVP — brackets salvos via LocalStorage
- Layout: Sidebar (grupos + Bracket) + ContentArea
- Bracket: cards por rodada, mobile-first (Oitavas → Final)
- Tema: fundo `#0c0a00`, ouro `#f59e0b`, texto `#fef3c7`
- Estado: Zustand + TanStack Query — sem Context API ou Redux

---

## API Externa — football-data.org

- Tier gratuito: **10 req/min** — sempre usar `staleTime: 5 * 60 * 1000`
- Chave: `VITE_FOOTBALL_API_KEY` em `.env.local` (nunca commitar)

---

## Arquitetura de Pastas

```
src/
├── engine/        ← Lógica FIFA pura (zero React, TDD)
├── store/         ← Zustand slices (tournament + ui) + persist
├── hooks/         ← useH2H (TanStack Query), useCommunityStats (Fase 4)
├── components/
│   ├── layout/    ← AppShell, Sidebar, ContentArea
│   ├── groups/    ← GroupTable, MatchRow
│   ├── bracket/   ← BracketView
│   └── share/     ← ShareCard (Fase 4)
├── data/          ← wc2026.ts (48 times, 12 grupos, fixtures FIFA 2026)
└── lib/           ← query-client.ts
```

---

## Princípios de Engenharia

- `engine/` sem dependências React — testável puro
- TDD obrigatório no engine (`superpowers:test-driven-development`)
- MatchRow props-only — sem acesso direto ao store
- Standings e bracket sempre derivados no render — nunca armazenados
- SOLID / DRY / KISS / YAGNI

---

## Status das Fases

- ✅ **Fase 1** — Engine FIFA (classifier, tiebreaker, bracket-generator) com TDD, ≥90% cobertura
- ✅ **Fase 2** — UI reativa: GroupTable, MatchRow, BracketView, Sidebar, ContentArea — 23 testes, build limpo
- ✅ **Fase 3** — E2E & Estabilidade (Playwright 4 testes, CI verde, deploy GitHub Pages)
- 🔲 **Fase 4** — Social (ShareCard, Turso stats, SEO/OG) ← **PRÓXIMA**

---

## Comandos

```bash
npm run dev          # dev server
npm run build        # build de produção
npm run test         # vitest
npm run test:e2e     # playwright
npm run coverage     # vitest com cobertura
```

---

## Git — Fluxo de Trabalho

**GitHub Flow + Squash Merge.** `main` sempre deployável. Cada feature vira 1 commit limpo.

```bash
# 1. Branch nova a partir do main atualizado
git checkout main && git pull origin main
git checkout -b feat/<nome>
git push -u origin feat/<nome>

# 2. Desenvolver com commits incrementais
git add <arquivos>
git commit -m "feat: descrição"
git push                                 # CI roda a cada push

# 3. Abrir PR
gh pr create --title "feat: descrição" --body "## Summary\n- ...\n\n## Test Plan\n- [ ] ..."

# 4. Code review automatizado com @claude
gh pr comment <número> --body "@claude please review this PR"
# Monitorar novos comentários do PR (polling):
#   gh pr view <número> --json comments --jq '.comments[-1].body'
# Quando review chegar: ler, ajustar código, push, chamar @claude novamente
# Repetir até @claude aprovar

# 5. Após aprovação: Squash and Merge no GitHub
# → GitHub deleta a branch automaticamente
```

- Branches: `feat/`, `fix/`, `chore/`
- Commits: convencional — `feat:`, `fix:`, `test:`, `chore:`, `docs:`
- **Nunca commitar direto na `main`** — sempre via PR
- Merge strategy: **Squash and Merge** (nunca merge commit ou rebase)
- **Code review obrigatório via `@claude`** antes de mergear — ciclo iterativo até aprovação

---

## Deploy

- **URL produção:** https://jonasmaia12.github.io/World-Cup-Predictor/
- Todo push na `main` dispara `.github/workflows/deploy.yml` automaticamente
- CI (`.github/workflows/ci.yml`) roda em todo push e PR — vitest → playwright → build

---

## Limpeza de Docs de Planejamento

Apagar após cada fase concluída: `docs/specs/` e `docs/plans/`. Se houver decisão relevante não capturada aqui, resumir no CLAUDE.md antes de deletar.

---

## Contexto FIFA 2026

- 48 seleções, 12 grupos de 4 — classificam os 2 primeiros + 8 melhores terceiros = 32 times
- Bracket com chaves pré-definidas pela FIFA (não sorteio pós-grupos)
- Critérios de desempate: H2H pts → H2H GD → H2H GF → GD geral → GF geral → ordem do sorteio
