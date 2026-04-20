import type { GroupStandings, Bracket, BracketMatch, Standing, ScoreMap } from './types'

// FIFA 2026 Round of 32 slot template — 16 matches, 32 unique slots.
// Slot keys: '1A'=winner of A, '2B'=runner-up of B, '3-N'=Nth best 3rd place.
// Structure: 8 cross-group W vs R + 4 W vs best-3rd + 4 R vs best-3rd = 12W + 12R + 8T
// NOTE: exact cross-group pairings follow FIFA 2026 official bracket structure.
const ROUND_OF_32_TEMPLATE: Array<[string, string]> = [
  // Winner vs Runner-Up (8 matches)
  ['1A', '2B'], ['1B', '2A'],
  ['1C', '2D'], ['1D', '2C'],
  ['1E', '2F'], ['1F', '2E'],
  ['1G', '2H'], ['1H', '2G'],
  // Winner vs Best-3rd (4 matches)
  ['1I', '3-1'], ['1J', '3-2'],
  ['1K', '3-3'], ['1L', '3-4'],
  // Runner-Up vs Best-3rd (4 matches)
  ['2I', '3-5'], ['2J', '3-6'],
  ['2K', '3-7'], ['2L', '3-8'],
]

export function advanceWinner(matchId: string, scores: ScoreMap): 'home' | 'away' | null {
  const score = scores[matchId]
  if (!score) return null
  if (score.home === score.away) return null
  return score.home > score.away ? 'home' : 'away'
}

function pickSide(match: BracketMatch, side: 'home' | 'away' | null): string | null {
  if (!side) return null
  return side === 'home' ? match.home : match.away
}

function selectBest3rds(standings: GroupStandings): Standing[] {
  const thirds: Standing[] = Object.values(standings)
    .filter((group) => group.length >= 3)
    .map((group) => group[2])

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
}

function selectBest3rdsFromGroups(standings: GroupStandings, groupIds: string[]): string[] {
  const thirds = groupIds
    .map((id) => standings[id]?.[2])
    .filter((s): s is Standing => s !== undefined)

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
    .map((s) => s.teamCode)
}

// key format: '1X'=winner of group X, '2X'=runner-up, '3-N'=Nth best 3rd (1-indexed)
function resolveSlot(
  key: string,
  winners: Record<string, string>,
  runnersUp: Record<string, string>,
  best3rds: string[],
): string | null {
  if (key.startsWith('1')) return winners[key[1]] ?? null
  if (key.startsWith('2')) return runnersUp[key[1]] ?? null
  if (key.startsWith('3-')) return best3rds[parseInt(key.slice(2)) - 1] ?? null
  return null
}

export function generateBracket(
  standings: GroupStandings,
  scores: ScoreMap = {},
  thirdQualifiers?: string[],
): Bracket {
  const winners: Record<string, string> = {}
  const runnersUp: Record<string, string> = {}

  for (const [groupId, groupStandings] of Object.entries(standings)) {
    if (groupStandings[0]) winners[groupId] = groupStandings[0].teamCode
    if (groupStandings[1]) runnersUp[groupId] = groupStandings[1].teamCode
  }

  const best3rds =
    thirdQualifiers && thirdQualifiers.length > 0
      ? selectBest3rdsFromGroups(standings, thirdQualifiers)
      : selectBest3rds(standings).map((s) => s.teamCode)

  const roundOf32: BracketMatch[] = ROUND_OF_32_TEMPLATE.map(([homeKey, awayKey], i) => ({
    id: `r32-${i + 1}`,
    home: resolveSlot(homeKey, winners, runnersUp, best3rds),
    away: resolveSlot(awayKey, winners, runnersUp, best3rds),
  }))

  const roundOf16: BracketMatch[] = Array.from({ length: 8 }, (_, i) => ({
    id: `r16-${i + 1}`,
    home: pickSide(roundOf32[i * 2], advanceWinner(roundOf32[i * 2].id, scores)),
    away: pickSide(roundOf32[i * 2 + 1], advanceWinner(roundOf32[i * 2 + 1].id, scores)),
  }))

  const quarterFinals: BracketMatch[] = Array.from({ length: 4 }, (_, i) => ({
    id: `qf-${i + 1}`,
    home: pickSide(roundOf16[i * 2], advanceWinner(roundOf16[i * 2].id, scores)),
    away: pickSide(roundOf16[i * 2 + 1], advanceWinner(roundOf16[i * 2 + 1].id, scores)),
  }))

  const semiFinals: BracketMatch[] = Array.from({ length: 2 }, (_, i) => ({
    id: `sf-${i + 1}`,
    home: pickSide(quarterFinals[i * 2], advanceWinner(quarterFinals[i * 2].id, scores)),
    away: pickSide(quarterFinals[i * 2 + 1], advanceWinner(quarterFinals[i * 2 + 1].id, scores)),
  }))

  const sf0 = semiFinals[0]
  const sf1 = semiFinals[1]
  const sf0Winner = advanceWinner(sf0.id, scores)
  const sf1Winner = advanceWinner(sf1.id, scores)

  const final: BracketMatch = {
    id: 'final',
    home: pickSide(sf0, sf0Winner),
    away: pickSide(sf1, sf1Winner),
  }

  const thirdPlace: BracketMatch = {
    id: '3rd',
    home: sf0Winner ? (sf0Winner === 'home' ? sf0.away : sf0.home) : null,
    away: sf1Winner ? (sf1Winner === 'home' ? sf1.away : sf1.home) : null,
  }

  return { roundOf32, roundOf16, quarterFinals, semiFinals, thirdPlace, final }
}
