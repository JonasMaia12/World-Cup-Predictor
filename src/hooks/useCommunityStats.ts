import { useQuery } from '@tanstack/react-query'
import { getDbClient } from '@/db/client'
import type { TeamStat } from '@/db/schema'

async function fetchCommunityStats(): Promise<TeamStat[]> {
  const client = getDbClient()
  if (!client) return []

  const result = await client.execute(
    'SELECT team_code, champion_pct, top4_pct, top8_pct, total_votes, updated_at FROM team_stats ORDER BY champion_pct DESC'
  )

  const idx = Object.fromEntries(result.columns.map((col, i) => [col, i]))
  return result.rows.map((row) => ({
    teamCode:    row[idx.team_code]    as string,
    championPct: row[idx.champion_pct] as number,
    top4Pct:     row[idx.top4_pct]     as number,
    top8Pct:     row[idx.top8_pct]     as number,
    totalVotes:  row[idx.total_votes]  as number,
    updatedAt:   row[idx.updated_at]   as string,
  }))
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ['communityStats'],
    queryFn: fetchCommunityStats,
    staleTime: 5 * 60 * 1000,
    enabled: !!import.meta.env.VITE_TURSO_URL,
  })
}
