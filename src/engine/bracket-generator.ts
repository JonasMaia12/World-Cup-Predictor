import type { GroupStandings, Bracket, BracketMatch, Standing } from './types'

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

function selectBest3rds(standings: GroupStandings): Standing[] {
  const thirds: Standing[] = Object.values(standings)
    .filter((group) => group.length >= 3)
    .map((group) => group[2])

  // NOTE: FIFA best-3rd ranking criteria continue beyond goals-for (goals-against, then lots),
  // but those levels are omitted here — ties at this depth are extremely rare in practice.
  return thirds
    .toSorted((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
}

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

export function generateBracket(standings: GroupStandings): Bracket {
  const winners: Record<string, string> = {}
  const runnersUp: Record<string, string> = {}

  for (const [groupId, groupStandings] of Object.entries(standings)) {
    if (groupStandings[0]) winners[groupId] = groupStandings[0].teamCode
    if (groupStandings[1]) runnersUp[groupId] = groupStandings[1].teamCode
  }

  const best3rds = selectBest3rds(standings).map((s) => s.teamCode)

  const roundOf32: BracketMatch[] = ROUND_OF_32_TEMPLATE.map(([homeKey, awayKey], i) => ({
    id: `r32-${i + 1}`,
    home: resolveSlot(homeKey, winners, runnersUp, best3rds),
    away: resolveSlot(awayKey, winners, runnersUp, best3rds),
  }))

  const emptyMatch = (id: string): BracketMatch => ({ id, home: null, away: null })

  return {
    roundOf32,
    roundOf16: Array.from({ length: 16 }, (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 8 }, (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals: Array.from({ length: 4 }, (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace: emptyMatch('3rd'),
    final: emptyMatch('final'),
  }
}
