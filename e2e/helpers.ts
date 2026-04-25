import type { Page } from '@playwright/test'
import type { ScoreMap } from '../src/engine/types'

export async function openGroupModal(page: Page, groupLetter: string) {
  await page.getByTestId(`group-card-${groupLetter}`).click()
  await page.getByRole('heading', { name: `Grupo ${groupLetter}` }).waitFor()
  // Close position picker so the match list is fully accessible
  const cancelPicker = page.getByTestId('cancel-picker')
  if (await cancelPicker.isVisible()) {
    await cancelPicker.click()
    await page.waitForTimeout(100)
  }
}

export async function closeModal(page: Page) {
  await page.getByTestId('modal-close').click()
  // Wait for modal to fully unmount before continuing
  await page.getByTestId('modal-close').waitFor({ state: 'detached' })
}

export async function ensureExpanded(page: Page, matchId: string) {
  const compact = page.getByTestId(`compact-${matchId}`)
  if (await compact.isVisible()) {
    await compact.click()
    await page.waitForTimeout(50)
  }
}

export async function fillGroupScores(
  page: Page,
  scores: Record<string, [number, number]>,
) {
  // Close position picker if it's open (it opens by default)
  const cancelPicker = page.getByTestId('cancel-picker')
  if (await cancelPicker.isVisible()) {
    await cancelPicker.click()
    await page.waitForTimeout(100)
  }
  for (const [matchId, [home, away]] of Object.entries(scores)) {
    for (let i = 0; i < home; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`home-plus-${matchId}`).click()
    }
    for (let i = 0; i < away; i++) {
      await ensureExpanded(page, matchId)
      await page.getByTestId(`away-plus-${matchId}`).click()
    }
    await page.waitForTimeout(50)
  }
}

export async function injectScores(
  page: Page,
  scoreMap: Record<string, { home: number; away: number }>,
) {
  await page.evaluate((scores) => {
    const stored = JSON.parse(localStorage.getItem('wcp2026-state') || '{"state":{}}')
    stored.state.scores = { ...(stored.state.scores ?? {}), ...scores }
    localStorage.setItem('wcp2026-state', JSON.stringify(stored))
  }, scoreMap)
}

// Injects state that survives page.reload() — addInitScript runs in order,
// so this set-script fires AFTER beforeEach's remove-script on every navigation.
export async function injectState(
  page: Page,
  scores: ScoreMap,
  thirdQualifiers: string[] = [],
) {
  await page.addInitScript(({ s, tq }) => {
    localStorage.setItem('wcp2026-state', JSON.stringify({
      state: { scores: s, thirdQualifiers: tq },
      version: 0,
    }))
  }, { s: scores, tq: thirdQualifiers })
  await page.reload()
  await page.waitForLoadState('networkidle')
}
