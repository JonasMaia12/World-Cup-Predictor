import { useStore } from '@/store'
import { GROUPS, FIXTURES, TEAMS } from '@/data/wc2026'
import { classifyGroup } from '@/engine/classifier'
import { MatchRow } from './MatchRow'

interface GroupTableProps {
  groupId: string
}

export function GroupTable({ groupId }: GroupTableProps) {
  const group = GROUPS.find((g) => g.id === groupId)
  if (!group) return null

  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)
  const standings = classifyGroup(group, scores)
  const fixtures = FIXTURES.filter((f) => f.group === groupId)

  return (
    <div className="flex flex-col gap-4">
      {/* Standings table */}
      <div className="rounded-lg overflow-hidden border border-wcp-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-wcp-surface-subtle text-wcp-muted text-[10px] uppercase tracking-wide">
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Seleção</th>
              <th className="px-2 py-2 text-center">J</th>
              <th className="px-2 py-2 text-center">G</th>
              <th className="px-2 py-2 text-center">E</th>
              <th className="px-2 py-2 text-center">P</th>
              <th className="px-2 py-2 text-center">SG</th>
              <th className="px-2 py-2 text-center">GP</th>
              <th className="px-2 py-2 text-center font-bold text-wcp-primary">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const team = TEAMS.find((t) => t.code === s.teamCode)
              const qualifies = idx < 2
              return (
                <tr
                  key={s.teamCode}
                  className={`border-t border-wcp-border ${qualifies ? 'text-wcp-text' : 'text-wcp-muted'}`}
                >
                  <td className="px-3 py-2 text-center">
                    {qualifies ? (
                      <span className="text-wcp-primary font-bold">{idx + 1}</span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {team?.flag} {team?.name ?? s.teamCode}
                  </td>
                  <td className="px-2 py-2 text-center">{s.played}</td>
                  <td className="px-2 py-2 text-center">{s.won}</td>
                  <td className="px-2 py-2 text-center">{s.drawn}</td>
                  <td className="px-2 py-2 text-center">{s.lost}</td>
                  <td className="px-2 py-2 text-center">
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                  <td className="px-2 py-2 text-center">{s.goalsFor}</td>
                  <td className="px-2 py-2 text-center font-bold text-wcp-primary">{s.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Match list */}
      <div className="flex flex-col gap-2">
        <h3 className="text-wcp-muted text-[10px] tracking-widest uppercase">Jogos</h3>
        {fixtures.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            homeScore={scores[match.id]?.home}
            awayScore={scores[match.id]?.away}
            onScoreChange={setScore}
          />
        ))}
      </div>
    </div>
  )
}
