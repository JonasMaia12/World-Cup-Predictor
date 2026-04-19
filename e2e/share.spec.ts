import { test, expect, type Page } from '@playwright/test'

// Ensure a match is expanded (not compact) inside the open modal.
async function ensureExpanded(page: Page, matchId: string) {
  const compact = page.getByTestId(`compact-${matchId}`)
  if (await compact.isVisible()) {
    await compact.click()
    await page.waitForTimeout(50)
  }
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('share button copia URL com ?s= para o clipboard', async ({ page }) => {
  // Open group A modal to access steppers
  await page.getByTestId('group-card-A').click()
  await page.getByRole('heading', { name: 'Grupo A' }).waitFor()

  // Score A1: home=2 (first click sets score → compact; re-expand for second click)
  await ensureExpanded(page, 'A1')
  await page.getByTestId('home-plus-A1').click()
  await ensureExpanded(page, 'A1')
  await page.getByTestId('home-plus-A1').click()

  // Close modal then share
  await page.getByTestId('modal-close').click()
  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const clipboardUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardUrl).toMatch(/\?s=/)
})

test('URL compartilhada restaura o estado do bracket ao carregar', async ({ page, context }) => {
  // Open group A modal, fill score A1: 3-1
  await page.getByTestId('group-card-A').click()
  await page.getByRole('heading', { name: 'Grupo A' }).waitFor()

  // Score A1: home=3, away=1 (re-expand between clicks since first click makes it compact)
  for (let i = 0; i < 3; i++) {
    await ensureExpanded(page, 'A1')
    await page.getByTestId('home-plus-A1').click()
  }
  await ensureExpanded(page, 'A1')
  await page.getByTestId('away-plus-A1').click()

  // Close modal and share
  await page.getByTestId('modal-close').click()
  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Open shared URL in a new page
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Open modal for group A — A1 is already scored so it's compact
  await page2.getByTestId('group-card-A').click()
  await page2.getByRole('heading', { name: 'Grupo A' }).waitFor()

  // A1 is compact — re-expand it to see steppers
  await page2.getByTestId('compact-A1').click()

  // Verify scores restored
  await expect(page2.getByTestId('score-home-A1')).toContainText('3')
  await expect(page2.getByTestId('score-away-A1')).toContainText('1')
})
