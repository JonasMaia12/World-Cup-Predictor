import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { FIXTURES, TEAMS } from '@/data/wc2026'
import { MatchRow } from './MatchRow'

interface MatchModalProps {
  groupId: string
  onClose: () => void
}

export function MatchModal({ groupId, onClose }: MatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)

  const fixtures = FIXTURES.filter((f) => f.group === groupId)
  const filledCount = fixtures.filter((f) => scores[f.id] !== undefined).length

  const firstUnfilledIdx = fixtures.findIndex((f) => scores[f.id] === undefined)
  const initialRevealedCount = firstUnfilledIdx === -1 ? fixtures.length : firstUnfilledIdx + 1
  const initialExpandedIndex = firstUnfilledIdx === -1 ? 0 : firstUnfilledIdx

  const [revealedCount, setRevealedCount] = useState(initialRevealedCount)
  const [expandedIndex, setExpandedIndex] = useState(initialExpandedIndex)

  // Sync revealed count if scores change externally (e.g., share link load)
  useEffect(() => {
    const newFirstUnfilled = fixtures.findIndex((f) => scores[f.id] === undefined)
    const newRevealed = newFirstUnfilled === -1 ? fixtures.length : newFirstUnfilled + 1
    if (newRevealed > revealedCount) {
      setRevealedCount(newRevealed)
    }
  }, [scores]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScoreChange = (matchId: string, home: number, away: number) => {
    const wasUnset = scores[matchId] === undefined
    setScore(matchId, home, away)
    if (wasUnset) {
      const matchIndex = fixtures.findIndex((f) => f.id === matchId)
      const nextIndex = matchIndex + 1
      if (nextIndex < fixtures.length && nextIndex >= revealedCount) {
        setRevealedCount(nextIndex + 1)
        setExpandedIndex(nextIndex)
      }
    }
  }

  const progressPct = Math.round((filledCount / fixtures.length) * 100)

  // Suppress unused import warning — TEAMS is used in MatchRow but imported here for completeness
  void TEAMS

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <div>
            <h2 className="font-bold text-wcp-text text-base">Grupo {groupId}</h2>
            <span className="text-xs text-wcp-muted tabular-nums" data-testid="modal-progress">{filledCount}/{fixtures.length}</span>
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
          {fixtures.slice(0, revealedCount).map((match, idx) => {
            const isFilled = scores[match.id] !== undefined
            const isExpanded = idx === expandedIndex
            const isCompact = isFilled && !isExpanded

            if (isCompact) {
              return (
                <div key={match.id} className="animate-slideDown">
                  <MatchRow
                    match={match}
                    homeScore={scores[match.id]?.home}
                    awayScore={scores[match.id]?.away}
                    onScoreChange={handleScoreChange}
                    compact
                    onClick={() => setExpandedIndex(idx)}
                  />
                </div>
              )
            }

            return (
              <div key={match.id} className="animate-slideDown">
                <MatchRow
                  match={match}
                  homeScore={scores[match.id]?.home}
                  awayScore={scores[match.id]?.away}
                  onScoreChange={handleScoreChange}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
