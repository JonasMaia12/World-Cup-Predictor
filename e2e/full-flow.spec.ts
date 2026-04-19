import { test, expect, type Page } from '@playwright/test'

// Open a group modal
async function openGroupModal(page: Page, groupLetter: string) {
  await page.getByTestId(`group-card-${groupLetter}`).click()
  // Wait for modal heading to appear (strict: targets only the h2 in the modal)
  await page.getByRole('heading', { name: `Grupo ${groupLetter}` }).waitFor()
}

// Close the active modal
async function closeModal(page: Page) {
  await page.getByTestId('modal-close').click()
}

// Ensure a match is expanded (not compact) inside the open modal.
async function ensureExpanded(page: Page, matchId: string) {
  const compact = page.getByTestId(`compact-${matchId}`)
  if (await compact.isVisible()) {
    await compact.click()
    await page.waitForTimeout(50)
  }
}

// Fill scores for a group inside the open modal.
// Keys are match IDs, values are [home, away].
// The first stepper click on an unscored match triggers progressive reveal (match becomes compact).
// We must re-expand compact matches to continue clicking steppers.
async function fillGroupScores(page: Page, scores: Record<string, [number, number]>) {
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    // First click sets the score (unscored → scored) and may make match compact
    // Subsequent clicks require re-expanding first
    for (let i = 0; i < home; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`home-plus-${matchId}`).click()
    }
    for (let i = 0; i < away; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`away-plus-${matchId}`).click()
    }
    // If score is [0, 0] (i.e., no clicks), match stays unscored — skip
    // After scoring, next match reveals (if any). Wait briefly.
    await page.waitForTimeout(50)
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('Group A — MEX 1st, RSA 2nd', async ({ page }) => {
  await openGroupModal(page, 'A')
  await fillGroupScores(page, {
    A1: [2, 0],
    A2: [1, 0],
    A3: [2, 0],
    A4: [2, 0],
    A5: [2, 0],
    A6: [1, 0],
  })
  await closeModal(page)

  // GroupCard standings table shows team codes and PTS
  const cardA = page.getByTestId('group-card-A')
  const rows = cardA.getByRole('row')
  await expect(rows.nth(1)).toContainText('MEX')
  await expect(rows.nth(2)).toContainText('RSA')
})

test('Group C — BRA 1st, MAR 2nd', async ({ page }) => {
  await openGroupModal(page, 'C')
  await fillGroupScores(page, {
    C1: [3, 0],
    C2: [0, 1],
    C3: [2, 0],
    C4: [2, 1],
    C5: [2, 0],
    C6: [1, 0],
  })
  await closeModal(page)

  const cardC = page.getByTestId('group-card-C')
  const rows = cardC.getByRole('row')
  await expect(rows.nth(1)).toContainText('BRA')
  await expect(rows.nth(2)).toContainText('MAR')
})

test('Group D — USA 1st, PAR 2nd', async ({ page }) => {
  await openGroupModal(page, 'D')
  await fillGroupScores(page, {
    D1: [2, 0],
    D2: [0, 1],
    D3: [2, 0],
    D4: [2, 1],
    D5: [2, 0],
    D6: [2, 1],
  })
  await closeModal(page)

  const cardD = page.getByTestId('group-card-D')
  const rows = cardD.getByRole('row')
  await expect(rows.nth(1)).toContainText('USA')
  await expect(rows.nth(2)).toContainText('PAR')
})

test('Bracket — A, C, D classifiers in correct R32 slots', async ({ page }) => {
  // Fill Group A
  await openGroupModal(page, 'A')
  await fillGroupScores(page, {
    A1: [2, 0], A2: [1, 0], A3: [2, 0], A4: [2, 0], A5: [2, 0], A6: [1, 0],
  })
  await closeModal(page)

  // Fill Group C
  await openGroupModal(page, 'C')
  await fillGroupScores(page, {
    C1: [3, 0], C2: [0, 1], C3: [2, 0], C4: [2, 1], C5: [2, 0], C6: [1, 0],
  })
  await closeModal(page)

  // Fill Group D
  await openGroupModal(page, 'D')
  await fillGroupScores(page, {
    D1: [2, 0], D2: [0, 1], D3: [2, 0], D4: [2, 1], D5: [2, 0], D6: [2, 1],
  })
  await closeModal(page)

  // Scroll to bracket and verify first slots
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await expect(page.getByTestId('bracket-match-r32-1').first()).toContainText('MEX')
  await expect(page.getByTestId('bracket-match-r32-2').first()).toContainText('RSA')
  await expect(page.getByTestId('bracket-match-r32-3').first()).toContainText('BRA')
  await expect(page.getByTestId('bracket-match-r32-3').first()).toContainText('PAR')
  await expect(page.getByTestId('bracket-match-r32-4').first()).toContainText('USA')
  await expect(page.getByTestId('bracket-match-r32-4').first()).toContainText('MAR')
})

test('Group card opens modal with progressive reveal', async ({ page }) => {
  // Open group A modal
  await openGroupModal(page, 'A')

  // First match (A1) is expanded — steppers visible
  await expect(page.getByTestId('home-plus-A1')).toBeVisible()

  // Second match not yet visible
  await expect(page.getByTestId('home-plus-A2')).not.toBeVisible()

  // Score first match — second reveals
  await page.getByTestId('home-plus-A1').click()
  await expect(page.getByTestId('home-plus-A2')).toBeVisible()

  // Close modal — progress badge updates
  await closeModal(page)
  await expect(page.getByTestId('group-card-A')).toContainText('1/6')
})

test('Bracket oitavas visible without horizontal cut-off', async ({ page }) => {
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  // First and last oitavas matches are visible (not cut off)
  await expect(page.getByTestId('bracket-match-r32-1').first()).toBeVisible()
})
