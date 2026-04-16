import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'

export interface TournamentSlice {
  scores: ScoreMap
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  setScores: (scores) => set({ scores }),
  resetScores: () => set({ scores: {} }),
})
