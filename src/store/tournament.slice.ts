import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'
import { simulateMissingMatches, simulateKnockoutMatch } from '@/engine/simulator'
import { generateGroupScoresForOrder } from '@/engine/group-position'
import { FIXTURES, TEAMS } from '@/data/wc2026'

export interface TournamentSlice {
  scores: ScoreMap
  thirdQualifiers: string[]
  setScore: (matchId: string, home: number, away: number) => void
  setScores: (scores: ScoreMap) => void
  resetScores: () => void
  resetAll: () => void
  clearScore: (matchId: string) => void
  simulateMissing: () => void
  simulateKnockoutWinner: (
    matchId: string,
    homeCode: string,
    awayCode: string,
    winnerCode: string,
  ) => void
  pickGroupOrder: (groupId: string, orderedTeams: string[]) => void
  addThirdQualifier: (groupId: string) => void
  removeThirdQualifier: (groupId: string) => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  thirdQualifiers: [],

  setScore: (matchId, home, away) =>
    set((state) => ({
      scores: { ...state.scores, [matchId]: { home, away } },
    })),

  setScores: (scores) => set({ scores }),

  resetScores: () => set({ scores: {} }),

  resetAll: () => set({ scores: {}, thirdQualifiers: [] }),

  clearScore: (matchId) =>
    set((state) => {
      const { [matchId]: _removed, ...rest } = state.scores
      return { scores: rest }
    }),

  simulateMissing: () =>
    set((state) => ({
      scores: simulateMissingMatches(FIXTURES, state.scores, TEAMS),
    })),

  simulateKnockoutWinner: (matchId, homeCode, awayCode, winnerCode) =>
    set((state) => ({
      scores: {
        ...state.scores,
        [matchId]: simulateKnockoutMatch(homeCode, awayCode, TEAMS, winnerCode),
      },
    })),

  pickGroupOrder: (groupId, orderedTeams) =>
    set((state) => {
      const fixtures = FIXTURES.filter((f) => f.group === groupId)
      const newScores = generateGroupScoresForOrder(orderedTeams, fixtures, TEAMS)
      return { scores: { ...state.scores, ...newScores } }
    }),

  addThirdQualifier: (groupId) =>
    set((state) => {
      if (state.thirdQualifiers.includes(groupId) || state.thirdQualifiers.length >= 8) {
        return state
      }
      return { thirdQualifiers: [...state.thirdQualifiers, groupId] }
    }),

  removeThirdQualifier: (groupId) =>
    set((state) => ({
      thirdQualifiers: state.thirdQualifiers.filter((id) => id !== groupId),
    })),
})
