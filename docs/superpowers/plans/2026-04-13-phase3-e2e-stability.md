# Phase 3 — E2E & Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright E2E tests covering Groups A, C and D + bracket, plus a GitHub Actions CI pipeline (vitest → playwright → build), with Vercel deploy via native integration.

**Architecture:** Playwright is installed as a dev dependency with a `playwright.config.ts` at the root that auto-starts the Vite dev server via `webServer`. Two small `data-testid` additions to existing components (`MatchRow`, `BracketView`) enable stable E2E selectors without logic changes. The CI workflow runs sequentially in a single job for fast failure feedback.

**Tech Stack:** `@playwright/test`, Chromium (headless), GitHub Actions `ubuntu-latest`, Vite dev server (`npm run dev`), Zustand localStorage persistence.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `playwright.config.ts` | Playwright global config: baseURL, webServer, chromium project, reporter |
| Modify | `src/components/groups/MatchRow.tsx` | Add `data-testid` to home/away score inputs |
| Modify | `src/components/bracket/BracketView.tsx` | Add `data-testid` to each `MatchCard` outer div |
| Create | `e2e/full-flow.spec.ts` | E2E tests: Groups A, C, D standings + bracket verification |
| Create | `.github/workflows/ci.yml` | CI: vitest → playwright → build on ubuntu-latest |

---

## Scores used in E2E tests (reference)

| Group | Fixtures + results | 1st | 2nd |
|-------|--------------------|-----|-----|
| A | A1 MEX 2-0 RSA · A2 KOR 1-0 CZE · A3 MEX 2-0 KOR · A4 RSA 2-0 CZE · A5 MEX 2-0 CZE · A6 RSA 1-0 KOR | MEX (9pts) | RSA (6pts) |
| C | C1 BRA 3-0 MAR · C2 HAI 0-1 SCO · C3 BRA 2-0 HAI · C4 MAR 2-1 SCO · C5 BRA 2-0 SCO · C6 MAR 1-0 HAI | BRA (9pts) | MAR (6pts) |
| D | D1 USA 2-0 PAR · D2 AUS 0-1 TUR · D3 USA 2-0 AUS · D4 PAR 2-1 TUR · D5 USA 2-0 TUR · D6 PAR 2-1 AUS | USA (9pts) | PAR (6pts) |

Bracket roundOf32 matches affected (from bracket-generator template):
- `r32-1`: 1A (MEX) vs 2B (null — B not filled)
- `r32-2`: 1B (null) vs 2A (RSA)
- `r32-3`: 1C (BRA) vs 2D (PAR)
- `r32-4`: 1D (USA) vs 2C (MAR)

---

## Task 1: Install Playwright

**Files:**
- Modify: `package.json` (script + devDependency added automatically by npm)

- [ ] **Step 1: Install the package**

```bash
npm install -D @playwright/test
```

Expected: `@playwright/test` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Install Chromium browser**

```bash
npx playwright install chromium
```

Expected: Chromium downloaded to local Playwright cache. No error.

- [ ] **Step 3: Add `test:e2e` script to `package.json`**

In `package.json`, add the `test:e2e` script inside `"scripts"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:e2e": "playwright test",
  "coverage": "vitest run --coverage"
},
```

- [ ] **Step 4: Verify unit tests still pass**

```bash
npm run test
```

Expected:
```
Test Files  5 passed (5)
      Tests  23 passed (23)
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install playwright and add test:e2e script"
```

---

## Task 2: Create `playwright.config.ts`

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create the config**

Create `playwright.config.ts` at the project root with this exact content:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

- [ ] **Step 2: Commit**

```bash
git add playwright.config.ts
git commit -m "chore: add playwright config (chromium, webServer, baseURL)"
```

---

## Task 3: Add `data-testid` to `MatchRow` inputs

**Files:**
- Modify: `src/components/groups/MatchRow.tsx:32-48`

- [ ] **Step 1: Add testids to both inputs**

In `src/components/groups/MatchRow.tsx`, replace the two `<input>` elements:

Old home input:
```tsx
        <input
          type="number"
          min={0}
          value={homeScore ?? ''}
          onChange={handleHome}
          placeholder="–"
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
```

New home input (add `data-testid`):
```tsx
        <input
          type="number"
          min={0}
          value={homeScore ?? ''}
          onChange={handleHome}
          placeholder="–"
          data-testid={`score-home-${match.id}`}
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
```

Old away input:
```tsx
        <input
          type="number"
          min={0}
          value={awayScore ?? ''}
          onChange={handleAway}
          placeholder="–"
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
```

New away input (add `data-testid`):
```tsx
        <input
          type="number"
          min={0}
          value={awayScore ?? ''}
          onChange={handleAway}
          placeholder="–"
          data-testid={`score-away-${match.id}`}
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
```

- [ ] **Step 2: Run unit tests to confirm nothing broke**

