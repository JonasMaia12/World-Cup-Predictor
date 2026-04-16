# Fase 4 — Social: ShareButton + SEO/OG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um botão "Compartilhar bracket" no header que copia um link com o estado do bracket codificado em `?s=`, além de meta tags Open Graph no `index.html` para preview em redes sociais.

**Architecture:** O estado Zustand (`scores`) é serializado com `JSON.stringify` + base64url e colocado no query param `?s=`. Na inicialização do app, o `main.tsx` lê esse param e popula o store antes de renderizar o React. As meta tags OG são estáticas (preview genérico do site, não do bracket específico).

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Playwright (já instalado como devDependency), Vitest

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/engine/types.ts` | — | Já tem `ScoreMap` (usar este tipo) |
| `src/store/tournament.slice.ts` | Modificar | Adicionar `setScores` ao slice |
| `src/lib/share.ts` | Criar | `encodeState` / `decodeState` — puro, sem React |
| `src/lib/share.test.ts` | Criar | Testes unitários do share.ts |
| `src/main.tsx` | Modificar | Restaurar `?s=` antes de montar o React |
| `src/hooks/useShareLink.ts` | Criar | Hook: gera URL + copia clipboard + estado `copied` |
| `src/components/share/ShareButton.tsx` | Criar | Botão visual no header |
| `src/components/layout/AppShell.tsx` | Modificar | Adicionar header com ShareButton |
| `index.html` | Modificar | Meta tags OG + Twitter Card |
| `scripts/generate-og-image.mjs` | Criar | Script Playwright para gerar og-image.png |
| `public/og-image.png` | Criar | Imagem estática 1200×630 para OG |
| `e2e/share.spec.ts` | Criar | Teste E2E: share → navegar → restaurar estado |

---

## Task 1: Adicionar `setScores` ao TournamentSlice

**Files:**
- Modify: `src/store/tournament.slice.ts`
- Test: `src/store/tournament.slice.test.ts` (criar)

- [ ] **Step 1: Criar o arquivo de teste**

```ts
// src/store/tournament.slice.test.ts
import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { createTournamentSlice, type TournamentSlice } from './tournament.slice'

function makeStore() {
  return create<TournamentSlice>()((...a) => createTournamentSlice(...a))
}

describe('TournamentSlice — setScores', () => {
  it('populates multiple scores at once', () => {
    const store = makeStore()
    const scores = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
    }
    store.getState().setScores(scores)
    expect(store.getState().scores).toEqual(scores)
  })

  it('overwrites existing scores', () => {
    const store = makeStore()
    store.getState().setScore('A1', 3, 1)
    store.getState().setScores({ A1: { home: 0, away: 0 }, A2: { home: 2, away: 2 } })
    expect(store.getState().scores).toEqual({
      A1: { home: 0, away: 0 },
      A2: { home: 2, away: 2 },
    })
  })

  it('setScores({}) resets to empty', () => {
    const store = makeStore()
    store.getState().setScore('A1', 1, 0)
    store.getState().setScores({})
    expect(store.getState().scores).toEqual({})
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npm run test -- src/store/tournament.slice.test.ts
```
Esperado: FAIL — `setScores is not a function`

- [ ] **Step 3: Adicionar `setScores` ao slice**

Substituir o conteúdo completo de `src/store/tournament.slice.ts`:

```ts
import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'

export interface TournamentSlice {
  scores: ScoreMap
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  setScores: (scores) => set({ scores }),
  resetScores: () => set({ scores: {} }),
})
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
npm run test -- src/store/tournament.slice.test.ts
```
Esperado: PASS (3 testes)

- [ ] **Step 5: Confirmar que o build ainda funciona**

```bash
npm run build
```
Esperado: saída sem erros de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/store/tournament.slice.ts src/store/tournament.slice.test.ts
git commit -m "feat: add setScores to TournamentSlice"
```

---

## Task 2: `src/lib/share.ts` — encode/decode state (TDD)

**Files:**
- Create: `src/lib/share.ts`
- Create: `src/lib/share.test.ts`

- [ ] **Step 1: Escrever os testes**

```ts
// src/lib/share.test.ts
import { describe, it, expect } from 'vitest'
import { encodeState, decodeState } from './share'
import type { ScoreMap } from '@/engine/types'

describe('encodeState / decodeState', () => {
  it('round-trip preserves scores', () => {
    const scores: ScoreMap = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
      B3: { home: 0, away: 3 },
    }
    const encoded = encodeState(scores)
    expect(decodeState(`?s=${encoded}`)).toEqual(scores)
  })

  it('round-trip with empty scores object', () => {
    const encoded = encodeState({})
    expect(decodeState(`?s=${encoded}`)).toEqual({})
  })

  it('returns null when ?s= param is absent', () => {
    expect(decodeState('')).toBeNull()
    expect(decodeState('?foo=bar')).toBeNull()
  })

  it('returns null for corrupted base64', () => {
    expect(decodeState('?s=!!!invalid!!!')).toBeNull()
  })

  it('returns null for valid base64 but invalid JSON', () => {
    const notJson = btoa('not-json-at-all')
    expect(decodeState(`?s=${notJson}`)).toBeNull()
  })

  it('returns null for JSON that is not an object', () => {
    const arr = btoa(JSON.stringify([1, 2, 3]))
    expect(decodeState(`?s=${arr}`)).toBeNull()
  })

  it('URL with 96 scores stays under 2000 chars', () => {
    const scores: ScoreMap = {}
    for (let i = 0; i < 96; i++) {
      scores[`match-${i}`] = { home: Math.floor(Math.random() * 5), away: Math.floor(Math.random() * 5) }
    }
    const url = `https://example.com/?s=${encodeState(scores)}`
    expect(url.length).toBeLessThan(2000)
  })
})
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npm run test -- src/lib/share.test.ts
```
Esperado: FAIL — `Cannot find module './share'`

- [ ] **Step 3: Implementar `src/lib/share.ts`**

```ts
import type { ScoreMap } from '@/engine/types'

