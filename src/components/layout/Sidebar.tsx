import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function Sidebar() {
  const selectedGroup = useStore((s) => s.selectedGroup)
  const setSelectedGroup = useStore((s) => s.setSelectedGroup)

  return (
    <aside className="w-60 h-full bg-wcp-sidebar border-r border-wcp-border flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-wcp-border">
        <p className="text-wcp-gold font-bold text-base tracking-wide">
          🏆 WC 2026
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {GROUP_IDS.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            aria-pressed={selectedGroup === g}
            className={cn(
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              selectedGroup === g
                ? 'bg-wcp-gold text-wcp-bg font-semibold'
                : 'text-wcp-text hover:bg-wcp-border/30',
            )}
          >
            Grupo {g}
          </button>
        ))}
        <div className="border-t border-wcp-border my-1" />
        <button
          onClick={() => setSelectedGroup('bracket')}
          aria-pressed={selectedGroup === 'bracket'}
          className={cn(
            'w-full text-left px-3 py-2 rounded text-sm transition-colors',
            selectedGroup === 'bracket'
              ? 'bg-wcp-gold text-wcp-bg font-semibold'
              : 'text-wcp-text hover:bg-wcp-border/30',
          )}
        >
          🏆 Bracket
        </button>
      </nav>
    </aside>
  )
}
