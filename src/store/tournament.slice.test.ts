import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { createTournamentSlice, type TournamentSlice } from './tournament.slice'
import { FIXTURES, GROUPS } from '@/data/wc2026'

function makeStore() {
  return create<TournamentSlice>()((...a) => createTournamentSlice(...a))
}

describe('TournamentSlice — setScores', () => {
  it('populates multiple scores at once', () => {
    const store = makeStore()
    const scores = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
    }
    store.getState().setScores(scores)
    expect(store.getState().scores).toEqual(scores)
  })

  it('overwrites existing scores', () => {
    const store = makeStore()
    store.getState().setScore('A1', 3, 1)
    store.getState().setScores({ A1: { home: 0, away: 0 }, A2: { home: 2, away: 2 } })
    expect(store.getState().scores).toEqual({
      A1: { home: 0, away: 0 },
      A2: { home: 2, away: 2 },
    })
  })

  it('setScores({}) resets to empty', () => {
    const store = makeStore()
    store.getState().setScore('A1', 1, 0)
    store.getState().setScores({})
    expect(store.getState().scores).toEqual({})
  })
})

describe('TournamentSlice — clearScore', () => {
  it('remove o score de um jogo específico, mantendo os demais', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 1)
    store.getState().setScore('A2', 0, 0)
    store.getState().clearScore('A1')
    expect(store.getState().scores['A1']).toBeUndefined()
    expect(store.getState().scores['A2']).toEqual({ home: 0, away: 0 })
  })

  it('não lança erro ao tentar limpar jogo que já está em branco', () => {
    const store = makeStore()
    expect(() => store.getState().clearScore('A1')).not.toThrow()
    expect(store.getState().scores['A1']).toBeUndefined()
  })
})

describe('TournamentSlice — simulateMissing', () => {
  it('preenche todos os jogos em branco sem sobrescrever os existentes', () => {
    const store = makeStore()
    store.getState().setScore('A1', 3, 0)
    store.getState().simulateMissing()
    const scores = store.getState().scores
    expect(scores['A1']).toEqual({ home: 3, away: 0 })
    expect(Object.keys(scores)).toHaveLength(72)
  })
})

describe('TournamentSlice — resetAll', () => {
  it('clears all scores and thirdQualifiers', () => {
    const store = makeStore()
    store.getState().setScore('A1', 2, 1)
    store.getState().addThirdQualifier('A')
    store.getState().resetAll()
    expect(store.getState().scores).toEqual({})
    expect(store.getState().thirdQualifiers).toEqual([])
  })
})

describe('TournamentSlice — simulateKnockoutWinner', () => {
  it('stores a score where the forced winner wins (home wins)', () => {
    const store = makeStore()
    store.getState().simulateKnockoutWinner('r32-1', 'ARG', 'BRA', 'ARG')
    const score = store.getState().scores['r32-1']
    expect(score).toBeDefined()
    expect(score.home).toBeGreaterThan(score.away)
  })

  it('stores a score where the forced winner wins (away wins)', () => {
    const store = makeStore()
    store.getState().simulateKnockoutWinner('r32-1', 'ARG', 'BRA', 'BRA')
    const score = store.getState().scores['r32-1']
    expect(score).toBeDefined()
    expect(score.away).toBeGreaterThan(score.home)
  })
})

describe('TournamentSlice — pickGroupOrder', () => {
  it('writes scores for all 6 group fixtures', () => {
    const store = makeStore()
    const group = GROUPS.find((g) => g.id === 'A')!
    store.getState().pickGroupOrder('A', [...group.teams].reverse())
    const aFixtures = FIXTURES.filter((f) => f.group === 'A')
    const scores = store.getState().scores
    expect(aFixtures.every((f) => scores[f.id] !== undefined)).toBe(true)
  })

  it('overwrites existing group scores but leaves other groups untouched', () => {
    const store = makeStore()
    store.getState().setScore('B1', 3, 3)
    const group = GROUPS.find((g) => g.id === 'A')!
    store.getState().pickGroupOrder('A', group.teams)
    expect(store.getState().scores['B1']).toEqual({ home: 3, away: 3 })
  })
})

describe('TournamentSlice — addThirdQualifier / removeThirdQualifier', () => {
  it('adds a group to thirdQualifiers', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    expect(store.getState().thirdQualifiers).toContain('A')
  })

  it('does not add duplicate', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    store.getState().addThirdQualifier('A')
    expect(store.getState().thirdQualifiers).toHaveLength(1)
  })

  it('blocks adding a 9th qualifier (max is 8)', () => {
    const store = makeStore()
    for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      store.getState().addThirdQualifier(id)
    }
    store.getState().addThirdQualifier('I')
    expect(store.getState().thirdQualifiers).toHaveLength(8)
    expect(store.getState().thirdQualifiers).not.toContain('I')
  })

  it('removes a group from thirdQualifiers', () => {
    const store = makeStore()
    store.getState().addThirdQualifier('A')
    store.getState().removeThirdQualifier('A')
    expect(store.getState().thirdQualifiers).not.toContain('A')
  })
})
