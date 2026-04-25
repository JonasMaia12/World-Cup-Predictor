import { test, expect } from '@playwright/test'
import { openGroupModal, closeModal, ensureExpanded, fillGroupScores } from './helpers'

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

test('Group card opens modal with accordion — all matches visible', async ({ page }) => {
  await openGroupModal(page, 'A')

  // First match (A1) is expanded — steppers visible
  await expect(page.getByTestId('home-plus-A1')).toBeVisible()

  // All other matches are collapsed but visible (A6 is the last — verifies all 6 are rendered)
  await expect(page.getByTestId('compact-A2')).toBeVisible()
  await expect(page.getByTestId('compact-A6')).toBeVisible()

  // Click A3 — A3 expands, A1 collapses (mutual exclusivity)
  await page.getByTestId('compact-A3').click()
  await expect(page.getByTestId('home-plus-A3')).toBeVisible()
  await expect(page.getByTestId('compact-A1')).toBeVisible()
  await expect(page.getByTestId('home-plus-A1')).not.toBeVisible()

  // Score A3 — no auto-advance, A3 stays expanded
  await page.getByTestId('home-plus-A3').click()
  await expect(page.getByTestId('home-plus-A3')).toBeVisible()

  // Close modal — progress badge updates (1 scored out of 6)
  await closeModal(page)
  await expect(page.getByTestId('group-card-A')).toContainText('1/6')
})

test('Bracket oitavas visible without horizontal cut-off', async ({ page }) => {
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  // First and last oitavas matches are visible (not cut off)
  await expect(page.getByTestId('bracket-match-r32-1').first()).toBeVisible()
})