```bash
npm run test
```

Expected:
```
Test Files  5 passed (5)
      Tests  23 passed (23)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/MatchRow.tsx
git commit -m "chore: add data-testid to MatchRow score inputs"
```

---

## Task 4: Add `data-testid` to `BracketView` match cards

**Files:**
- Modify: `src/components/bracket/BracketView.tsx:19-27`

- [ ] **Step 1: Add testid to `MatchCard`**

In `src/components/bracket/BracketView.tsx`, the `MatchCard` function currently is:

```tsx
function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className="bg-wcp-sidebar border border-wcp-border rounded-lg px-4 py-3 flex flex-col gap-1 text-sm min-w-[160px]">
      <TeamSlot code={match.home} />
      <span className="text-wcp-gold text-xs">vs</span>
      <TeamSlot code={match.away} />
    </div>
  )
}
```

Replace with:

```tsx
function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div
      data-testid={`bracket-match-${match.id}`}
      className="bg-wcp-sidebar border border-wcp-border rounded-lg px-4 py-3 flex flex-col gap-1 text-sm min-w-[160px]"
    >
      <TeamSlot code={match.home} />
      <span className="text-wcp-gold text-xs">vs</span>
      <TeamSlot code={match.away} />
    </div>
  )
}
```

- [ ] **Step 2: Run unit tests**

```bash
npm run test
```

Expected:
```
Test Files  5 passed (5)
      Tests  23 passed (23)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/bracket/BracketView.tsx
git commit -m "chore: add data-testid to BracketView match cards"
```

---

## Task 5: Create `e2e/full-flow.spec.ts`

**Files:**
- Create: `e2e/full-flow.spec.ts`

- [ ] **Step 1: Create the `e2e/` directory and spec file**

Create `e2e/full-flow.spec.ts` with this content:

```ts
import { test, expect, type Page } from '@playwright/test'

// Fills all 6 scores for a group. Keys are match IDs (e.g. 'A1'), values are [home, away].
async function fillGroupScores(page: Page, scores: Record<string, [number, number]>) {
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    await page.getByTestId(`score-home-${matchId}`).fill(String(home))
    await page.getByTestId(`score-away-${matchId}`).fill(String(away))
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Clear persisted Zustand state so each test starts fresh
  await page.evaluate(() => localStorage.removeItem('wcp2026-state'))
  await page.reload()
})

// ---------------------------------------------------------------------------
// Group A: MEX 1st (9pts), RSA 2nd (6pts)
// Fixtures: A1=MEX-RSA, A2=KOR-CZE, A3=MEX-KOR, A4=RSA-CZE, A5=MEX-CZE, A6=RSA-KOR
// ---------------------------------------------------------------------------
test('Group A — MEX 1st, RSA 2nd', async ({ page }) => {
  await page.getByRole('button', { name: /Grupo A/ }).click()

  await fillGroupScores(page, {
    A1: [2, 0], // MEX 2-0 RSA
    A2: [1, 0], // KOR 1-0 CZE
    A3: [2, 0], // MEX 2-0 KOR
    A4: [2, 0], // RSA 2-0 CZE
    A5: [2, 0], // MEX 2-0 CZE
    A6: [1, 0], // RSA 1-0 KOR
  })

  const rows = page.getByRole('row')
  await expect(rows.nth(1)).toContainText('MEX')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('RSA')
  await expect(rows.nth(2)).toContainText('6')
})

// ---------------------------------------------------------------------------
// Group C: BRA 1st (9pts), MAR 2nd (6pts)
// Fixtures: C1=BRA-MAR, C2=HAI-SCO, C3=BRA-HAI, C4=MAR-SCO, C5=BRA-SCO, C6=MAR-HAI
// ---------------------------------------------------------------------------
test('Group C — BRA 1st, MAR 2nd', async ({ page }) => {
  await page.getByRole('button', { name: /Grupo C/ }).click()

  await fillGroupScores(page, {
    C1: [3, 0], // BRA 3-0 MAR
    C2: [0, 1], // HAI 0-1 SCO
    C3: [2, 0], // BRA 2-0 HAI
    C4: [2, 1], // MAR 2-1 SCO
    C5: [2, 0], // BRA 2-0 SCO
    C6: [1, 0], // MAR 1-0 HAI
  })

  const rows = page.getByRole('row')
  await expect(rows.nth(1)).toContainText('BRA')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('MAR')
  await expect(rows.nth(2)).toContainText('6')
})

// ---------------------------------------------------------------------------
// Group D: USA 1st (9pts), PAR 2nd (6pts)
// Fixtures: D1=USA-PAR, D2=AUS-TUR, D3=USA-AUS, D4=PAR-TUR, D5=USA-TUR, D6=PAR-AUS
// ---------------------------------------------------------------------------
test('Group D — USA 1st, PAR 2nd', async ({ page }) => {
  await page.getByRole('button', { name: /Grupo D/ }).click()

  await fillGroupScores(page, {
    D1: [2, 0], // USA 2-0 PAR
    D2: [0, 1], // AUS 0-1 TUR
    D3: [2, 0], // USA 2-0 AUS
    D4: [2, 1], // PAR 2-1 TUR
    D5: [2, 0], // USA 2-0 TUR
    D6: [2, 1], // PAR 2-1 AUS
  })

  const rows = page.getByRole('row')
  await expect(rows.nth(1)).toContainText('USA')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('PAR')
  await expect(rows.nth(2)).toContainText('6')
})

// ---------------------------------------------------------------------------
// Bracket: after filling A, C, D — verify classifiers appear in correct R32 slots
//
// roundOf32 template (from bracket-generator.ts):
//   r32-1: 1A(MEX) vs 2B(null)   → MEX present
//   r32-2: 1B(null) vs 2A(RSA)   → RSA present
//   r32-3: 1C(BRA) vs 2D(PAR)    → BRA and PAR present
//   r32-4: 1D(USA) vs 2C(MAR)    → USA and MAR present
// ---------------------------------------------------------------------------
test('Bracket — A, C, D classifiers in correct R32 slots', async ({ page }) => {
  // Fill Group A
  await page.getByRole('button', { name: /Grupo A/ }).click()
  await fillGroupScores(page, {
    A1: [2, 0], A2: [1, 0], A3: [2, 0], A4: [2, 0], A5: [2, 0], A6: [1, 0],
  })

  // Fill Group C
  await page.getByRole('button', { name: /Grupo C/ }).click()
  await fillGroupScores(page, {
    C1: [3, 0], C2: [0, 1], C3: [2, 0], C4: [2, 1], C5: [2, 0], C6: [1, 0],
  })

  // Fill Group D
  await page.getByRole('button', { name: /Grupo D/ }).click()
  await fillGroupScores(page, {
    D1: [2, 0], D2: [0, 1], D3: [2, 0], D4: [2, 1], D5: [2, 0], D6: [2, 1],
  })

  // Navigate to bracket
  await page.getByRole('button', { name: /Bracket/ }).click()

  // r32-1: 1A = MEX
  await expect(page.getByTestId('bracket-match-r32-1')).toContainText('MEX')
  // r32-2: 2A = RSA
  await expect(page.getByTestId('bracket-match-r32-2')).toContainText('RSA')
  // r32-3: 1C = BRA, 2D = PAR
  await expect(page.getByTestId('bracket-match-r32-3')).toContainText('BRA')
  await expect(page.getByTestId('bracket-match-r32-3')).toContainText('PAR')
  // r32-4: 1D = USA, 2C = MAR
  await expect(page.getByTestId('bracket-match-r32-4')).toContainText('USA')
  await expect(page.getByTestId('bracket-match-r32-4')).toContainText('MAR')
})
```

