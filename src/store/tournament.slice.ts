import type { StateCreator } from 'zustand'
import type { ScoreMap } from '@/engine/types'
import { simulateMissingMatches, simulateKnockoutMatch } from '@/engine/simulator'
import { generateGroupScoresForOrder } from '@/engine/group-position'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { computeAllStandings } from '@/engine/classifier'
import { cascadeClearKnockout } from '@/engine/cascade'

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

function getGroupId(matchId: string): string | null {
  return /^[A-L]\d$/.test(matchId) ? matchId[0] : null
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set) => ({
  scores: {},
  thirdQualifiers: [],

  setScore: (matchId, home, away) =>
    set((state) => {
      const groupId = getGroupId(matchId)
      if (!groupId) {
        return { scores: { ...state.scores, [matchId]: { home, away } } }
      }
      const oldAllStandings = computeAllStandings(state.scores)
      const newScores = { ...state.scores, [matchId]: { home, away } }
      const newAllStandings = computeAllStandings(newScores)
      const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, newScores, state.thirdQualifiers)
      return { scores: cleanScores }
    }),

  setScores: (scores) => set({ scores }),

  resetScores: () => set({ scores: {} }),

  resetAll: () => set({ scores: {}, thirdQualifiers: [] }),

  clearScore: (matchId) =>
    set((state) => {
      const groupId = getGroupId(matchId)
      const { [matchId]: _removed, ...rest } = state.scores
      if (!groupId) {
        return { scores: rest }
      }
      const oldAllStandings = computeAllStandings(state.scores)
      const newAllStandings = computeAllStandings(rest)
      const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, rest, state.thirdQualifiers)
      return { scores: cleanScores }
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
      const merged = { ...state.scores, ...newScores }
      const oldAllStandings = computeAllStandings(state.scores)
      const newAllStandings = computeAllStandings(merged)
      const cleanScores = cascadeClearKnockout(groupId, oldAllStandings, newAllStandings, merged, state.thirdQualifiers)
      return { scores: cleanScores }
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
