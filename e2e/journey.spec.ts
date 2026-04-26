import { test, expect } from '@playwright/test'
import { injectState } from './helpers'
import type { ScoreMap } from '../src/engine/types'

const GROUP_A_MEX_WINS: ScoreMap = {
  A1:{home:2,away:0}, A2:{home:1,away:0}, A3:{home:2,away:0},
  A4:{home:2,away:0}, A5:{home:2,away:0}, A6:{home:1,away:0},
}

const GROUP_C_BRA_WINS: ScoreMap = {
  C1:{home:3,away:0}, C2:{home:0,away:1}, C3:{home:2,away:0},
  C4:{home:2,away:1}, C5:{home:2,away:0}, C6:{home:1,away:0},
}

const TEN_GROUPS_SCORES: ScoreMap = {
  // B: CAN BIH QAT SUI
  B1:{home:2,away:0},B2:{home:2,away:0},B3:{home:2,away:0},B4:{home:1,away:0},B5:{home:2,away:0},B6:{home:1,away:0},
  // D: USA PAR AUS TUR
  D1:{home:2,away:0},D2:{home:2,away:0},D3:{home:2,away:0},D4:{home:1,away:0},D5:{home:2,away:0},D6:{home:1,away:0},
  // E: GER CUW CIV ECU
  E1:{home:2,away:0},E2:{home:2,away:0},E3:{home:2,away:0},E4:{home:1,away:0},E5:{home:2,away:0},E6:{home:1,away:0},
  // F: NED JPN SWE TUN
  F1:{home:2,away:0},F2:{home:2,away:0},F3:{home:2,away:0},F4:{home:1,away:0},F5:{home:2,away:0},F6:{home:1,away:0},
  // G: BEL EGY IRN NZL
  G1:{home:2,away:0},G2:{home:2,away:0},G3:{home:2,away:0},G4:{home:1,away:0},G5:{home:2,away:0},G6:{home:1,away:0},
  // H: ESP CPV KSA URU
  H1:{home:2,away:0},H2:{home:2,away:0},H3:{home:2,away:0},H4:{home:1,away:0},H5:{home:2,away:0},H6:{home:1,away:0},
  // I: FRA SEN NOR IRQ
  I1:{home:2,away:0},I2:{home:2,away:0},I3:{home:2,away:0},I4:{home:1,away:0},I5:{home:2,away:0},I6:{home:1,away:0},
  // J: ARG ALG AUT JOR
  J1:{home:2,away:0},J2:{home:2,away:0},J3:{home:2,away:0},J4:{home:1,away:0},J5:{home:2,away:0},J6:{home:1,away:0},
  // K: POR COD UZB COL
  K1:{home:2,away:0},K2:{home:2,away:0},K3:{home:2,away:0},K4:{home:1,away:0},K5:{home:2,away:0},K6:{home:1,away:0},
  // L: ENG CRO GHA PAN
  L1:{home:2,away:0},L2:{home:2,away:0},L3:{home:2,away:0},L4:{home:1,away:0},L5:{home:2,away:0},L6:{home:1,away:0},
}

const ALL_SCORES: ScoreMap = {
  ...GROUP_A_MEX_WINS,
  ...GROUP_C_BRA_WINS,
  ...TEN_GROUPS_SCORES,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

test('@slow Jornada completa: grupos → bracket → campeão → share', async ({ page, context }) => {
  test.slow()

  // FASE 1 — Injectar todos os grupos + thirdQualifiers de uma vez
  // injectState usa addInitScript (corre após o beforeEach's remove-script)
  // garantindo que o state sobrevive ao page.reload() interno
  await injectState(page, ALL_SCORES, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])

  // Verificar standings: MEX 1º em A, BRA 1º em C
  const cardA = page.getByTestId('group-card-A')
  await expect(cardA.getByRole('row').nth(1)).toContainText('MEX')

  const cardC = page.getByTestId('group-card-C')
  await expect(cardC.getByRole('row').nth(1)).toContainText('BRA')

  // Verificar que r32-1 e r32-8 têm teams (spot-check)
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('bracket-match-r32-1').first()).not.toContainText('?')
  await expect(page.getByTestId('bracket-match-r32-8').first()).not.toContainText('?')

  // FASE 2 — Bracket até campeão
  // r32 (16 jogos) — escolher home team em cada um
  for (let i = 1; i <= 16; i++) {
    const slot = page.getByTestId(`bracket-match-r32-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId(/^winner-/).first().waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(150)
  }

  // r16 (8 jogos)
  for (let i = 1; i <= 8; i++) {
    const slot = page.getByTestId(`bracket-match-r16-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId(/^winner-/).first().waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(150)
  }

  // qf (4 jogos)
  for (let i = 1; i <= 4; i++) {
    const slot = page.getByTestId(`bracket-match-qf-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId(/^winner-/).first().waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(150)
  }

  // sf (2 jogos)
  for (let i = 1; i <= 2; i++) {
    const slot = page.getByTestId(`bracket-match-sf-${i}`).first()
    await slot.scrollIntoViewIfNeeded()
    await slot.click()
    await page.getByTestId(/^winner-/).first().waitFor()
    await page.getByTestId(/^winner-/).first().click()
    await page.waitForTimeout(150)
  }

  // final
  await page.getByTestId('bracket-match-final').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-final').first().click()
  await page.getByTestId(/^winner-/).first().waitFor()
  await page.getByTestId(/^winner-/).first().click()
  await page.waitForTimeout(300)

  // Verificar card de campeão
  await expect(page.getByTestId('champion-card')).toBeVisible()

  // FASE 3 — Share
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Copiado!')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  // Abrir em nova página e verificar restauração
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)
  await page2.waitForLoadState('networkidle')

  // Verificar standings restauradas via GroupCard (MEX 1º no grupo A)
  await expect(page2.getByTestId('group-card-A').getByRole('row').nth(1)).toContainText('MEX')

  // Verificar card de campeão restaurado
  await expect(page2.getByTestId('champion-card')).toBeVisible()
})
