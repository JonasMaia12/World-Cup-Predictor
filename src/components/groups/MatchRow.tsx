import type { Match } from '@/data/wc2026'
import { TEAMS } from '@/data/wc2026'

interface MatchRowProps {
  match: Match
  homeScore: number | undefined
  awayScore: number | undefined
  onScoreChange: (matchId: string, home: number, away: number) => void
}

export function MatchRow({ match, homeScore, awayScore, onScoreChange }: MatchRowProps) {
  const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
  const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

  const handleHome = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0)
    onScoreChange(match.id, val, awayScore ?? 0)
  }

  const handleAway = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0)
    onScoreChange(match.id, homeScore ?? 0, val)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-wcp-sidebar hover:bg-wcp-border/20 transition-colors">
      <span className="flex-1 text-sm text-wcp-text flex items-center gap-1">
        <span>{homeTeam?.flag}</span>
        <span>{match.homeTeam}</span>
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={homeScore ?? ''}
          onChange={handleHome}
          placeholder="–"
          data-testid={`score-home-${match.id}`}
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
        <span className="text-wcp-gold font-bold text-sm">—</span>
        <input
          type="number"
          min={0}
          value={awayScore ?? ''}
          onChange={handleAway}
          placeholder="–"
          data-testid={`score-away-${match.id}`}
          className="w-10 text-center bg-wcp-bg border border-wcp-border rounded text-wcp-text text-sm py-1 focus:border-wcp-gold focus:outline-none"
        />
      </div>
      <span className="flex-1 text-sm text-wcp-text flex items-center justify-end gap-1">
        <span>{match.awayTeam}</span>
        <span>{awayTeam?.flag}</span>
      </span>
    </div>
  )
}
