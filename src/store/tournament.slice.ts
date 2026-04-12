import type { StateCreator } from 'zustand'

export interface TournamentSlice {
  scores: Record<string, { home: number; away: number }>
  setScore: (matchId: string, home: number, away: number) => void
  resetScores: () => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),
  resetScores: () => set({ scores: {} }),
})
