import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'
import { simulateMissingMatches } from '@/engine/simulator'
import { FIXTURES, TEAMS } from '@/data/wc2026'

export interface TournamentSlice {
  scores: ScoreMap
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
  clearScore: (matchId: string) => void
  simulateMissing: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  setScores: (scores) => set({ scores }),
  resetScores: () => set({ scores: {} }),
  clearScore: (matchId) =>
    set((state) => {
      const { [matchId]: _removed, ...rest } = state.scores
      return { scores: rest }
    }),
  simulateMissing: () =>
    set((state) => ({
      scores: simulateMissingMatches(FIXTURES, state.scores, TEAMS),
    })),
})
