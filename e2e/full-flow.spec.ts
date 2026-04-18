import { test, expect, type Page } from '@playwright/test'

// Fill scores for a group using stepper +/- buttons. Keys are match IDs, values are [home, away].
async function fillGroupScores(page: Page, scores: Record<string, [number, number]>) {
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    for (let i = 0; i < home; i++) {
      await page.getByTestId(`home-plus-${matchId}`).click()
    }
    for (let i = 0; i < away; i++) {
      await page.getByTestId(`away-plus-${matchId}`).click()
    }
  }
}

// Open a group accordion (if not already open)
async function openGroup(page: Page, groupLetter: string) {
  const btn = page.getByRole('button', { name: new RegExp(`GRUPO ${groupLetter}`, 'i') })
  const isOpen = await page.getByTestId(`group-content-${groupLetter}`).isVisible().catch(() => false)
  if (!isOpen) {
    await btn.click()
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

// Group A is open by default
test('Group A — MEX 1st, RSA 2nd', async ({ page }) => {
  await fillGroupScores(page, {
    A1: [2, 0],
    A2: [1, 0],
    A3: [2, 0],
    A4: [2, 0],
    A5: [2, 0],
    A6: [1, 0],
  })

  const rows = page.getByRole('row')
  await expect(rows.nth(1)).toContainText('México')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('África do Sul')
  await expect(rows.nth(2)).toContainText('6')
})

test('Group C — BRA 1st, MAR 2nd', async ({ page }) => {
  await openGroup(page, 'C')
  await fillGroupScores(page, {
    C1: [3, 0],
    C2: [0, 1],
    C3: [2, 0],
    C4: [2, 1],
    C5: [2, 0],
    C6: [1, 0],
  })

  // group C table rows
  const groupContent = page.getByTestId('group-content-C')
  const rows = groupContent.getByRole('row')
  await expect(rows.nth(1)).toContainText('Brasil')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('Marrocos')
  await expect(rows.nth(2)).toContainText('6')
})

test('Group D — USA 1st, PAR 2nd', async ({ page }) => {
  await openGroup(page, 'D')
  await fillGroupScores(page, {
    D1: [2, 0],
    D2: [0, 1],
    D3: [2, 0],
    D4: [2, 1],
    D5: [2, 0],
    D6: [2, 1],
  })

  const groupContent = page.getByTestId('group-content-D')
  const rows = groupContent.getByRole('row')
  await expect(rows.nth(1)).toContainText('Estados Unidos')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('Paraguai')
  await expect(rows.nth(2)).toContainText('6')
})

test('Bracket — A, C, D classifiers in correct R32 slots', async ({ page }) => {
  // Fill Group A (already open)
  await fillGroupScores(page, {
    A1: [2, 0], A2: [1, 0], A3: [2, 0], A4: [2, 0], A5: [2, 0], A6: [1, 0],
  })

  // Fill Group C
  await openGroup(page, 'C')
  await fillGroupScores(page, {
    C1: [3, 0], C2: [0, 1], C3: [2, 0], C4: [2, 1], C5: [2, 0], C6: [1, 0],
  })

  // Fill Group D
  await openGroup(page, 'D')
  await fillGroupScores(page, {
    D1: [2, 0], D2: [0, 1], D3: [2, 0], D4: [2, 1], D5: [2, 0], D6: [2, 1],
  })

  // Bracket is at the bottom — use .first() since desktop+mobile both render in DOM
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await expect(page.getByTestId('bracket-match-r32-1').first()).toContainText('MEX')
  await expect(page.getByTestId('bracket-match-r32-2').first()).toContainText('RSA')
  await expect(page.getByTestId('bracket-match-r32-3').first()).toContainText('BRA')
  await expect(page.getByTestId('bracket-match-r32-3').first()).toContainText('PAR')
  await expect(page.getByTestId('bracket-match-r32-4').first()).toContainText('USA')
  await expect(page.getByTestId('bracket-match-r32-4').first()).toContainText('MAR')
})
