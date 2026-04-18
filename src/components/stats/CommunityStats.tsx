import { useCommunityStats } from '@/hooks/useCommunityStats'

export function CommunityStats() {
  const { data, isLoading, isError } = useCommunityStats()

  if (!import.meta.env.VITE_TURSO_URL) return null
  if (isLoading) return <p className="px-3 py-2 text-xs text-wcp-text/50">Carregando stats...</p>
  if (isError || !data?.length) return null

  const top5 = data.slice(0, 5)
  const totalVotes = data[0]?.totalVotes ?? 0

  return (
    <div className="px-3 py-3 space-y-2">
      <p className="text-wcp-gold text-xs font-semibold uppercase tracking-wider">
        Favoritos da Comunidade
      </p>
      {totalVotes > 0 && (
        <p className="text-wcp-text/50 text-xs">{totalVotes} votos registrados</p>
      )}
      <ul className="space-y-1.5">
        {top5.map((stat) => (
          <li key={stat.teamCode}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-wcp-text">{stat.teamCode}</span>
              <span className="text-wcp-text/70">{stat.championPct.toFixed(1)}%</span>
            </div>
            <div className="h-1 rounded-full bg-wcp-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-wcp-gold"
                style={{ width: `${Math.min(stat.championPct, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
