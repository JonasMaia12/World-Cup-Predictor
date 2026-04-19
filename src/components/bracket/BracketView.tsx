import { useState } from 'react'
import type { Bracket, BracketMatch } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'
import { BracketMinimap } from './BracketMinimap'
import { cn } from '@/lib/utils'

type Round = 'roundOf32' | 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'

function TeamSlot({ code }: { code: string | null }) {
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
          <span>{code}</span>
        </>
      ) : (
        <span className="opacity-40">?</span>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div
      data-testid={`bracket-match-${match.id}`}
      className="bg-wcp-surface border border-wcp-border rounded-lg overflow-hidden"
      style={{ minWidth: 'clamp(110px, 11vw, 150px)' }}
    >
      <TeamSlot code={match.home} />
      <div className="h-px bg-wcp-border mx-2" />
      <TeamSlot code={match.away} />
    </div>
  )
}

function RoundColumn({
  title,
  matches,
}: {
  title: string
  matches: BracketMatch[]
}) {
  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-[10px] text-wcp-muted tracking-[2px] uppercase mb-1">{title}</span>
      <div className="flex flex-col gap-1.5">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

function DesktopBracket({ bracket }: { bracket: Bracket }) {
  const leftR32  = bracket.roundOf32.slice(0, 8)
  const rightR32 = bracket.roundOf32.slice(8)
  const leftR16  = bracket.roundOf16.slice(0, 8)
  const rightR16 = bracket.roundOf16.slice(8)
  const leftQF   = bracket.quarterFinals.slice(0, 4)
  const rightQF  = bracket.quarterFinals.slice(4)
  const leftSF   = bracket.semiFinals.slice(0, 2)
  const rightSF  = bracket.semiFinals.slice(2)

  return (
    <div className="overflow-x-auto py-4 px-4">
      <div className="flex items-center justify-center min-w-fit" style={{ gap: 'clamp(12px, 2vw, 32px)' }}>
        <RoundColumn title="Oitavas" matches={leftR32} />
        <RoundColumn title="R16" matches={leftR16} />
        <RoundColumn title="Quartos" matches={leftQF} />
        <RoundColumn title="Semis" matches={leftSF} />

        <div className="flex flex-col items-center gap-2 px-3">
          <span className="text-[9px] text-wcp-primary tracking-[3px] uppercase font-bold">Final</span>
          <div className="border-2 border-wcp-primary rounded-xl overflow-hidden">
            <MatchCard match={bracket.final} />
          </div>
        </div>

        <RoundColumn title="Semis" matches={rightSF} />
        <RoundColumn title="Quartos" matches={rightQF} />
        <RoundColumn title="R16" matches={rightR16} />
        <RoundColumn title="Oitavas" matches={rightR32} />
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
  roundOf32:     'Oitavas de Final',
  roundOf16:     'Rodada de 16',
  quarterFinals: 'Quartas de Final',
  semiFinals:    'Semifinais',
  final:         'Final',
}

function MobileBracket({ bracket }: { bracket: Bracket }) {
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
        <span className="text-[9px] text-wcp-primary tracking-[3px] uppercase font-bold">
          {ROUND_LABELS[activeRound]}
        </span>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

interface BracketViewProps {
  bracket: Bracket
}

export function BracketView({ bracket }: BracketViewProps) {
  return (
    <div>
      <div className="hidden md:block">
        <DesktopBracket bracket={bracket} />
      </div>
      <div className="md:hidden">
        <MobileBracket bracket={bracket} />
      </div>
    </div>
  )
}