- [ ] **Step 2: Start the dev server and run E2E tests locally**

```bash
npm run test:e2e
```

Expected: 4 tests pass in Chromium. If any fail, check the fixture IDs match `wc2026.ts` (e.g. `A1`, `A2` … `A6`, `C1` … `C6`, `D1` … `D6`) and that the bracket match IDs match the engine output (`r32-1` through `r32-4`).

- [ ] **Step 3: Commit**

```bash
git add e2e/full-flow.spec.ts
git commit -m "test: add E2E full-flow spec — groups A, C, D and bracket"
```

---

## Task 6: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow directories**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Unit tests
        run: npx vitest run

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npx playwright test

      - name: Build
        run: npm run build
```

- [ ] **Step 3: Commit and push to trigger CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (vitest → playwright → build)"
git push
```

- [ ] **Step 4: Verify CI passes**

Open the Actions tab on the GitHub repo and confirm the `CI` workflow run is green. All steps — unit tests, E2E, build — must pass.

---

## Self-Review

**Spec coverage:**
- [x] Playwright installed + `test:e2e` script → Task 1
- [x] `playwright.config.ts` with baseURL, webServer, chromium → Task 2
- [x] `data-testid` on MatchRow inputs → Task 3
- [x] `data-testid` on BracketView MatchCard → Task 4
- [x] E2E spec: Groups A, C, D standings + bracket → Task 5
- [x] GitHub Actions CI: vitest → playwright → build → Task 6
- [x] Vercel: via native integration (no CI config needed — out of scope as designed)

**Placeholder scan:** No TBDs, no "similar to", no vague steps — all code blocks are complete.

**Type consistency:** `BracketMatch.id` from `types.ts` is `string`; used as `match.id` in `MatchCard` → `bracket-match-${match.id}` → matches `r32-1` … `r32-16` from `bracket-generator.ts`. Consistent throughout.