export function encodeState(scores: ScoreMap): string {
  const json = JSON.stringify(scores)
  return btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeState(search: string): ScoreMap | null {
  try {
    const s = new URLSearchParams(search).get('s')
    if (!s) return null
    // Restaurar base64 padrão a partir de base64url
    const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as ScoreMap
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Rodar os testes**

```bash
npm run test -- src/lib/share.test.ts
```
Esperado: PASS (7 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/share.ts src/lib/share.test.ts
git commit -m "feat: add encodeState/decodeState for URL share"
```

---

## Task 3: Restaurar estado do `?s=` na inicialização

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Atualizar `src/main.tsx`**

Substituir o conteúdo completo por:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AppShell } from '@/components/layout/AppShell'
import { useStore } from '@/store'
import { decodeState } from '@/lib/share'
import './index.css'

// Se a URL contém ?s=, restaurar o estado do bracket antes de montar o React.
// URL tem prioridade sobre o LocalStorage (persist).
const sharedScores = decodeState(window.location.search)
if (sharedScores) {
  useStore.getState().setScores(sharedScores)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Confirmar que o build compila sem erros**

```bash
npm run build
```
Esperado: saída sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: restore bracket state from ?s= on app load"
```

---

## Task 4: Hook `useShareLink`

**Files:**
- Create: `src/hooks/useShareLink.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/hooks/useShareLink.ts
import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { encodeState } from '@/lib/share'

export function useShareLink() {
  const [copied, setCopied] = useState(false)
  const scores = useStore((s) => s.scores)

  const share = useCallback(async () => {
    const encoded = encodeState(scores)
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [scores])

  return { share, copied }
}
```

- [ ] **Step 2: Confirmar que o build compila**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useShareLink.ts
git commit -m "feat: add useShareLink hook"
```

---

## Task 5: Componente `ShareButton`

**Files:**
- Create: `src/components/share/ShareButton.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// src/components/share/ShareButton.tsx
import { useShareLink } from '@/hooks/useShareLink'

export function ShareButton() {
  const { share, copied } = useShareLink()

  return (
    <button
      onClick={share}
      data-testid="share-button"
      className={`px-3 py-1.5 rounded text-sm font-bold transition-colors duration-150 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-wcp-gold text-wcp-bg hover:opacity-90'
      }`}
    >
      {copied ? '✓ Link copiado!' : '↗ Compartilhar bracket'}
    </button>
  )
}
```

- [ ] **Step 2: Confirmar que o build compila**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/share/ShareButton.tsx
git commit -m "feat: add ShareButton component"
```

---

## Task 6: Adicionar header com ShareButton ao AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

O AppShell atual não tem header. Vamos adicionar uma barra no topo com o título e o ShareButton.

- [ ] **Step 1: Atualizar `src/components/layout/AppShell.tsx`**

```tsx
import { Sidebar } from './Sidebar'
import { ContentArea } from './ContentArea'
import { ShareButton } from '@/components/share/ShareButton'

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-wcp-bg text-wcp-text">
      <header className="flex items-center justify-between px-4 py-2 border-b border-wcp-border shrink-0">
        <span className="text-wcp-gold font-bold tracking-wide text-sm">⚽ World Cup Predictor 2026</span>
        <ShareButton />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ContentArea />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Iniciar o dev server e verificar visualmente**

```bash
npm run dev
```

Abrir `http://localhost:5173` e confirmar:
- Header aparece no topo com título dourado e botão "↗ Compartilhar bracket"
- Clicar no botão muda para "✓ Link copiado!" por ~2s
- URL muda para incluir `?s=...`
- Layout de Sidebar + ContentArea não quebrou

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: add header with ShareButton to AppShell"
```

---

## Task 7: Gerar `og-image.png` e atualizar `index.html`

**Files:**
- Create: `scripts/generate-og-image.mjs`
- Create: `public/og-image.png`
- Modify: `index.html`

- [ ] **Step 1: Criar o script de geração**

```js
// scripts/generate-og-image.mjs
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1200px;
  height: 630px;
  background: #0c0a00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.container { text-align: center; padding: 40px; }
.emoji { font-size: 96px; margin-bottom: 24px; display: block; }
h1 { color: #f59e0b; font-size: 64px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin-bottom: 16px; }
p { color: #fef3c7; font-size: 28px; opacity: 0.8; }
</style>
</head>
<body>
<div class="container">
  <span class="emoji">⚽</span>
  <h1>World Cup Predictor 2026</h1>
  <p>Monte seu bracket e compartilhe com seus amigos</p>
</div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({
  path: join(__dirname, '../public/og-image.png'),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
})
await browser.close()
console.log('✓ public/og-image.png gerado')
```

- [ ] **Step 2: Rodar o script para gerar a imagem**

```bash
node scripts/generate-og-image.mjs
```
Esperado: `✓ public/og-image.png gerado` — arquivo criado em `public/og-image.png`

- [ ] **Step 3: Atualizar `index.html` com as meta tags OG**

Substituir o conteúdo completo de `index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>World Cup Predictor 2026</title>
    <meta name="description" content="Simule a Copa do Mundo 2026 — preencha os placares e veja o bracket eliminatório em tempo real." />

    <!-- Open Graph -->
    <meta property="og:title" content="World Cup Predictor 2026" />
    <meta property="og:description" content="Monte seu bracket da Copa 2026 e compartilhe com seus amigos." />
    <meta property="og:image" content="https://jonasmaia12.github.io/World-Cup-Predictor/og-image.png" />
    <meta property="og:url" content="https://jonasmaia12.github.io/World-Cup-Predictor/" />
    <meta property="og:type" content="website" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="World Cup Predictor 2026" />
    <meta name="twitter:description" content="Monte seu bracket da Copa 2026 e compartilhe com seus amigos." />
    <meta name="twitter:image" content="https://jonasmaia12.github.io/World-Cup-Predictor/og-image.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Confirmar que `public/og-image.png` existe e o build funciona**

```bash
ls public/og-image.png && npm run build
```
Esperado: arquivo existe + build sem erros.

- [ ] **Step 5: Commit**

```bash
git add public/og-image.png index.html scripts/generate-og-image.mjs
git commit -m "feat: add OG meta tags and og-image.png"
```

---

## Task 8: Teste E2E — `e2e/share.spec.ts`

**Files:**
- Create: `e2e/share.spec.ts`

- [ ] **Step 1: Escrever o teste**

```ts
// e2e/share.spec.ts
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('share button copia URL com ?s= para o clipboard', async ({ page }) => {
  await page.getByRole('button', { name: /Grupo A/ }).click()
  await page.getByTestId('score-home-A1').fill('2')
  await page.getByTestId('score-away-A1').fill('0')
  await page.getByTestId('score-home-A2').fill('1')
  await page.getByTestId('score-away-A2').fill('1')

  await page.getByTestId('share-button').click()

  // Botão muda para "Link copiado!" por ~2s
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  // A URL copiada para o clipboard contém ?s=
  // (o botão não navega, apenas copia — page.url() não muda)
  const clipboardUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardUrl).toMatch(/\?s=/)
})

test('URL compartilhada restaura o estado do bracket ao carregar', async ({ page, context }) => {
  // Preencher score e gerar URL
  await page.getByRole('button', { name: /Grupo A/ }).click()
  await page.getByTestId('score-home-A1').fill('3')
  await page.getByTestId('score-away-A1').fill('1')

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Abrir a URL compartilhada numa nova página sem localStorage
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Verificar que o placar foi restaurado
  await page2.getByRole('button', { name: /Grupo A/ }).click()
  await expect(page2.getByTestId('score-home-A1')).toHaveValue('3')
  await expect(page2.getByTestId('score-away-A1')).toHaveValue('1')
})
```

- [ ] **Step 2: Rodar o teste E2E**

```bash
npm run test:e2e -- e2e/share.spec.ts
```
Esperado: PASS (2 testes)

Se falhar por permissão de clipboard no Playwright, verificar se o `playwright.config.ts` tem `permissions: ['clipboard-read', 'clipboard-write']` ou adicionar no `use` global.

- [ ] **Step 3: Rodar toda a suite E2E para garantir que não houve regressões**

```bash
npm run test:e2e
```
Esperado: todos os testes passam (incluindo os 4 existentes em `full-flow.spec.ts`)

- [ ] **Step 4: Commit**

```bash
git add e2e/share.spec.ts
git commit -m "test: E2E share link — encode, copy, restore state"
```

---

## Checklist final

- [ ] `npm run test` — todos os testes unitários passam
- [ ] `npm run test:e2e` — todos os testes E2E passam (incluindo regressões)
- [ ] `npm run build` — build de produção sem erros
- [ ] Verificar manualmente: ShareButton no header, URL com `?s=`, restauração ao colar o link numa nova aba
