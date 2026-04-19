import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { MatchRow } from './MatchRow'

interface MatchModalProps {
  groupId: string
  onClose: () => void
}

function formatMatchDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MatchModal({ groupId, onClose }: MatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)
  const clearScore = useStore((s) => s.clearScore)

  const fixtures = useMemo(
    () => FIXTURES.filter((f) => f.group === groupId),
    [groupId]
  )

  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length

  const firstUnfilledIdx = fixtures.findIndex((f) => scores[f.id] === undefined)
  const [expandedIndex, setExpandedIndex] = useState(firstUnfilledIdx)

  const toggleExpand = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? -1 : idx))
  }

  const handleClear = (matchId: string) => {
    clearScore(matchId)
    setExpandedIndex(-1)
  }

  const progressPct = Math.round((filledCount / fixtures.length) * 100)

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <div>
            <h2 className="font-bold text-wcp-text text-base">Grupo {groupId}</h2>
            <span className="text-xs text-wcp-muted tabular-nums" data-testid="modal-progress">
              {filledCount}/{fixtures.length}
            </span>
          </div>
          <button
            data-testid="modal-close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wcp-surface-subtle hover:bg-wcp-primary-faint flex items-center justify-center text-wcp-muted transition-colors"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-wcp-surface-subtle shrink-0">
          <div
            className="h-1 bg-wcp-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Matches */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-2">
          {fixtures.map((match, idx) => {
            const isExpanded = idx === expandedIndex
            const hasScore = scores[match.id] !== undefined
            const homeTeam = TEAMS.find((t) => t.code === match.homeTeam)
            const awayTeam = TEAMS.find((t) => t.code === match.awayTeam)

            if (isExpanded) {
              return (
                <div key={match.id} className="flex flex-col rounded-xl overflow-hidden border border-wcp-primary">
                  {/* Collapse header */}
                  <button
                    data-testid={`collapse-header-${match.id}`}
                    onClick={() => toggleExpand(idx)}
                    className="flex items-center justify-between bg-wcp-primary-faint px-4 py-2 text-xs font-semibold text-wcp-text hover:bg-wcp-surface-subtle transition-colors"
                  >
                    <span>{homeTeam?.flag} {match.homeTeam}</span>
                    <span className="text-wcp-primary">▲</span>
                    <span>{match.awayTeam} {awayTeam?.flag}</span>
                  </button>

                  {/* Match info */}
                  <div className="px-4 py-1.5 bg-wcp-surface-subtle border-b border-wcp-border flex items-center gap-3 text-[10px] text-wcp-muted">
                    <span>📅 {formatMatchDate(match.date)}</span>
                    <span>|</span>
                    <span>🏟 {match.venue}</span>
                  </div>

                  <MatchRow
                    match={match}
                    homeScore={scores[match.id]?.home}
                    awayScore={scores[match.id]?.away}
                    onScoreChange={setScore}
                  />

                  {/* Clear score */}
                  {hasScore && (
                    <button
                      onClick={() => handleClear(match.id)}
                      className="text-[10px] text-wcp-muted hover:text-wcp-text py-2 transition-colors"
                    >
                      Limpar placar
                    </button>
                  )}
                </div>
              )
            }

            return (
              <MatchRow
                key={match.id}
                match={match}
                homeScore={scores[match.id]?.home}
                awayScore={scores[match.id]?.away}
                onScoreChange={setScore}
                onClearScore={clearScore}
                compact
                onClick={() => toggleExpand(idx)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
