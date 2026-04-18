import { useMemo } from 'react'
import { useStore } from '@/store'
import { GROUPS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { generateBracket } from '@/engine/bracket-generator'
import { GroupTable } from './GroupTable'
import { BracketView } from '@/components/bracket/BracketView'
import { cn } from '@/lib/utils'
import type { GroupStandings } from '@/engine/types'

const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function GroupAccordion() {
  const scores    = useStore((s) => s.scores)
  const openGroups = useStore((s) => s.openGroups)
  const toggleGroup = useStore((s) => s.toggleGroup)

  const allStandings = useMemo(() => {
    const result: GroupStandings = {}
    for (const group of GROUPS) {
      result[group.id] = classifyGroup(group, scores)
    }
    return result
  }, [scores])
  const bracket = useMemo(() => generateBracket(allStandings), [allStandings])

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-2">
      {GROUP_IDS.map((groupId) => {
        const isOpen = openGroups.includes(groupId)
        return (
          <div key={groupId} className="rounded-xl overflow-hidden border border-wcp-border">
            <button
              onClick={() => toggleGroup(groupId)}
              className={cn(
                'w-full flex justify-between items-center px-4 py-3 transition-colors',
                isOpen
                  ? 'bg-wcp-surface-subtle'
                  : 'bg-wcp-surface hover:bg-wcp-primary-faint',
              )}
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  'text-[10px] tracking-[3px] uppercase font-semibold',
                  isOpen ? 'text-wcp-primary' : 'text-wcp-muted',
                )}
              >
                GRUPO {groupId}
              </span>
              <span className={cn('text-xs', isOpen ? 'text-wcp-primary' : 'text-wcp-muted')}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {isOpen && (
              <div
                data-testid={`group-content-${groupId}`}
                className="bg-wcp-surface px-4 py-4 border-t border-wcp-border"
              >
                <GroupTable groupId={groupId} />
              </div>
            )}
          </div>
        )
      })}

      {/* Bracket section */}
      <div className="rounded-xl overflow-hidden border border-wcp-border mt-4">
        <div className="bg-wcp-surface-subtle px-4 py-3 border-b border-wcp-border">
          <span className="text-[10px] tracking-[3px] uppercase font-semibold text-wcp-primary">
            FASE ELIMINATÓRIA
          </span>
        </div>
        <div className="bg-wcp-surface">
          <BracketView bracket={bracket} />
        </div>
      </div>
    </div>
  )
}
