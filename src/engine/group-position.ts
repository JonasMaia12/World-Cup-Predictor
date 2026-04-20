import type { Match, Team } from '@/data/wc2026'
import type { ScoreMap } from './types'
import { simulateKnockoutMatch } from './simulator'

// Returns ScoreMap for all fixtures in a group such that final standings
// match orderedTeams (index 0 = 1st place, index 3 = 4th place).
// Each match is simulated via Poisson with the higher-positioned team forced to win.
// This guarantees distinct point totals (9/6/3/0), so no tiebreaker ambiguity arises.
export function generateGroupScoresForOrder(
  orderedTeams: string[],
  fixtures: Match[],
  teams: Team[],
): ScoreMap {
  const scores: ScoreMap = {}
  for (const fixture of fixtures) {
    const homePos = orderedTeams.indexOf(fixture.homeTeam)
    const awayPos = orderedTeams.indexOf(fixture.awayTeam)
    const forcedWinner = homePos < awayPos ? fixture.homeTeam : fixture.awayTeam
    scores[fixture.id] = simulateKnockoutMatch(
      fixture.homeTeam,
      fixture.awayTeam,
      teams,
      forcedWinner,
    )
  }
  return scores
}
