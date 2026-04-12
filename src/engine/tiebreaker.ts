import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'

export function applyTiebreakers(
  tied: Standing[],
  scores: ScoreMap,
  group: Group,
): Standing[] {
  // Stub — returns teams in draw order (FIFA final fallback)
  // Full implementation (H2H, GD cascade) comes in Task 3
  return [...tied].sort(
    (a, b) => group.teams.indexOf(a.teamCode) - group.teams.indexOf(b.teamCode),
  )
}
