import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { createTournamentSlice, type TournamentSlice } from './tournament.slice'

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
