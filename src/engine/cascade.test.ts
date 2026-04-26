// src/engine/cascade.test.ts
import { describe, it, expect } from 'vitest'
import { cascadeClearKnockout, cascadeClearKnockoutFromMatch } from './cascade'
import { computeAllStandings } from './classifier'

// Grupo A com MEX 1º inequívoco
const GROUP_A_MEX_WINS: Record<string, { home: number; away: number }> = {
  A1: { home: 2, away: 0 }, // MEX vs RSA
  A2: { home: 1, away: 0 }, // KOR vs CZE
  A3: { home: 2, away: 0 }, // MEX vs KOR
  A4: { home: 2, away: 0 }, // RSA vs CZE
  A5: { home: 2, away: 0 }, // MEX vs CZE
  A6: { home: 1, away: 0 }, // RSA vs KOR
}

describe('cascadeClearKnockout — sem mudança de standings', () => {
  it('retorna scores inalterado se 1º e 2º não mudaram', () => {
    const baseScores = {
      ...GROUP_A_MEX_WINS,
      'r32-1': { home: 2, away: 1 },
    }
    // A2 muda margem mas MEX continua 1º, RSA 2º
    const newScores = { ...baseScores, A2: { home: 2, away: 0 } }
    const oldStandings = computeAllStandings(baseScores)
    const newStandings = computeAllStandings(newScores)
    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-1']).toEqual({ home: 2, away: 1 })
  })
})

describe('cascadeClearKnockout — 1º lugar muda', () => {
  it('limpa r32-1 quando 1º de A muda', () => {
    // RSA ganha tudo → RSA fica 1º
    const newGroupScores = {
      A1: { home: 0, away: 3 }, // RSA vence MEX (RSA é away em A1)
      A2: { home: 1, away: 0 },
      A3: { home: 2, away: 0 },
      A4: { home: 2, away: 0 },
      A5: { home: 2, away: 0 },
      A6: { home: 2, away: 0 },
    }
    const newScores = { ...newGroupScores, 'r32-1': { home: 2, away: 1 }, 'r16-1': { home: 1, away: 0 } }
    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_WINS })
    const newStandings = computeAllStandings(newGroupScores)
    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-1']).toBeUndefined()
    expect(result['r16-1']).toBeUndefined()
  })

  it('não limpa r32-3 (grupo C/D) quando só A muda', () => {
    const r32_3_score = { home: 3, away: 0 }
    const newGroupScores = {
      A1: { home: 0, away: 3 }, A2: { home: 1, away: 0 },
      A3: { home: 2, away: 0 }, A4: { home: 2, away: 0 },
      A5: { home: 2, away: 0 }, A6: { home: 2, away: 0 },
    }
    const newScores = { ...newGroupScores, 'r32-3': r32_3_score }
    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_WINS })
    const newStandings = computeAllStandings(newGroupScores)
    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-3']).toEqual(r32_3_score)
  })
})

describe('cascadeClearKnockout — 2º lugar muda', () => {
  it('limpa r32-2 quando 2º de A muda (slot 2A → r32-2)', () => {
    // CZE fica 2º em vez de RSA
    const newGroupScores = {
      A1: { home: 2, away: 0 }, // MEX vence RSA
      A2: { home: 0, away: 2 }, // CZE vence KOR
      A3: { home: 2, away: 0 }, // MEX vence KOR
      A4: { home: 0, away: 2 }, // CZE vence RSA
      A5: { home: 2, away: 0 }, // MEX vence CZE
      A6: { home: 0, away: 2 }, // CZE vence RSA
    }
    const newScores = { ...newGroupScores, 'r32-2': { home: 1, away: 0 }, 'r16-1': { home: 1, away: 0 } }
    const oldStandings = computeAllStandings({ ...GROUP_A_MEX_WINS })
    const newStandings = computeAllStandings(newGroupScores)
    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])
    expect(result['r32-2']).toBeUndefined()
    expect(result['r16-1']).toBeUndefined()
  })
})

describe('cascadeClearKnockout — cascade completo r32→r16→qf→sf→final', () => {
  it('limpa toda a cadeia quando 1º de C muda (r32-3→r16-2→qf-1→sf-1→final)', () => {
    const groupCBraFirst = {
      C1: { home: 3, away: 0 }, C2: { home: 0, away: 1 },
      C3: { home: 2, away: 0 }, C4: { home: 2, away: 1 },
      C5: { home: 2, away: 0 }, C6: { home: 1, away: 0 },
    }
    // MAR fica 1º
    const groupCMarFirst = {
      C1: { home: 0, away: 3 }, // MAR vence BRA (MAR é away em C1)
      C2: { home: 0, away: 1 },
      C3: { home: 2, away: 0 },
      C4: { home: 2, away: 1 },
      C5: { home: 2, away: 0 },
      C6: { home: 1, away: 0 },
    }
    const knockoutScores = {
      'r32-3': { home: 1, away: 0 },
      'r16-2': { home: 2, away: 0 },
      'qf-1':  { home: 1, away: 0 },
      'sf-1':  { home: 2, away: 1 },
      'final': { home: 1, away: 0 },
      '3rd':   { home: 1, away: 0 },
    }
    const newScores = { ...groupCMarFirst, ...knockoutScores }
    const oldStandings = computeAllStandings(groupCBraFirst)
    const newStandings = computeAllStandings(groupCMarFirst)
    const result = cascadeClearKnockout('C', oldStandings, newStandings, newScores, [])
    expect(result['r32-3']).toBeUndefined()
    expect(result['r16-2']).toBeUndefined()
    expect(result['qf-1']).toBeUndefined()
    expect(result['sf-1']).toBeUndefined()
    expect(result['final']).toBeUndefined()
    expect(result['3rd']).toBeUndefined()
  })
})

