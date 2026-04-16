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

  // Button changes to "Link copiado!" for ~2s
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  // The copied URL contains ?s=
  // (button does not navigate — page.url() stays unchanged)
  const clipboardUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardUrl).toMatch(/\?s=/)
})

test('URL compartilhada restaura o estado do bracket ao carregar', async ({ page, context }) => {
  // Fill a score and generate share URL
  await page.getByRole('button', { name: /Grupo A/ }).click()
  await page.getByTestId('score-home-A1').fill('3')
  await page.getByTestId('score-away-A1').fill('1')

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Link copiado')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Open the shared URL in a new page without localStorage
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)

  // Verify scores were restored
  await page2.getByRole('button', { name: /Grupo A/ }).click()
  await expect(page2.getByTestId('score-home-A1')).toHaveValue('3')
  await expect(page2.getByTestId('score-away-A1')).toHaveValue('1')
})
