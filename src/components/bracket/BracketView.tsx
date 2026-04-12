import type { Bracket, BracketMatch } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'

interface BracketViewProps {
  bracket: Bracket
}

function TeamSlot({ code }: { code: string | null }) {
  const team = TEAMS.find((t) => t.code === code)
  if (!code) return <span className="text-wcp-muted">?</span>
  return (
    <span className="text-wcp-text flex items-center gap-1">
      <span>{team?.flag}</span>
      <span>{code}</span>
    </span>
  )
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className="bg-wcp-sidebar border border-wcp-border rounded-lg px-4 py-3 flex flex-col gap-1 text-sm min-w-[160px]">
      <TeamSlot code={match.home} />
      <span className="text-wcp-gold text-xs">vs</span>
      <TeamSlot code={match.away} />
    </div>
  )
}

function RoundSection({ title, matches }: { title: string; matches: BracketMatch[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-wcp-muted text-xs uppercase tracking-wide">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  )
}

export function BracketView({ bracket }: BracketViewProps) {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
      <h2 className="text-wcp-gold font-bold text-lg tracking-wide">Fase Eliminatória</h2>
      <RoundSection title="Oitavas de Final" matches={bracket.roundOf32} />
      <RoundSection title="Quartas de Final" matches={bracket.quarterFinals} />
      <RoundSection title="Semifinais" matches={bracket.semiFinals} />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-3 flex-1">
          <h3 className="text-wcp-muted text-xs uppercase tracking-wide">3º Lugar</h3>
          <MatchCard match={bracket.thirdPlace} />
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <h3 className="text-wcp-muted text-xs uppercase tracking-wide">Final</h3>
          <MatchCard match={bracket.final} />
        </div>
      </div>
    </div>
  )
}
