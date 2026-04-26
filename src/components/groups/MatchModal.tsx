import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { MatchRow } from './MatchRow'
import { GroupPositionPicker } from './GroupPositionPicker'

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
  const [showPositionPicker, setShowPositionPicker] = useState(true)

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
            <button
              data-testid="open-position-picker"
              onClick={() => setShowPositionPicker((v) => !v)}
              className="text-xs text-wcp-primary font-semibold underline underline-offset-2 mt-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17a2 2 0 0 1-2 2H7"/>
                <path d="M14 14.66V17a2 2 0 0 1 2 2h1"/>
                <path d="M6 2v7a6 6 0 0 0 12 0V2"/>
              </svg>
              Definir classificação
            </button>
          </div>
          <button
            data-testid="modal-close"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wcp-surface-subtle hover:bg-wcp-primary-faint flex items-center justify-center text-wcp-muted transition-colors"
            aria-label="Fechar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-wcp-surface-subtle shrink-0">
          <div
            className="h-1 bg-wcp-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {showPositionPicker && (
          <GroupPositionPicker
            groupId={groupId}
            onClose={() => setShowPositionPicker(false)}
          />
        )}

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
                  <div className="px-4 py-1.5 bg-wcp-surface-subtle border-b border-wcp-border flex items-center gap-3 text-xs text-wcp-muted">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {formatMatchDate(match.date)}
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {match.venue}
                    </span>
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
                      data-testid={`clear-score-${match.id}`}
                      onClick={() => handleClear(match.id)}
                      className="text-xs text-wcp-muted hover:text-wcp-text py-2 transition-colors"
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
