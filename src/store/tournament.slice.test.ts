import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { createTournamentSlice, type TournamentSlice } from './tournament.slice'
import { FIXTURES, TEAMS } from '@/data/wc2026'

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
