import { useCommunityStats } from '@/hooks/useCommunityStats'
import { cn } from '@/lib/utils'

export function CommunityStatsBar() {
  const { data, isLoading, isError } = useCommunityStats()

  if (!import.meta.env.VITE_TURSO_URL) return null
  if (isLoading || isError || !data?.length) return null

  const top5 = data.slice(0, 5)

  return (
    <div className="bg-wcp-surface-subtle border-b border-wcp-border px-4 py-2">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none max-w-2xl mx-auto">
        <span className="text-[8px] tracking-widest text-wcp-muted uppercase shrink-0">
          🏆 Favoritos
        </span>
        {top5.map((stat, idx) => (
          <div
            key={stat.teamCode}
            className="flex items-center gap-1.5 bg-wcp-surface border border-wcp-border rounded-full px-2.5 py-1 shrink-0"
          >
            <div
              className={cn(
                'w-[14px] h-[14px] rounded-full text-white text-[7px] font-bold flex items-center justify-center leading-none',
                idx === 0 ? 'bg-wcp-primary' : 'bg-wcp-muted',
              )}
            >
              {idx + 1}
            </div>
            <span className="text-[9px] font-semibold text-wcp-text">{stat.teamCode}</span>
            <span
              className={cn(
                'text-[9px] font-semibold',
                idx === 0 ? 'text-wcp-primary' : 'text-wcp-muted',
              )}
            >
              {stat.championPct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
