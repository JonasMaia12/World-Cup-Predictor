import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing } from './types'

export function applyTiebreakers(
  _tied: Standing[],
  _scores: ScoreMap,
  _group: Group,
): Standing[] {
  throw new Error('not implemented')
}
