import { FIXTURES } from '@/data/wc2026'
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'

export function applyTiebreakers(
  tied: Standing[],
  scores: ScoreMap,
  group: Group,
): Standing[] {
  if (tied.length === 1) return tied

  const tiedCodes = new Set(tied.map((s) => s.teamCode))

  // Head-to-head fixtures among only the tied teams
  const h2hFixtures = FIXTURES.filter(
    (f) => f.group === group.id && tiedCodes.has(f.homeTeam) && tiedCodes.has(f.awayTeam),
  )

  const h2h: Record<string, { pts: number; gd: number; gf: number }> = {}
  for (const code of tiedCodes) h2h[code] = { pts: 0, gd: 0, gf: 0 }

  for (const f of h2hFixtures) {
    const score = scores[f.id]
    if (!score) continue
    h2h[f.homeTeam].gf += score.home
    h2h[f.homeTeam].gd += score.home - score.away
    h2h[f.awayTeam].gf += score.away
    h2h[f.awayTeam].gd += score.away - score.home
    if (score.home > score.away) {
      h2h[f.homeTeam].pts += 3
    } else if (score.away > score.home) {
      h2h[f.awayTeam].pts += 3
    } else {
      h2h[f.homeTeam].pts += 1
      h2h[f.awayTeam].pts += 1
    }
  }

  return [...tied].sort((a, b) => {
    // 1. H2H points
    const hPts = h2h[b.teamCode].pts - h2h[a.teamCode].pts
    if (hPts !== 0) return hPts
    // 2. H2H goal difference
    const hGd = h2h[b.teamCode].gd - h2h[a.teamCode].gd
    if (hGd !== 0) return hGd
    // 3. H2H goals scored
    const hGf = h2h[b.teamCode].gf - h2h[a.teamCode].gf
    if (hGf !== 0) return hGf
    // 4. Overall goal difference in group
    const gd = b.goalDiff - a.goalDiff
    if (gd !== 0) return gd
    // 5. Overall goals scored in group
    const gf = b.goalsFor - a.goalsFor
    if (gf !== 0) return gf
    // 6. Draw order (position in group.teams) — deterministic fallback
    return group.teams.indexOf(a.teamCode) - group.teams.indexOf(b.teamCode)
  })
}
