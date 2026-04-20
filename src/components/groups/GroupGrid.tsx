import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket, advanceWinner } from '@/engine/bracket-generator'
import { GroupCard } from './GroupCard'
import { MatchModal } from './MatchModal'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings, BracketMatch } from '@/engine/types'
import { KnockoutMatchModal } from '@/components/bracket/KnockoutMatchModal'

const GROUP_IDS = GROUPS.map((g) => g.id)

const ROUND_LABELS: Record<string, string> = {
  r32: 'Oitavas de Final',
  r16: 'Rodada de 16',
  qf:  'Quartas de Final',
  sf:  'Semifinal',
  final: 'Final',
  '3rd': '3.º/4.º Lugar',
}

function getRoundLabel(matchId: string): string {
  if (matchId === 'final') return ROUND_LABELS['final']
  if (matchId === '3rd') return ROUND_LABELS['3rd']
  const prefix = matchId.replace(/-\d+$/, '')
  return ROUND_LABELS[prefix] ?? ''
}

export function GroupGrid() {
  const scores = useStore((s) => s.scores)
  const thirdQualifiers = useStore((s) => s.thirdQualifiers)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [activeKnockoutMatch, setActiveKnockoutMatch] = useState<BracketMatch | null>(null)

  const allStandings = useMemo(() => {
    const result: GroupStandings = {}
    for (const group of GROUPS) {
      result[group.id] = classifyGroup(group, scores)
    }
    return result
  }, [scores])

  const bracket = useMemo(
    () => generateBracket(allStandings, scores, thirdQualifiers),
    [allStandings, scores, thirdQualifiers],
  )

  const champion = useMemo(() => {
    const side = advanceWinner('final', scores)
    if (!side) return null
    return side === 'home' ? bracket.final.home : bracket.final.away
  }, [bracket, scores])

  return (
    <div className="w-full px-4 py-4 max-w-screen-xl mx-auto">
      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {GROUP_IDS.map((groupId) => (
          <GroupCard
            key={groupId}
            groupId={groupId}
            onClick={() => setActiveGroupId(groupId)}
          />
        ))}
      </div>

      {/* Bracket section */}
      <div className="rounded-xl border border-wcp-border">
        <div className="bg-wcp-surface-subtle px-4 py-3 border-b border-wcp-border rounded-t-xl">
          <span className="text-[10px] tracking-[3px] uppercase font-semibold text-wcp-primary">
            FASE ELIMINATÓRIA
          </span>
        </div>
        <div className="bg-wcp-surface rounded-b-xl">
          <BracketView
            bracket={bracket}
            champion={champion}
            onMatchClick={setActiveKnockoutMatch}
          />
        </div>
      </div>

      {/* Group modal */}
      {activeGroupId && (
        <MatchModal
          groupId={activeGroupId}
          onClose={() => setActiveGroupId(null)}
        />
      )}

      {/* Knockout match modal */}
      {activeKnockoutMatch && (
        <KnockoutMatchModal
          match={activeKnockoutMatch}
          roundLabel={getRoundLabel(activeKnockoutMatch.id)}
          onClose={() => setActiveKnockoutMatch(null)}
        />
      )}
    </div>
  )
}
