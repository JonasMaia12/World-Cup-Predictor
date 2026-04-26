import { test, expect } from '@playwright/test'
import { openGroupModal, closeModal, ensureExpanded, injectState } from './helpers'
import type { ScoreMap } from '../src/engine/types'

const GROUP_A_MEX_WINS: ScoreMap = {
  A1:{home:2,away:0}, A2:{home:1,away:0}, A3:{home:2,away:0},
  A4:{home:2,away:0}, A5:{home:2,away:0}, A6:{home:1,away:0},
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('wcp2026-state')
  })
  await page.goto('/')
})

// ─── 1. Cascade: alterar score de grupo pós-knockout ──────────────────────
test('@slow cascade: alterar 1º de A limpa r32-1 mas preserva r32-3', async ({ page }) => {
  test.slow()
  await injectState(page, {
    A1:{home:2,away:0},
    'r32-1': { home: 2, away: 1 },
    'r32-3': { home: 3, away: 0 },
  })

  // Alterar A1: RSA vence MEX (2-0 → 0-3)
  await openGroupModal(page, 'A')
  await ensureExpanded(page, 'A1')
  await page.getByTestId('home-minus-A1').click()
  await page.getByTestId('home-minus-A1').click()
  await page.getByTestId('away-plus-A1').click()
  await page.getByTestId('away-plus-A1').click()
  await page.getByTestId('away-plus-A1').click()
  await closeModal(page)

  // r32-1 deve ter sido limpo (cascade), r32-3 intacto
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByTestId('bracket-match-r32-3').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-3').first().click()
  await expect(page.getByTestId('clear-score-r32-3')).toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 2. Cascade: clearScore num jogo de grupo ────────────────────────────
test('@slow cascade: limpar placar de grupo limpa r32 downstream', async ({ page }) => {
  test.slow()
  // A1=2-0 (MEX wins) + A3=0-2 (KOR wins) → KOR 1st by H2H
  // clear A3 → KOR loses pts → MEX becomes 1st → cascade on r32-1
  await injectState(page, {
    A1:{home:2,away:0},
    A3:{home:0,away:2},
    'r32-1': { home: 2, away: 1 },
  })

  await openGroupModal(page, 'A')
  await ensureExpanded(page, 'A3')
  await page.getByTestId('clear-score-A3').click()
  await closeModal(page)

  // r32-1 deve ter sido limpo
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 3. Cascade: pickGroupOrder ───────────────────────────────────────────
test('@slow cascade: GroupPositionPicker reordena A → r32-1 e r32-2 limpos', async ({ page }) => {
  test.slow()
  await injectState(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
    'r32-2': { home: 1, away: 0 },
  })

  // Abrir modal (picker já está aberto por defeito)
  await page.getByTestId('group-card-A').click()
  await page.getByRole('heading', { name: 'Grupo A' }).waitFor()

  // Mover RSA (idx=1) para 1º usando up-btn-1
  await page.getByTestId('up-btn-1').click()
  await page.getByTestId('simulate-order').click()
  await closeModal(page)

  // r32-1 e r32-2 devem ter sido limpos
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByTestId('bracket-match-r32-2').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-2').first().click()
  await expect(page.getByTestId('clear-score-r32-2')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 4. Cascade: mudança de margem sem mudar standings ───────────────────
test('@slow cascade: alterar margem sem mudar 1º/2º preserva knockout', async ({ page }) => {
  test.slow()
  await injectState(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  // Alterar A1 de 2-0 para 3-0 (MEX continua 1º)
  await openGroupModal(page, 'A')
  await ensureExpanded(page, 'A1')
  await page.getByTestId('home-plus-A1').click()
  await closeModal(page)

  // r32-1 deve estar intacto
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 5. Empate bloqueado no KnockoutMatchModal ───────────────────────────
test('@slow empate bloqueado: 1-1 desactiva botão Confirmar', async ({ page }) => {
  test.slow()
  await injectState(page, { ...GROUP_A_MEX_WINS })

  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()

  // Mudar para modo exact primeiro (default é winner)
  await page.getByTestId('mode-exact').click()
  await page.getByTestId('mode-exact').waitFor()

  // Incrementar home e away para 1-1 (default é 1-0)
  await page.getByTestId(`away-plus-r32-1`).click()

  // Botão Confirmar deve estar disabled e mensagem de empate visível
  await expect(page.getByTestId('confirm-r32-1')).toBeDisabled()
  await expect(page.locator('text=Empate inválido')).toBeVisible()

  await page.keyboard.press('Escape')
})

// ─── 6. Slot nulo no KnockoutMatchModal ──────────────────────────────────
// r16 slots depend on r32 winners — with no r32 scores, teams are null
test('@slow slot nulo: r16-1 sem r32 preenchidos mostra aviso', async ({ page }) => {
  test.slow()
  // Inject only group scores so r32 slots have teams, but r16 slots are null
  await injectState(page, { ...GROUP_A_MEX_WINS })

  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r16-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r16-1').first().click()

  await expect(page.locator('text=Aguarda resultado anterior')).toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 7. "Limpar tudo" com estado completo ────────────────────────────────
test('@slow limpar tudo: estado completo → tudo vazio', async ({ page }) => {
  test.slow()
  await injectState(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  // Handle the window.confirm dialog
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTestId('reset-all-btn').click()

  // Verificar que Grupo A não tem scores
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')

  // Verificar que r32-1 não tem score
  await page.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page.getByTestId('bracket-match-r32-1').first().click()
  await expect(page.getByTestId('clear-score-r32-1')).not.toBeVisible()
  await page.keyboard.press('Escape')
})

// ─── 8. URL com base64 inválido ──────────────────────────────────────────
test('@slow URL inválida: base64 corrompido → app funcional sem crash', async ({ page }) => {
  test.slow()
  await page.goto('/?s=!!!INVALID_BASE64!!!')

  await expect(page.getByTestId('group-card-A')).toBeVisible()
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')
})

// ─── 9. URL com JSON válido mas schema errado ────────────────────────────
test('@slow URL inválida: JSON válido mas schema errado → estado vazio', async ({ page }) => {
  test.slow()
  const badPayload = btoa(JSON.stringify({ foo: 'bar' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  await page.goto(`/?s=${badPayload}`)

  await expect(page.getByTestId('group-card-A')).toBeVisible()
  await expect(page.getByTestId('group-card-A')).toContainText('0/6')
})

// ─── 10. Share URL restaura knockout scores ───────────────────────────────
test('@slow share: URL restaura grupos E knockout em nova página', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await injectState(page, {
    ...GROUP_A_MEX_WINS,
    'r32-1': { home: 2, away: 1 },
  })

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Copiado!')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  expect(sharedUrl).toMatch(/\?s=/)

  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)
  await page2.waitForLoadState('networkidle')

  // Verificar standings de grupo A restauradas
  await expect(page2.getByTestId('group-card-A').getByRole('row').nth(1)).toContainText('MEX')

  // Verificar score de knockout restaurado (r32-1 tem "Limpar placar")
  await page2.getByText('FASE ELIMINATÓRIA').scrollIntoViewIfNeeded()
  await page2.getByTestId('bracket-match-r32-1').first().scrollIntoViewIfNeeded()
  await page2.getByTestId('bracket-match-r32-1').first().click()
  await expect(page2.getByTestId('clear-score-r32-1')).toBeVisible()
  await page2.keyboard.press('Escape')
})

// ─── 11. thirdQualifiers NÃO persistem na share URL ─────────────────────
test('@slow share: thirdQualifiers não persistem na URL (comportamento esperado)', async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.getByTestId('share-button').click()
  await expect(page.getByTestId('share-button')).toContainText('Copiado!')

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  const page2 = await context.newPage()
  await page2.addInitScript(() => localStorage.removeItem('wcp2026-state'))
  await page2.goto(sharedUrl)
  await page2.waitForLoadState('networkidle')

  // thirdQualifiers devem estar vazios na nova página
  const state = await page2.evaluate(() => {
    const raw = localStorage.getItem('wcp2026-state')
    if (!raw) return null
    return JSON.parse(raw)
  })
  const qualifiers = state?.state?.thirdQualifiers ?? []
  expect(qualifiers).toEqual([])
})
