# World Cup Predictor 2026

Simulador interativo da Copa do Mundo FIFA 2026. Preencha os placares da fase de grupos, veja a classificação atualizada em tempo real e acompanhe o bracket eliminatório gerado automaticamente.

**[▶ Acessar a aplicação](https://jonasmaia12.github.io/World-Cup-Predictor/)**

---

## Funcionalidades

- **48 seleções, 12 grupos** — fixtures oficiais FIFA 2026
- **Stepper +/−** para inserir placares com um toque — sem teclado
- **Simulador automático** — gera placares aleatórios por grupo (distribuição de Poisson)
- **Classificação automática** com critérios FIFA (pontos → saldo → gols → H2H → sorteio)
- **8 melhores terceiros** selecionados e inseridos no bracket com GroupPositionPicker
- **Bracket eliminatório interativo** — clique em qualquer partida para definir o vencedor
- **Placar exato ou só o vencedor** — dois modos no modal de partida eliminatória
- **Cascata automática** — alterar um resultado de grupo limpa os rounds downstream
- **Card do campeão animado** — trajetória completa do vencedor com compartilhamento
- **Bracket espinha de peixe** (desktop) e navegação por rodada com minimap (mobile)
- **Compartilhamento via URL** — estado salvo em base64url no parâmetro `?s=`
- **Persistência local** — progresso salvo no LocalStorage

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| UI | Tailwind CSS + Shadcn/UI |
| Estado | Zustand + persist |
| Testes unitários | Vitest + Testing Library (146 testes) |
| Testes E2E | Playwright (20 testes) |
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
# API football-data.org — para placar ao vivo (Fase 12, junho 2026)
VITE_FOOTBALL_API_KEY=sua-chave
```

---

## Estrutura do projeto

```
src/
├── engine/          # Lógica FIFA pura (classificação, desempate, bracket, cascade)
├── store/           # Estado global com Zustand (tournament + ui slices)
├── hooks/           # useShareLink
├── components/
│   ├── layout/      # AppShell (header + logo + share button + layout)
│   ├── groups/      # GroupAccordion, GroupTable, MatchRow, MatchModal
│   └── bracket/     # BracketView, BracketMinimap, KnockoutMatchModal, ChampionCard
├── data/            # 48 seleções, 12 grupos, fixtures oficiais FIFA 2026
└── lib/             # utils
```

---

## Deploy

Todo push na branch `main` dispara o deploy automático via GitHub Actions para GitHub Pages. O CI roda vitest + playwright + build antes de publicar.

---

## Licença

MIT
