import type { Bracket } from '@/engine/types'
import { cn } from '@/lib/utils'

type Round = 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'

interface BracketMinimapProps {
  bracket: Bracket
  activeRound: Round
  onRoundSelect: (round: Round) => void
}

const ROUNDS: { key: Round; label: string }[] = [
  { key: 'roundOf32',     label: 'Oitavas' },
  { key: 'roundOf16',     label: 'R16' },
  { key: 'quarterFinals', label: 'Quartos' },
  { key: 'semiFinals',    label: 'Semis' },
  { key: 'final',         label: 'Final' },
]

export function BracketMinimap({ bracket, activeRound, onRoundSelect }: BracketMinimapProps) {
  const filledCount: Record<Round, number> = {
    roundOf32:     bracket.roundOf32.filter((m) => m.home).length,
    roundOf16:     bracket.roundOf16.filter((m) => m.home).length,
    quarterFinals: bracket.quarterFinals.filter((m) => m.home).length,
    semiFinals:    bracket.semiFinals.filter((m) => m.home).length,
    final:         bracket.final.home ? 1 : 0,
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 bg-wcp-surface border-b border-wcp-border overflow-x-auto">
      {ROUNDS.map((round, i) => (
        <div key={round.key} className="flex items-center gap-1">
          <button
            onClick={() => onRoundSelect(round.key)}
            data-testid={`minimap-${round.key}`}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-[11px] tracking-wide font-semibold',
              activeRound === round.key
                ? 'bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary'
                : 'text-wcp-muted hover:bg-wcp-primary-faint',
            )}
          >
            <span>{round.label}</span>
            {filledCount[round.key] > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-wcp-primary" />
            )}
          </button>
          {i < ROUNDS.length - 1 && (
            <span className="text-wcp-border text-xs">›</span>
          )}
        </div>
      ))}
    </div>
  )
}
