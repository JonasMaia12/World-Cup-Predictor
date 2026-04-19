# World Cup Predictor 2026 — CLAUDE.md

Simulador interativo da Copa do Mundo 2026: placares da fase de grupos → classificação FIFA automática → bracket eliminatório em tempo real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| UI | Shadcn/UI + Tailwind (cssVariables, tokens `wcp-*`) |
| Estado | Zustand + persist (`wcp2026-state` → LocalStorage) |
| Data fetching | TanStack Query v5 (staleTime 5min, refetchOnWindowFocus: false) |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Deploy | GitHub Pages + GitHub Actions |

---

## Decisões de Design

- Sem auth no MVP — brackets salvos via LocalStorage
- Layout: coluna única full-width — Header → GroupGrid (cards responsivos) → Bracket
- Bracket: "espinha de peixe" convergindo para o centro (Final); mobile = minimap + cards por rodada
- Tema: **Cyber Green Light** — fundo `#f0f4f1`, verde neon `#00a854`, texto `#1a2a1a`
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
├── hooks/         ← useShareLink, useH2H (TanStack Query)
├── components/
│   ├── layout/    ← AppShell (header + logo + share button + layout)
│   ├── groups/    ← GroupCard, GroupGrid, MatchModal, MatchRow (stepper)
│   ├── bracket/   ← BracketView (espinha de peixe), BracketMinimap
│   └── share/     ← ShareButton
├── data/          ← wc2026.ts (48 times, 12 grupos, fixtures FIFA 2026)
└── lib/           ← query-client.ts
```

---

## Tokens Tailwind (`tailwind.config.ts`)

```typescript
colors: {
  wcp: {
    bg:               '#f0f4f1',
    surface:          '#ffffff',
    'surface-subtle': '#e8f5ec',
    primary:          '#00a854',
    'primary-light':  '#00c866',
    'primary-faint':  'rgba(0,200,102,0.08)',
    text:             '#1a2a1a',
    muted:            '#607060',
    border:           'rgba(0,200,102,0.13)',
  },
},
```

---

## Princípios de Engenharia

- `engine/` sem dependências React — testável puro
- TDD obrigatório no engine (`superpowers:test-driven-development`)
- MatchRow props-only — sem acesso direto ao store
- Standings e bracket sempre derivados no render — nunca armazenados
- `useMemo` em GroupGrid para evitar recalcular 12 grupos + bracket por render
- SOLID / DRY / KISS / YAGNI

---

## Status das Fases

- ✅ **Fase 1** — Engine FIFA (classifier, tiebreaker, bracket-generator) com TDD, ≥90% cobertura
- ✅ **Fase 2** — UI reativa: GroupTable, MatchRow, BracketView, Sidebar, ContentArea — 23 testes, build limpo
- ✅ **Fase 3** — E2E & Estabilidade (Playwright 6 testes, CI verde, deploy GitHub Pages)
- ✅ **Fase 4** — Social: ShareButton (URL ?s= base64url), OG meta tags, og-image.png — 34 testes, @claude aprovado
- ✅ **Fase 5** — Community Stats (removida): feature estava incompleta (sem write path); Turso + @libsql/client removidos da stack em 2026-04-19
- ✅ **Fase 6** — Redesign Cyber Green Light: nova paleta, sem sidebar, accordion de grupos, stepper +/−, bracket espinha de peixe — 49 testes, @claude aprovado
- ✅ **Fase 7** — UX Improvements: GroupGrid responsivo (1→4 cols), MatchModal gamificado com reveal progressivo, bracket overflow fix + clamp() responsivo — 69 testes, build limpo
- ✅ **Fase 8** — MatchModal accordion puro: todos os 6 jogos visíveis desde o início, collapse header por jogo, sem auto-advance; MatchRow compact distingue preenchido (✓) de vazio (›) — 71 testes, @claude aprovado
- 🔧 **Limpeza pós-fase 8** — Turso/libsql removido completamente; 64 testes, build limpo

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
git push

# 3. Abrir PR
gh pr create --title "feat: descrição" --body "## Summary\n- ...\n\n## Test Plan\n- [ ] ..."

# 4. Code review automatizado com @claude
gh pr comment <número> --body "@claude please review this PR"
# Monitorar: gh pr view <número> --json comments --jq '.comments[-1].body'
# Repetir até @claude aprovar

# 5. Após aprovação: Squash and Merge no GitHub
```

- Branches: `feat/`, `fix/`, `chore/`
- Commits: convencional — `feat:`, `fix:`, `test:`, `chore:`, `docs:`
- **Nunca commitar direto na `main`** — sempre via PR
- Merge strategy: **Squash and Merge**
- **Code review obrigatório via `@claude`** antes de mergear

---

## Deploy

- **URL produção:** https://jonasmaia12.github.io/World-Cup-Predictor/
- Todo push na `main` dispara `.github/workflows/deploy.yml` automaticamente
- CI (`.github/workflows/ci.yml`) roda em todo push e PR — vitest → playwright → build

---

## Contexto FIFA 2026

- 48 seleções, 12 grupos de 4 — classificam os 2 primeiros + 8 melhores terceiros = 32 times
- Bracket com chaves pré-definidas pela FIFA (não sorteio pós-grupos)
- Critérios de desempate: H2H pts → H2H GD → H2H GF → GD geral → GF geral → ordem do sorteio
- Vencedores das rodadas eliminatórias não são resolvidos automaticamente pelo engine (bracket é read-only após grupos)
