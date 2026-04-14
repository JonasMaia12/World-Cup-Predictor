import { test, expect, type Page } from '@playwright/test'

// Fills all 6 scores for a group. Keys are match IDs (e.g. 'A1'), values are [home, away].
async function fillGroupScores(page: Page, scores: Record<string, [number, number]>) {
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    await page.getByTestId(`score-home-${matchId}`).fill(String(home))
    await page.getByTestId(`score-away-${matchId}`).fill(String(away))
  }
}

test.beforeEach(async ({ page }) => {
  // Inject before any page scripts so Zustand persist middleware finds no state to hydrate
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
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
  await expect(rows.nth(1)).toContainText('México')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('África do Sul')
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
  await expect(rows.nth(1)).toContainText('Brasil')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('Marrocos')
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
  await expect(rows.nth(1)).toContainText('Estados Unidos')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('Paraguai')
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
