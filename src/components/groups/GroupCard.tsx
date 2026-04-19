import { useStore } from '@/store'
import { GROUPS, FIXTURES, TEAMS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { cn } from '@/lib/utils'

interface GroupCardProps {
  groupId: string
  onClick: () => void
}

export function GroupCard({ groupId, onClick }: GroupCardProps) {
  const scores = useStore((s) => s.scores)
  const group = GROUPS.find((g) => g.id === groupId)
  if (!group) return null

  const standings = classifyGroup(group, scores)
  const fixtures = FIXTURES.filter((f) => f.group === groupId)
  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length
  const isComplete = filledCount === fixtures.length

  return (
    <button
      onClick={onClick}
      data-testid={`group-card-${groupId}`}
      className={cn(
        'w-full text-left rounded-xl border transition-colors bg-wcp-surface hover:bg-wcp-primary-faint',
        isComplete ? 'border-wcp-primary' : 'border-wcp-border',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wcp-border">
        <span className="text-[10px] tracking-[3px] uppercase font-semibold text-wcp-primary">
          GRUPO {groupId}
        </span>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full',
            isComplete
              ? 'bg-wcp-primary text-white'
              : 'bg-wcp-surface-subtle text-wcp-muted',
          )}
        >
          {filledCount}/{fixtures.length}
        </span>
      </div>

      {/* Standings */}
      <div className="px-3 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-wcp-muted text-[9px] uppercase tracking-wide">
              <th className="text-left py-1 pr-2">#</th>
              <th className="text-left py-1">Seleção</th>
              <th className="text-center py-1 px-1">J</th>
              <th className="text-center py-1 px-1">SG</th>
              <th className="text-center py-1 px-1 text-wcp-primary font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const team = TEAMS.find((t) => t.code === s.teamCode)
              const qualifies = idx < 2
              return (
                <tr
                  key={s.teamCode}
                  className={cn(
                    'border-t border-wcp-border text-xs',
                    qualifies ? 'text-wcp-text' : 'text-wcp-muted',
                  )}
                >
                  <td className="py-1.5 pr-2">
                    <span className={cn('font-bold', qualifies && 'text-wcp-primary')}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <span className="mr-1">{team?.flag}</span>
                    <span className="font-semibold">{s.teamCode}</span>
                  </td>
                  <td className="py-1.5 text-center px-1 tabular-nums">{s.played}</td>
                  <td className="py-1.5 text-center px-1 tabular-nums">
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                  <td className="py-1.5 text-center px-1 font-bold text-wcp-primary tabular-nums">
                    {s.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </button>
  )
}
