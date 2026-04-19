import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket } from '@/engine/bracket-generator'
import { GroupCard } from './GroupCard'
import { MatchModal } from './MatchModal'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings } from '@/engine/types'

const GROUP_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function GroupGrid() {
  const scores = useStore((s) => s.scores)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  const allStandings = useMemo(() => {
    const result: GroupStandings = {}
    for (const group of GROUPS) {
      result[group.id] = classifyGroup(group, scores)
    }
    return result
  }, [scores])

  const bracket = useMemo(() => generateBracket(allStandings), [allStandings])

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
          <BracketView bracket={bracket} />
        </div>
      </div>

      {/* Modal */}
      {activeGroupId && (
        <MatchModal
          groupId={activeGroupId}
          onClose={() => setActiveGroupId(null)}
        />
      )}
    </div>
  )
}
