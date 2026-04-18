import { useQuery } from '@tanstack/react-query'
import { getDbClient } from '@/db/client'
import type { TeamStat } from '@/db/schema'

async function fetchCommunityStats(): Promise<TeamStat[]> {
  const client = getDbClient()
  if (!client) return []

  const result = await client.execute(
    'SELECT team_code, champion_pct, top4_pct, top8_pct, total_votes, updated_at FROM team_stats ORDER BY champion_pct DESC'
  )

  return result.rows.map((row) => ({
    teamCode:    row[0] as string,
    championPct: row[1] as number,
    top4Pct:     row[2] as number,
    top8Pct:     row[3] as number,
    totalVotes:  row[4] as number,
    updatedAt:   row[5] as string,
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
