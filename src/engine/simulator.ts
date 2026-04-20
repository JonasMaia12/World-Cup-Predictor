import type { Match, Team } from '@/data/wc2026'
import type { ScoreMap } from './types'

const LAMBDA_BASE = 1.35
const HOME_ADVANTAGE = 1.1

export function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

export function simulateMatch(homeRank: number, awayRank: number): { home: number; away: number } {
  const lambdaHome = LAMBDA_BASE * Math.pow(awayRank / homeRank, 0.4) * HOME_ADVANTAGE
  const lambdaAway = LAMBDA_BASE * Math.pow(homeRank / awayRank, 0.4)
  return {
    home: poissonRandom(lambdaHome),
    away: poissonRandom(lambdaAway),
  }
}

export function simulateMissingMatches(
  fixtures: Match[],
  scores: ScoreMap,
  teams: Team[],
): ScoreMap {
  const result: ScoreMap = { ...scores }
  for (const fixture of fixtures) {
    if (result[fixture.id] !== undefined) continue
    const homeTeam = teams.find((t) => t.code === fixture.homeTeam)
    const awayTeam = teams.find((t) => t.code === fixture.awayTeam)
    if (!homeTeam || !awayTeam) throw new Error(`Team not found for fixture ${fixture.id}`)

    result[fixture.id] = simulateMatch(homeTeam.rank, awayTeam.rank)
  }
  return result
}

export function simulateKnockoutMatch(
  homeCode: string,
  awayCode: string,
  teams: Team[],
  forcedWinner?: string,
): { home: number; away: number } {
  const homeTeam = teams.find((t) => t.code === homeCode)
  const awayTeam = teams.find((t) => t.code === awayCode)

  if (!homeTeam || !awayTeam) {
    return forcedWinner === awayCode ? { home: 0, away: 1 } : { home: 1, away: 0 }
  }

  const MAX_ATTEMPTS = 20
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = simulateMatch(homeTeam.rank, awayTeam.rank)
    if (result.home === result.away) continue
    if (!forcedWinner) return result
    if (forcedWinner === homeCode && result.home > result.away) return result
    if (forcedWinner === awayCode && result.away > result.home) return result
  }

  // Fallback after MAX_ATTEMPTS (guarantees a result even in extreme rank scenarios)
  if (forcedWinner === awayCode) return { home: 0, away: 1 }
  return { home: 1, away: 0 }
}
