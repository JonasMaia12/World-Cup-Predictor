export interface Standing {
  teamCode: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

// keyed by Match.id → score
export type ScoreMap = Record<string, { home: number; away: number }>

// keyed by Group.id → sorted standings
export type GroupStandings = Record<string, Standing[]>

export interface BracketMatch {
  id: string
  home: string | null  // team code or null if not yet determined
  away: string | null
}

export interface Bracket {
  roundOf32: BracketMatch[]
  roundOf16: BracketMatch[]
  quarterFinals: BracketMatch[]
  semiFinals: BracketMatch[]
  thirdPlace: BracketMatch
  final: BracketMatch
}
