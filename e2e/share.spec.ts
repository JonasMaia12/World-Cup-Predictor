import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('share button copia URL com ?s= para o clipboard', async ({ page }) => {
  // Group A is open by default, fill 2 scores
  await page.getByTestId('home-plus-A1').click()
  await page.getByTestId('home-plus-A1').click()

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const clipboardUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardUrl).toMatch(/\?s=/)
})

test('URL compartilhada restaura o estado do bracket ao carregar', async ({ page, context }) => {
  // Fill score A1: 3-1 using steppers
  for (let i = 0; i < 3; i++) await page.getByTestId('home-plus-A1').click()
  for (let i = 0; i < 1; i++) await page.getByTestId('away-plus-A1').click()

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Open shared URL in a new page
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Group A is open by default, verify scores restored
  await expect(page2.getByTestId('score-home-A1')).toContainText('3')
  await expect(page2.getByTestId('score-away-A1')).toContainText('1')
})
