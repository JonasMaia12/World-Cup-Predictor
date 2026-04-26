import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store'
import { TEAMS } from '@/data/wc2026'
import type { BracketMatch } from '@/engine/types'
import { cn } from '@/lib/utils'

type Mode = 'exact' | 'winner'

interface KnockoutMatchModalProps {
  match: BracketMatch
  roundLabel: string
  onClose: () => void
}

function Stepper({
  value,
  onIncrement,
  onDecrement,
  testIdPlus,
  testIdMinus,
  testIdValue,
}: {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  testIdPlus: string
  testIdMinus: string
  testIdValue: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        data-testid={testIdPlus}
        onClick={onIncrement}
        className="w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none"
      >
        +
      </button>
      <span
        data-testid={testIdValue}
        className="text-xl font-bold text-wcp-text min-w-[28px] text-center tabular-nums"
      >
        {value}
      </span>
      <button
        data-testid={testIdMinus}
        onClick={onDecrement}
        disabled={value === 0}
        className={cn(
          'w-7 h-7 rounded-full bg-wcp-primary-faint border border-wcp-primary-light text-wcp-primary font-bold text-base flex items-center justify-center leading-none',
          value === 0 && 'opacity-30 cursor-not-allowed',
        )}
      >
        −
      </button>
    </div>
  )
}

export function KnockoutMatchModal({ match, roundLabel, onClose }: KnockoutMatchModalProps) {
  const scores = useStore((s) => s.scores)
  const setScore = useStore((s) => s.setScore)
  const clearScore = useStore((s) => s.clearScore)
  const simulateKnockoutWinner = useStore((s) => s.simulateKnockoutWinner)

  const existing = scores[match.id]
  const [mode, setMode] = useState<Mode>('winner')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
  const [homeGoals, setHomeGoals] = useState(existing?.home ?? 1)
  const [awayGoals, setAwayGoals] = useState(existing?.away ?? 0)

  const homeTeam = TEAMS.find((t) => t.code === match.home)
  const awayTeam = TEAMS.find((t) => t.code === match.away)
  const isTie = homeGoals === awayGoals

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-wcp-surface rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wcp-border shrink-0">
          <h2 className="font-bold text-wcp-text text-base">{roundLabel}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-wcp-surface-subtle hover:bg-wcp-primary-faint flex items-center justify-center text-wcp-muted transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Null slot warning */}
          {!match.home || !match.away ? (
            <p className="text-center text-wcp-muted text-sm py-4">
              Aguarda resultado anterior
            </p>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-wcp-border text-xs font-semibold">
                <button
                  data-testid="mode-exact"
                  onClick={() => setMode('exact')}
                  className={cn(
                    'flex-1 py-2 transition-colors',
                    mode === 'exact'
                      ? 'bg-wcp-primary text-white'
                      : 'text-wcp-muted hover:bg-wcp-primary-faint',
                  )}
                >
                  Placar exato
                </button>
                <button
                  data-testid="mode-winner"
                  onClick={() => setMode('winner')}
                  className={cn(
                    'flex-1 py-2 transition-colors',
                    mode === 'winner'
                      ? 'bg-wcp-primary text-white'
                      : 'text-wcp-muted hover:bg-wcp-primary-faint',
                  )}
                >
                  Só o vencedor
                </button>
              </div>

              {mode === 'exact' ? (
                <>
                  {/* Stepper score entry */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-3xl">{homeTeam?.flag}</span>
                      <span className="text-xs font-semibold text-wcp-text">{match.home}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stepper
                        value={homeGoals}
                        onIncrement={() => setHomeGoals((v) => v + 1)}
                        onDecrement={() => setHomeGoals((v) => Math.max(0, v - 1))}
                        testIdPlus={`home-plus-${match.id}`}
                        testIdMinus={`home-minus-${match.id}`}
                        testIdValue={`score-home-${match.id}`}
                      />
                      <span className="text-wcp-primary font-bold px-1">×</span>
                      <Stepper
                        value={awayGoals}
                        onIncrement={() => setAwayGoals((v) => v + 1)}
                        onDecrement={() => setAwayGoals((v) => Math.max(0, v - 1))}
                        testIdPlus={`away-plus-${match.id}`}
                        testIdMinus={`away-minus-${match.id}`}
                        testIdValue={`score-away-${match.id}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-3xl">{awayTeam?.flag}</span>
                      <span className="text-xs font-semibold text-wcp-text">{match.away}</span>
                    </div>
                  </div>

                  {isTie && (
                    <p className="text-xs text-red-500 text-center">
                      Empate inválido — defina um vencedor
                    </p>
                  )}

                  <button
                    data-testid={`confirm-${match.id}`}
                    disabled={isTie}
                    onClick={() => {
                      setScore(match.id, homeGoals, awayGoals)
                      onClose()
                    }}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      isTie
                        ? 'bg-red-100 border border-red-300 text-red-400 cursor-not-allowed'
                        : 'bg-wcp-primary text-white hover:opacity-90',
                    )}
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                /* Winner-only mode */
                <div className="flex gap-3">
                  <button
                    data-testid={`winner-${match.home}`}
                    onClick={() => {
                      simulateKnockoutWinner(match.id, match.home!, match.away!, match.home!)
                      onClose()
                    }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border border-wcp-border hover:border-wcp-primary hover:bg-wcp-primary-faint transition-colors"
                  >
                    <span className="text-3xl">{homeTeam?.flag}</span>
                    <span className="text-sm font-bold text-wcp-text">{match.home}</span>
                  </button>
                  <button
                    data-testid={`winner-${match.away}`}
                    onClick={() => {
                      simulateKnockoutWinner(match.id, match.home!, match.away!, match.away!)
                      onClose()
                    }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border border-wcp-border hover:border-wcp-primary hover:bg-wcp-primary-faint transition-colors"
                  >
                    <span className="text-3xl">{awayTeam?.flag}</span>
                    <span className="text-sm font-bold text-wcp-text">{match.away}</span>
                  </button>
                </div>
              )}

              {/* Clear score */}
              {existing && (
                <button
                  data-testid={`clear-score-${match.id}`}
                  onClick={() => {
                    clearScore(match.id)
                    onClose()
                  }}
                  className="text-xs text-wcp-muted hover:text-wcp-text py-1 transition-colors text-center"
                >
                  Limpar placar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
