import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket } from '@/engine/bracket-generator'
import { GroupTable } from '@/components/groups/GroupTable'
import { BracketView } from '@/components/bracket/BracketView'
import type { GroupStandings } from '@/engine/types'

export function ContentArea() {
  const selectedGroup = useStore((s) => s.selectedGroup)
  const scores = useStore((s) => s.scores)

  if (selectedGroup === 'bracket') {
    const allStandings: GroupStandings = {}
    for (const group of GROUPS) {
      allStandings[group.id] = classifyGroup(group, scores)
    }
    const bracket = generateBracket(allStandings)
    return (
      <main className="flex-1 overflow-y-auto">
        <BracketView bracket={bracket} />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <GroupTable groupId={selectedGroup} />
    </main>
  )
}
