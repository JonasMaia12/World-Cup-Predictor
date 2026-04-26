import { useState } from 'react'
import type { Bracket, BracketMatch } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'
import { useStore } from '@/store'
import { BracketMinimap } from './BracketMinimap'
import { ChampionCard } from './ChampionCard'
import { cn } from '@/lib/utils'

type Round = 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'

function TeamSlot({ code, isWinner, score }: { code: string | null; isWinner?: boolean; score?: number }) {
  const team = TEAMS.find((t) => t.code === code)
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded text-sm',
        code ? 'text-wcp-text' : 'text-wcp-muted',
      )}
    >
      {code ? (
        <>
          <span>{team?.flag}</span>
          <span className={cn('flex-1', isWinner && 'font-bold text-wcp-primary')}>{code}</span>
          {score !== undefined && (
            <span className={cn('tabular-nums ml-auto text-xs font-bold', isWinner ? 'text-wcp-primary' : 'text-wcp-muted')}>
              {score}
            </span>
          )}
        </>
      ) : (
        <span className="opacity-40">?</span>
      )}
    </div>
  )
}

function MatchCard({
  match,
  onClick,
}: {
  match: BracketMatch
  onClick?: (match: BracketMatch) => void
}) {
  const scores = useStore((s) => s.scores)
  const score = scores[match.id]
  const homeWins = score ? score.home > score.away : false
  const awayWins = score ? score.away > score.home : false

  return (
    <div
      data-testid={`bracket-match-${match.id}`}
      className={cn(
        'bg-wcp-surface border border-wcp-border rounded-lg overflow-hidden',
        onClick && 'cursor-pointer hover:border-wcp-primary transition-colors',
      )}
      style={{ minWidth: 'clamp(110px, 11vw, 150px)' }}
      onClick={onClick ? () => onClick(match) : undefined}
    >
      <TeamSlot code={match.home} isWinner={homeWins} score={score?.home} />
      <div className="h-px bg-wcp-border mx-2" />
      <TeamSlot code={match.away} isWinner={awayWins} score={score?.away} />
    </div>
  )
}

