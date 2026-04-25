// src/engine/cascade.test.ts
import { describe, it, expect } from 'vitest'
import { cascadeClearKnockout } from './cascade'
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

describe('cascadeClearKnockout — ScoreMap vazio', () => {
  it('retorna ScoreMap vazio sem crash', () => {
    const oldStandings = computeAllStandings(GROUP_A_MEX_WINS)
    const newStandings = computeAllStandings({ A1: { home: 0, away: 3 } })
    const result = cascadeClearKnockout('A', oldStandings, newStandings, {}, [])
    expect(result).toEqual({})
  })
})
