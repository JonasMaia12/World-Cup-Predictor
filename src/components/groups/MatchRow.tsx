import type { Match } from '@/data/wc2026'
import { TEAMS } from '@/data/wc2026'
import { cn } from '@/lib/utils'

interface MatchRowProps {
  match: Match
  homeScore: number | undefined
  awayScore: number | undefined
  onScoreChange: (matchId: string, home: number, away: number) => void
  compact?: boolean
  onClick?: () => void
}

function Stepper({
  value,
  onIncrement,
  onDecrement,
  testIdPlus,
  testIdMinus,
  testIdValue,
}: {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  testIdPlus: string
  testIdMinus: string
  testIdValue: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        data-testid={testIdPlus}
        onClick={onIncrement}
        className="w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none"
        aria-label="incrementar"
      >
        +
      </button>
      <span
        data-testid={testIdValue}
        className="text-xl font-bold text-wcp-text min-w-[28px] text-center tabular-nums"
      >
        {value}
      </span>
      <button
        data-testid={testIdMinus}
        onClick={onDecrement}
        disabled={value === 0}
        className={cn(
          'w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none',
          value === 0 && 'opacity-30 cursor-not-allowed',
        )}
        aria-label="decrementar"
      >
        −
      </button>
    </div>
  )
}

export function MatchRow({ match, homeScore, awayScore, onScoreChange, compact, onClick }: MatchRowProps) {
  const home = homeScore ?? 0
  const away = awayScore ?? 0
  const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
  const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

  if (compact) {
    const hasSco = homeScore !== undefined
    const scoreLabel = hasSco ? `${home} × ${away}` : '– × –'
    const indicator = hasSco ? '✓' : '›'

    return (
      <button
        onClick={onClick}
        data-testid={`compact-${match.id}`}
        className="w-full flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-2 gap-2 hover:bg-wcp-primary-faint transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg leading-none">{homeTeam?.flag}</span>
          <span className="text-xs font-semibold text-wcp-text">{match.homeTeam}</span>
        </div>
        <span className="text-sm font-bold text-wcp-text tabular-nums">{scoreLabel}</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs font-semibold text-wcp-text">{match.awayTeam}</span>
          <span className="text-lg leading-none">{awayTeam?.flag}</span>
        </div>
        <span className={`text-xs font-bold ml-2 ${hasSco ? 'text-wcp-primary' : 'text-wcp-muted'}`}>
          {indicator}
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-center justify-between bg-wcp-surface border border-wcp-border rounded-xl px-4 py-3 gap-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-3xl leading-none">{homeTeam?.flag}</span>
        <span className="text-[10px] font-semibold text-wcp-text tracking-wide">{match.homeTeam}</span>
      </div>

      <div className="flex items-center gap-3">
        <Stepper
          value={home}
          onIncrement={() => onScoreChange(match.id, home + 1, away)}
          onDecrement={() => home > 0 && onScoreChange(match.id, home - 1, away)}
          testIdPlus={`home-plus-${match.id}`}
          testIdMinus={`home-minus-${match.id}`}
          testIdValue={`score-home-${match.id}`}
        />
        <span className="text-wcp-primary font-bold px-1">×</span>
        <Stepper
          value={away}
          onIncrement={() => onScoreChange(match.id, home, away + 1)}
          onDecrement={() => away > 0 && onScoreChange(match.id, home, away - 1)}
          testIdPlus={`away-plus-${match.id}`}
          testIdMinus={`away-minus-${match.id}`}
          testIdValue={`score-away-${match.id}`}
        />
      </div>

      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-3xl leading-none">{awayTeam?.flag}</span>
        <span className="text-[10px] font-semibold text-wcp-text tracking-wide">{match.awayTeam}</span>
      </div>
    </div>
  )
}
