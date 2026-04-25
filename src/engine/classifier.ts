import { FIXTURES, GROUPS } from '@/data/wc2026'
import type { Group } from '@/data/wc2026'
import type { ScoreMap, Standing, GroupStandings } from './types'
import { applyTiebreakers } from './tiebreaker'

export function classifyGroup(group: Group, scores: ScoreMap): Standing[] {
  const standings: Standing[] = group.teams.map((teamCode) => ({
    teamCode,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }))

  const fixtures = FIXTURES.filter((f) => f.group === group.id)

  for (const fixture of fixtures) {
    const score = scores[fixture.id]
    if (!score) continue

    const home = standings.find((s) => s.teamCode === fixture.homeTeam)!
    const away = standings.find((s) => s.teamCode === fixture.awayTeam)!

    home.played++
    away.played++
    home.goalsFor += score.home
    home.goalsAgainst += score.away
    away.goalsFor += score.away
    away.goalsAgainst += score.home

    if (score.home > score.away) {
      home.won++
      home.points += 3
      away.lost++
    } else if (score.away > score.home) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      home.points++
      away.drawn++
      away.points++
    }
  }

  for (const s of standings) {
    s.goalDiff = s.goalsFor - s.goalsAgainst
  }

  standings.sort((a, b) => b.points - a.points)

  // Apply FIFA tiebreakers for groups of equal-points teams
  const result: Standing[] = []
  let i = 0
  while (i < standings.length) {
    let j = i + 1
    while (j < standings.length && standings[j].points === standings[i].points) j++
    const slice = standings.slice(i, j)
    result.push(
      ...(slice.length > 1 ? applyTiebreakers(slice, scores, group) : slice)
    )
    i = j
  }

  return result
}

export function computeAllStandings(scores: ScoreMap): GroupStandings {
  const result: GroupStandings = {}
  for (const group of GROUPS) {
    result[group.id] = classifyGroup(group, scores)
  }
  return result
}
