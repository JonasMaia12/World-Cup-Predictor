# World Cup Predictor 2026 — CLAUDE.md

Simulador interativo da Copa do Mundo 2026: placares da fase de grupos → classificação FIFA automática → bracket eliminatório em tempo real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| UI | Shadcn/UI + Tailwind (cssVariables, tokens `wcp-*`) |
| Estado | Zustand + persist (`wcp2026-state` → LocalStorage) |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Deploy | GitHub Pages + GitHub Actions |

> **Nota:** `@tanstack/react-query` foi removido (não havia queries ativas). Será readicionado na Fase 12 (placar ao vivo).

---

## Decisões de Design

- Sem auth no MVP — brackets salvos via LocalStorage
- Layout: coluna única full-width — Header → GroupGrid (cards responsivos) → Bracket
- Bracket: "espinha de peixe" convergindo para o centro (Final); mobile = minimap + cards por rodada
- Tema: **Cyber Green Light** — fundo `#f0f4f1`, verde neon `#00a854`, texto `#1a2a1a`
- Estado: Zustand — sem Context API ou Redux

---

## API Externa — football-data.org

- Tier gratuito: **10 req/min** — usar `staleTime: 5 * 60 * 1000` quando implementado
- Chave: `VITE_FOOTBALL_API_KEY` em `.env.local` (nunca commitar)

---

## Arquitetura de Pastas

```
src/
├── engine/        ← Lógica FIFA pura (zero React, TDD)
│   ├── types.ts
│   ├── classifier.ts      ← standings + computeAllStandings
│   ├── tiebreaker.ts
│   ├── bracket-generator.ts
│   ├── simulator.ts       ← Poisson + ranking FIFA
│   ├── cascade.ts         ← cascadeClearKnockout (BFS)
│   └── group-position.ts  ← generateGroupScoresForOrder
├── store/         ← Zustand slices (tournament + ui) + persist
├── hooks/         ← useShareLink
├── components/
│   ├── layout/    ← AppShell
│   ├── groups/    ← GroupCard, GroupGrid, MatchModal, MatchRow, GroupPositionPicker
│   ├── bracket/   ← BracketView, BracketMinimap, KnockoutMatchModal, ChampionCard
│   └── share/     ← ShareButton
├── data/          ← wc2026.ts (48 times, 12 grupos, fixtures FIFA 2026)
└── lib/           ← share.ts, utils.ts
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
- ✅ **Fase 2** — UI reativa: GroupTable, MatchRow, BracketView — 23 testes, build limpo
- ✅ **Fase 3** — E2E & Estabilidade (Playwright, CI verde, deploy GitHub Pages)
- ✅ **Fase 4** — Social: ShareButton (URL ?s= base64url), OG meta tags, og-image.png — 34 testes
- ✅ **Fase 5** — Community Stats (removida): Turso + @libsql/client removidos; feature descontinuada
- ✅ **Fase 6** — Redesign Cyber Green Light: nova paleta, accordion de grupos, stepper +/−, bracket espinha de peixe — 49 testes
- ✅ **Fase 7** — UX Improvements: GroupGrid responsivo (1→4 cols), bracket overflow fix — 69 testes
- ✅ **Fase 8** — MatchModal accordion puro: 6 jogos visíveis, collapse por jogo, compact ✓/› — 71 testes
- ✅ **Fase 9** — Simulador automático (Poisson + ranking FIFA), reset por partida, info de jogo — 79 testes
- ✅ **Fase 10** — Bracket interactivo: KnockoutMatchModal, cascata r32→final, ChampionCard, GroupPositionPicker, "Limpar tudo" — 129 testes
- ✅ **Fase 11** — Cascade knockout + E2E completo + ChampionCard animado com trajetória — 146 unit + 20 E2E
- ✅ **Fase 12a** — ChampionCard → modal (portal, scroll lock, Escape/backdrop), header icons mobile — 148 unit
- ✅ **Fase 12b** — Tech debt: cascade knockout→knockout (cascadeClearKnockoutFromMatch), ARIA modal campeão — 153 unit
- ✅ **Fase 12c** — UI polish: RoundConnector SVG entre colunas do bracket, font sizes mínimos (≥10px), dark mode via CSS variables (`:root`/`.dark`), FOUC fix em index.html — 153 unit + 20 E2E

---

## Backlog (por ordem de prioridade)

### Fase 12 — Placar ao vivo *(quando a Copa 2026 iniciar, junho 2026)*
Integrar football-data.org para preencher resultados reais automaticamente:
- Readicionar `@tanstack/react-query` (`npm install @tanstack/react-query`)
- Criar `src/hooks/useH2H.ts` e `src/hooks/useLiveScores.ts`
- Auto-fill group scores a partir da API; bracket atualiza em tempo real
- Respeitar limite: `staleTime: 5 * 60 * 1000`, `refetchOnWindowFocus: false`

### Fase 13 — Acertômetro *(depende da Fase 12)*
Comparar o bracket do utilizador com os resultados reais e dar pontuação:
- Score por fase (r32, r16, qf, sf, final, campeão)
- Ranking persistido em LocalStorage
- Partilhar pontuação via URL existente

### Tech Debt documentado
- `MatchCard` em BracketView acede directamente ao store (minor — baixa prioridade, fix: passar `score` como prop de RoundColumn)

---

## Comandos

```bash
npm run dev          # dev server
npm run build        # build de produção
npm run test         # vitest (146 testes)
npm run test:e2e     # playwright (20 testes)
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
- Copa começa em junho 2026 — antes disso, todos os resultados são previsões do utilizador
