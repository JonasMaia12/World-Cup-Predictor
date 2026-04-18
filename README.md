# World Cup Predictor 2026

Simulador interativo da Copa do Mundo FIFA 2026. Preencha os placares da fase de grupos, veja a classificação atualizada em tempo real e acompanhe o bracket eliminatório gerado automaticamente.

**[▶ Acessar a aplicação](https://jonasmaia12.github.io/World-Cup-Predictor/)**

---

## Funcionalidades

- **48 seleções, 12 grupos** — fixtures oficiais FIFA 2026
- **Stepper +/−** para inserir placares com um toque — sem teclado
- **Classificação automática** com critérios FIFA (pontos → saldo → gols → H2H → sorteio)
- **8 melhores terceiros** selecionados e inseridos no bracket automaticamente
- **Bracket espinha de peixe** (desktop) e navegação por rodada com minimap (mobile)
- **Compartilhamento via URL** — estado salvo em base64url no parâmetro `?s=`
- **Favoritos da comunidade** — barra com as seleções mais escolhidas (via Turso)
- **Persistência local** — progresso salvo no LocalStorage

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| UI | Tailwind CSS + Shadcn/UI |
| Estado | Zustand + persist |
| Data fetching | TanStack Query v5 |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |
| Banco de dados | Turso (libSQL) + Drizzle ORM |
| Deploy | GitHub Pages + GitHub Actions |

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Rodar testes unitários
npm run test

# Rodar testes E2E
npm run test:e2e

# Build de produção
npm run build
```

### Variáveis de ambiente (opcional)

Crie um arquivo `.env.local` na raiz:

```env
# Community stats via Turso (opcional — barra de favoritos só aparece se configurado)
VITE_TURSO_URL=https://seu-banco.turso.io
VITE_TURSO_TOKEN=seu-token

# API football-data.org (não utilizada atualmente)
VITE_FOOTBALL_API_KEY=sua-chave
```

---

## Estrutura do projeto

```
src/
├── engine/          # Lógica FIFA pura (classificação, desempate, bracket)
├── store/           # Estado global com Zustand
├── hooks/           # useCommunityStats, useShareLink
├── components/
│   ├── layout/      # AppShell (header + layout)
│   ├── groups/      # GroupAccordion, GroupTable, MatchRow
│   ├── bracket/     # BracketView, BracketMinimap
│   └── stats/       # CommunityStatsBar
├── data/            # 48 seleções, 12 grupos, fixtures oficiais
└── lib/             # QueryClient
```

---

## Deploy

Todo push na branch `main` dispara o deploy automático via GitHub Actions para GitHub Pages. O CI roda vitest + playwright + build antes de publicar.

---

## Licença

MIT
