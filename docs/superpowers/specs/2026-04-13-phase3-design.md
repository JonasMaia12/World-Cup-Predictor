# Fase 3 — E2E & Estabilidade: Design Spec

**Data:** 2026-04-13  
**Status:** Aprovado

---

## Objetivo

Adicionar testes E2E com Playwright cobrindo o fluxo completo do simulador (grupos → bracket), configurar GitHub Actions CI (vitest → playwright → build), e conectar deploy automático via integração nativa Vercel + GitHub.

**Critério de saída:** CI verde no GitHub Actions.

---

## 1. Testes E2E

**Arquivo:** `e2e/full-flow.spec.ts`

### Grupos cobertos

| Grupo | Times |
|-------|-------|
| A | MEX, RSA, KOR, CZE |
| C | BRA, MAR, HAI, SCO |
| D | USA, PAR, AUS, TUR |

### Fluxo por grupo

1. Navegar pelo sidebar até o grupo (`getByRole('button', { name: /Grupo X/ })`)
2. Preencher todos os 6 placares via `data-testid="score-home-{matchId}"` e `data-testid="score-away-{matchId}"`
3. Verificar standings: 1º e 2º colocados corretos por texto, pontos e saldo de gols

### Fluxo bracket

1. Após preencher os 3 grupos, clicar em "Bracket" no sidebar
2. Verificar que os classificadores de A, C e D aparecem nos slots corretos via `data-testid="bracket-slot-{round}-{index}"`

### Estratégia de seletores

- Navegação: `getByRole('button', { name: /Grupo A/ })`
- Inputs de score: `data-testid` (sem papel semântico claro)
- Standings: `getByRole('row')` + asserção por texto
- Bracket slots: `data-testid` (posição no bracket não tem papel ARIA)

---

## 2. GitHub Actions CI

**Arquivo:** `.github/workflows/ci.yml`

**Trigger:** `push` e `pull_request` em qualquer branch.

**Job único sequencial (`ci`)** em `ubuntu-latest`:

```
1. checkout
2. setup Node 22 com cache npm
3. npm ci
4. npx vitest run
5. npx playwright install --with-deps chromium
6. npx playwright test
7. npm run build
```

**Racional sequencial:** falha rápida — unitários quebrados interrompem antes de instalar browsers. Simples de debugar.

**Sem secrets de deploy:** Vercel usa integração nativa com GitHub, sem `VERCEL_TOKEN` no CI.

---

## 3. Configuração Playwright

**Arquivos:**
- `playwright.config.ts` (raiz)
- `e2e/full-flow.spec.ts`

### `playwright.config.ts`

```ts
baseURL: 'http://localhost:5173'
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
}
projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
testDir: './e2e'
reporter: process.env.CI ? 'github' : 'html'
```

### Script adicionado ao `package.json`

```json
"test:e2e": "playwright test"
```

---

## 4. Modificações nos Componentes

Adições mínimas de `data-testid` — zero lógica nova:

| Componente | Atributo adicionado |
|------------|---------------------|
| `MatchRow` | `data-testid="score-home-{match.id}"` no input home |
| `MatchRow` | `data-testid="score-away-{match.id}"` no input away |
| `BracketView` | `data-testid="bracket-slot-{round}-{index}"` em cada card de time |

---

## 5. Vercel

Integração nativa Vercel + GitHub:
- Preview automático a cada PR
- Deploy de produção a cada push na `main`
- Nenhuma configuração no workflow do Actions necessária

---

## Fora de Escopo

- Paralelismo de jobs no CI (YAGNI — 23 testes em 1.26s)
- Outros browsers além de Chromium
- Testes E2E de todos os 12 grupos
- Configuração de secrets de deploy no Actions