// Conecta pares de matches da coluna atual à próxima rodada via SVG.
// mirror=true espelha horizontalmente para o lado direito do bracket.
function RoundConnector({ count, mirror = false }: { count: number; mirror?: boolean }) {
  const pairs = Math.floor(count / 2)
  // matchH must match the rendered MatchCard height (2 TeamSlot rows ~28px + 1px divider)
  // gap must match gap-1.5 (6px) used in RoundColumn
  const matchH = 64
  const gap    = 6
  const totalH = count * matchH + (count - 1) * gap

  // Caso especial: SF → Final (count=1, sem branching — só linha horizontal)
  if (pairs === 0) {
    const cy = matchH / 2
    return (
      <svg width="24" height={matchH} viewBox={`0 0 24 ${matchH}`} fill="none"
           style={mirror ? { transform: 'scaleX(-1)' } : undefined}>
        <line x1="0" y1={cy} x2="24" y2={cy} stroke="var(--wcp-primary)" strokeOpacity="0.3" strokeWidth="1.5" />
      </svg>
    )
  }

  return (
    <svg width="24" height={totalH} viewBox={`0 0 24 ${totalH}`} fill="none"
         style={mirror ? { transform: 'scaleX(-1)' } : undefined}>
      {Array.from({ length: pairs }).map((_, i) => {
        const y1   = i * 2 * (matchH + gap) + matchH / 2
        const y2   = (i * 2 + 1) * (matchH + gap) + matchH / 2
        const yMid = (y1 + y2) / 2
        return (
          <g key={i}>
            {/* braço superior: (0,y1) → (12,yMid) */}
            <path d={`M0 ${y1} Q12 ${y1} 12 ${yMid}`}
                  stroke="var(--wcp-primary)" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
            {/* braço inferior: (0,y2) → (12,yMid) — espelho do superior */}
            <path d={`M0 ${y2} Q12 ${y2} 12 ${yMid}`}
                  stroke="var(--wcp-primary)" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
            {/* linha horizontal até à próxima coluna */}
            <line x1="12" y1={yMid} x2="24" y2={yMid}
                  stroke="var(--wcp-primary)" strokeOpacity="0.3" strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}

function RoundColumn({
  title,
  matches,
  onMatchClick,
}: {
  title: string
  matches: BracketMatch[]
  onMatchClick?: (match: BracketMatch) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-[11px] text-wcp-muted tracking-wide uppercase font-display font-bold mb-1">{title}</span>
      <div className="flex flex-col gap-1.5">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  )
}

function DesktopBracket({
  bracket,
  onMatchClick,
}: {
  bracket: Bracket
  onMatchClick?: (match: BracketMatch) => void
}) {
  const leftR32  = bracket.roundOf32.slice(0, 8)
  const rightR32 = bracket.roundOf32.slice(8)
  const leftR16  = bracket.roundOf16.slice(0, 4)
  const rightR16 = bracket.roundOf16.slice(4)
  const leftQF   = bracket.quarterFinals.slice(0, 2)
  const rightQF  = bracket.quarterFinals.slice(2)
  const leftSF   = bracket.semiFinals.slice(0, 1)
  const rightSF  = bracket.semiFinals.slice(1)

  return (
    <div className="overflow-x-auto py-4 px-4">
      <div className="flex items-start justify-center min-w-fit">
        <RoundColumn title="Rodada de 32" matches={leftR32} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" />{/* h-5 = label height (text-[11px] + mb-1) in RoundColumn */}<RoundConnector count={8} /></div>
        <RoundColumn title="Oitavas" matches={leftR16} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={4} /></div>
        <RoundColumn title="Quartos" matches={leftQF} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={2} /></div>
        <RoundColumn title="Semis" matches={leftSF} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={1} /></div>

        <div className="flex flex-col items-center gap-2 px-3 pt-5">
          <span className="text-[11px] text-wcp-primary tracking-wide uppercase font-display font-bold">Final</span>
          <div className="border-2 border-wcp-primary rounded-xl overflow-hidden">
            <MatchCard match={bracket.final} onClick={onMatchClick} />
          </div>
        </div>

        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={1} mirror /></div>
        <RoundColumn title="Semis" matches={rightSF} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={2} mirror /></div>
        <RoundColumn title="Quartos" matches={rightQF} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={4} mirror /></div>
        <RoundColumn title="Oitavas" matches={rightR16} onMatchClick={onMatchClick} />
        <div className="flex flex-col"><div className="h-5" /><RoundConnector count={8} mirror /></div>
        <RoundColumn title="Rodada de 32" matches={rightR32} onMatchClick={onMatchClick} />
      </div>
    </div>
  )
}

const ROUND_MATCHES: Record<Round, (b: Bracket) => BracketMatch[]> = {
  roundOf32:     (b) => b.roundOf32,
  roundOf16:     (b) => b.roundOf16,
  quarterFinals: (b) => b.quarterFinals,
  semiFinals:    (b) => b.semiFinals,
  final:         (b) => [b.final],
}

const ROUND_LABELS: Record<Round, string> = {
  roundOf32:     'Rodada de 32',
  roundOf16:     'Oitavas de Final',
  quarterFinals: 'Quartas de Final',
  semiFinals:    'Semifinais',
  final:         'Final',
}

function MobileBracket({
  bracket,
  onMatchClick,
}: {
  bracket: Bracket
  onMatchClick?: (match: BracketMatch) => void
}) {
  const [activeRound, setActiveRound] = useState<Round>('roundOf32')
  const matches = ROUND_MATCHES[activeRound](bracket)

  return (
    <div>
      <BracketMinimap
        bracket={bracket}
        activeRound={activeRound}
        onRoundSelect={setActiveRound}
      />
      <div
        data-testid={`round-${activeRound}`}
        className="px-4 py-4 flex flex-col gap-3"
      >
        <span className="text-[11px] text-wcp-primary tracking-wide uppercase font-display font-bold">
          {ROUND_LABELS[activeRound]}
        </span>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  )
}

interface BracketViewProps {
  bracket: Bracket
  champion?: string | null
  onMatchClick?: (match: BracketMatch) => void
}

export function BracketView({ bracket, champion, onMatchClick }: BracketViewProps) {
  return (
    <div>
      {champion && (
        <ChampionCard key={champion} champion={champion} bracket={bracket} />
      )}
      <div className="hidden md:block">
        <DesktopBracket bracket={bracket} onMatchClick={onMatchClick} />
      </div>
      <div className="md:hidden">
        <MobileBracket bracket={bracket} onMatchClick={onMatchClick} />
      </div>
    </div>
  )
}