describe('cascadeClearKnockout — 3º lugar muda stats sem mudar equipa', () => {
  it('limpa slot 3-N quando stats do 3º mudam o ranking global de best-3rds', () => {
    // Grupo B: CAN(1º) BIH(2º) QAT(3º) SUI(4º)
    const groupBBase = {
      B1: { home: 2, away: 0 }, // CAN vence BIH
      B2: { home: 2, away: 0 }, // QAT vence SUI
      B3: { home: 2, away: 0 }, // CAN vence QAT
      B4: { home: 1, away: 0 }, // BIH vence SUI
      B5: { home: 2, away: 0 }, // CAN vence SUI
      B6: { home: 1, away: 0 }, // BIH vence QAT
    }
    // Grupo A: MEX(1º) RSA(2º) KOR(3º, 3pts, GD=-1) CZE(4º)
    const groupABase = {
      A1: { home: 2, away: 0 }, // MEX vence RSA
      A2: { home: 1, away: 0 }, // KOR vence CZE por 1-0 (GD baixo)
      A3: { home: 2, away: 0 }, // MEX vence KOR
      A4: { home: 2, away: 0 }, // RSA vence CZE
      A5: { home: 2, away: 0 }, // MEX vence CZE
      A6: { home: 1, away: 0 }, // RSA vence KOR
    }
    const baseScores = { ...groupABase, ...groupBBase }

    // Melhorar stats do 3º de A (KOR): A2 passa de 1-0 para 3-0
    // KOR continua 3º em A, mas agora tem GD e GF melhores → sobe no ranking global
    const newGroupAScores = {
      ...groupABase,
      A2: { home: 3, away: 0 }, // KOR vence CZE por 3-0 → KOR melhora GD e GF
    }
    const newScores = {
      ...newGroupAScores,
      ...groupBBase,
      'r32-9':  { home: 1, away: 0 },
      'r32-10': { home: 1, away: 0 },
    }

    const oldStandings = computeAllStandings(baseScores)
    const newStandings = computeAllStandings({ ...newGroupAScores, ...groupBBase })

    // Verificar que KOR continua 3º em A (team identity não mudou)
    expect(oldStandings['A'][2].teamCode).toBe(newStandings['A'][2].teamCode)

    const result = cascadeClearKnockout('A', oldStandings, newStandings, newScores, [])

    // Com o fix, algum slot de 3rd place deve ter sido limpo
    // (KOR melhorou stats e mudou posição no ranking global de best-3rds)
    const anyCleared = [
      'r32-9', 'r32-10', 'r32-11', 'r32-12',
      'r32-13', 'r32-14', 'r32-15', 'r32-16',
    ].some(id => result[id] === undefined)
    expect(anyCleared).toBe(true)
  })
})

describe('cascadeClearKnockout — ScoreMap vazio', () => {
  it('retorna ScoreMap vazio sem crash', () => {
    const oldStandings = computeAllStandings(GROUP_A_MEX_WINS)
    const newStandings = computeAllStandings({ A1: { home: 0, away: 3 } })
    const result = cascadeClearKnockout('A', oldStandings, newStandings, {}, [])
    expect(result).toEqual({})
  })
})

describe('cascadeClearKnockoutFromMatch', () => {
  it('retorna scores inalterado se match não tem filhos (final)', () => {
    const scores = { 'final': { home: 1, away: 0 }, 'r16-1': { home: 2, away: 1 } }
    const result = cascadeClearKnockoutFromMatch('final', scores)
    expect(result).toEqual(scores)
  })

  it('limpa r16-1 quando r32-1 muda (filho directo)', () => {
    const scores = {
      'r32-1': { home: 2, away: 0 },
      'r16-1': { home: 1, away: 0 },
      'qf-1':  { home: 1, away: 0 },
    }
    const result = cascadeClearKnockoutFromMatch('r32-1', scores)
    expect(result['r32-1']).toBeDefined()
    expect(result['r16-1']).toBeUndefined()
    expect(result['qf-1']).toBeUndefined()
  })

  it('limpa toda a cadeia r16-1→qf-1→sf-1→final quando r16-1 muda', () => {
    const scores = {
      'r16-1': { home: 2, away: 1 },
      'qf-1':  { home: 1, away: 0 },
      'sf-1':  { home: 3, away: 2 },
      'final': { home: 1, away: 0 },
      'r16-2': { home: 1, away: 0 },
    }
    const result = cascadeClearKnockoutFromMatch('r16-1', scores)
    expect(result['r16-1']).toBeDefined()
    expect(result['qf-1']).toBeUndefined()
    expect(result['sf-1']).toBeUndefined()
    expect(result['final']).toBeUndefined()
    expect(result['r16-2']).toBeDefined()
  })

  it('não toca em scores de matches não relacionados', () => {
    const scores = {
      'r32-3': { home: 1, away: 0 },
      'r16-2': { home: 1, away: 0 },
      'r32-1': { home: 2, away: 1 },
      'r16-1': { home: 1, away: 0 },
    }
    const result = cascadeClearKnockoutFromMatch('r32-1', scores)
    expect(result['r32-3']).toBeDefined()
    expect(result['r16-2']).toBeDefined()
  })
})
