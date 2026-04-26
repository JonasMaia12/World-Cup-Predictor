// src/engine/cascade.ts
import type { ScoreMap, Standing, GroupStandings } from './types'

// Mapeia 1º lugar de cada grupo → r32 match ID
const FIRST_TO_R32: Record<string, string> = {
  A: 'r32-1',  B: 'r32-2',  C: 'r32-3',  D: 'r32-4',
  E: 'r32-5',  F: 'r32-6',  G: 'r32-7',  H: 'r32-8',
  I: 'r32-9',  J: 'r32-10', K: 'r32-11', L: 'r32-12',
}

// Mapeia 2º lugar de cada grupo → r32 match ID
const SECOND_TO_R32: Record<string, string> = {
  A: 'r32-2',  B: 'r32-1',  C: 'r32-4',  D: 'r32-3',
  E: 'r32-6',  F: 'r32-5',  G: 'r32-8',  H: 'r32-7',
  I: 'r32-13', J: 'r32-14', K: 'r32-15', L: 'r32-16',
}

// 3-N slot (1-indexed) → r32 match ID
const THIRD_SLOT_TO_R32: Record<number, string> = {
  1: 'r32-9',  2: 'r32-10', 3: 'r32-11', 4: 'r32-12',
  5: 'r32-13', 6: 'r32-14', 7: 'r32-15', 8: 'r32-16',
}

// Grafo de dependências knockout
const KNOCKOUT_CHILDREN: Record<string, string[]> = {
  'r32-1':  ['r16-1'], 'r32-2':  ['r16-1'],
  'r32-3':  ['r16-2'], 'r32-4':  ['r16-2'],
  'r32-5':  ['r16-3'], 'r32-6':  ['r16-3'],
  'r32-7':  ['r16-4'], 'r32-8':  ['r16-4'],
  'r32-9':  ['r16-5'], 'r32-10': ['r16-5'],
  'r32-11': ['r16-6'], 'r32-12': ['r16-6'],
  'r32-13': ['r16-7'], 'r32-14': ['r16-7'],
  'r32-15': ['r16-8'], 'r32-16': ['r16-8'],
  'r16-1':  ['qf-1'],  'r16-2':  ['qf-1'],
  'r16-3':  ['qf-2'],  'r16-4':  ['qf-2'],
  'r16-5':  ['qf-3'],  'r16-6':  ['qf-3'],
  'r16-7':  ['qf-4'],  'r16-8':  ['qf-4'],
  'qf-1':   ['sf-1'],  'qf-2':   ['sf-1'],
  'qf-3':   ['sf-2'],  'qf-4':   ['sf-2'],
  'sf-1':   ['final', '3rd'],
  'sf-2':   ['final', '3rd'],
}

function best3rdCodes(allStandings: GroupStandings, thirdQualifiers: string[]): string[] {
  const thirds: Standing[] = thirdQualifiers.length > 0
    ? thirdQualifiers
        .map((id) => allStandings[id]?.[2])
        .filter((s): s is Standing => s !== undefined)
    : Object.values(allStandings)
        .filter((group) => group.length >= 3)
        .map((group) => group[2])

  return [...thirds]
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor
    )
    .slice(0, 8)
    .map((s) => s.teamCode)
}

function teamChanged(a: Standing | undefined, b: Standing | undefined): boolean {
  if (!a && !b) return false
  if (!a || !b) return true
  return a.teamCode !== b.teamCode
}

export function cascadeClearKnockout(
  groupId: string,
  oldAllStandings: GroupStandings,
  newAllStandings: GroupStandings,
  scores: ScoreMap,
  thirdQualifiers: string[],
): ScoreMap {
  const oldGroup = oldAllStandings[groupId] ?? []
  const newGroup = newAllStandings[groupId] ?? []

  const affected = new Set<string>()

  // 1º lugar mudou?
  if (teamChanged(oldGroup[0], newGroup[0])) {
    const r32 = FIRST_TO_R32[groupId]
    if (r32) affected.add(r32)
  }

  // 2º lugar mudou?
  if (teamChanged(oldGroup[1], newGroup[1])) {
    const r32 = SECOND_TO_R32[groupId]
    if (r32) affected.add(r32)
  }

  // 3º lugar — verificar se ranking de best-3rds mudou
  // (não apenas quando a equipa muda, mas também quando as suas stats mudam)
  const oldBest = best3rdCodes(oldAllStandings, thirdQualifiers)
  const newBest = best3rdCodes(newAllStandings, thirdQualifiers)
  for (let i = 0; i < 8; i++) {
    if (oldBest[i] !== newBest[i]) {
      const r32 = THIRD_SLOT_TO_R32[i + 1]
      if (r32) affected.add(r32)
    }
  }

  if (affected.size === 0) return scores

  // BFS downstream
  const queue = [...affected]
  while (queue.length > 0) {
    const matchId = queue.shift()!
    for (const child of KNOCKOUT_CHILDREN[matchId] ?? []) {
      if (!affected.has(child)) {
        affected.add(child)
        queue.push(child)
      }
    }
  }

  // Remover chaves afectadas do ScoreMap
  const result = { ...scores }
  for (const matchId of affected) {
    delete result[matchId]
  }
  return result
}

// Limpa todos os rounds downstream de um match knockout (não o match em si).
// Usado quando o resultado de um match knockout é alterado.
export function cascadeClearKnockoutFromMatch(
  matchId: string,
  scores: ScoreMap,
): ScoreMap {
  const downstream = new Set<string>()
  const queue = [...(KNOCKOUT_CHILDREN[matchId] ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (!downstream.has(id)) {
      downstream.add(id)
      for (const child of KNOCKOUT_CHILDREN[id] ?? []) {
        if (!downstream.has(child)) queue.push(child)
      }
    }
  }
  if (downstream.size === 0) return scores
  const result = { ...scores }
  for (const id of downstream) {
    delete result[id]
  }
  return result
}
