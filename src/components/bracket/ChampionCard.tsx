import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Bracket } from '@/engine/types'
import { TEAMS } from '@/data/wc2026'
import { useStore } from '@/store'
import { useShareLink } from '@/hooks/useShareLink'

interface JourneyStep {
  roundLabel: string
  opponent: string | null
  scoreHome: number | null
  scoreAway: number | null
  championIsHome: boolean
}

const ROUND_ORDER: Array<{ key: keyof Omit<Bracket, 'thirdPlace'>; label: string }> = [
  { key: 'roundOf32',     label: 'Rodada de 32' },
  { key: 'roundOf16',     label: 'Oitavas de Final' },
  { key: 'quarterFinals', label: 'Quartas de Final' },
  { key: 'semiFinals',    label: 'Semifinais' },
  { key: 'final',        label: 'Final' },
]

function buildJourney(champion: string, bracket: Bracket, scores: Record<string, { home: number; away: number }>): JourneyStep[] {
  const steps: JourneyStep[] = []
  for (const { key, label } of ROUND_ORDER) {
    const matches = key === 'final' ? [bracket.final] : (bracket[key] as import('@/engine/types').BracketMatch[])
    const match = matches.find((m) => m.home === champion || m.away === champion)
    if (!match) continue
    const isHome = match.home === champion
    const score = scores[match.id] ?? null
    steps.push({
      roundLabel: label,
      opponent: isHome ? match.away : match.home,
      scoreHome: score ? (isHome ? score.home : score.away) : null,
      scoreAway: score ? (isHome ? score.away : score.home) : null,
      championIsHome: isHome,
    })
  }
  return steps
}

// Decorative sparkle dots
function Sparkles() {
  const positions = [
    { top: '8%',  left: '6%',  delay: '0ms',    size: 14 },
    { top: '12%', left: '88%', delay: '120ms',   size: 10 },
    { top: '82%', left: '5%',  delay: '240ms',   size: 12 },
    { top: '78%', left: '91%', delay: '80ms',    size: 10 },
    { top: '45%', left: '2%',  delay: '200ms',   size: 8  },
    { top: '50%', left: '96%', delay: '160ms',   size: 8  },
  ]
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none text-wcp-primary animate-sparkle"
          style={{ top: p.top, left: p.left, animationDelay: p.delay, fontSize: p.size }}
        >
          ✦
        </span>
      ))}
    </>
  )
}

interface ChampionCardProps {
  champion: string
  bracket: Bracket
}

export function ChampionCard({ champion, bracket }: ChampionCardProps) {
  const scores = useStore((s) => s.scores)
  const { share, copied } = useShareLink()
  const [open, setOpen] = useState(true)
  const [visible, setVisible] = useState(false)

  // Auto-open and trigger entry animation when champion changes
  useEffect(() => {
    setOpen(true)
    setVisible(false)
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [champion])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const team = TEAMS.find((t) => t.code === champion)
  const journey = buildJourney(champion, bracket, scores)

  const trigger = (
    <button
      data-testid="champion-card"
      onClick={() => { setOpen(true); setVisible(true) }}
      className="mx-auto my-4 flex items-center gap-2 px-5 py-2.5 rounded-full
        border-2 border-wcp-primary bg-wcp-surface shadow-sm
        text-sm font-bold text-wcp-primary hover:bg-wcp-primary-faint transition-colors"
    >
      <span className="text-lg">{team?.flag ?? '🏆'}</span>
      <span>{team?.name ?? champion} — Campeão</span>
    </button>
  )

  const modal = createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div
        className={`relative z-10 w-full sm:max-w-md mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto
          rounded-t-2xl sm:rounded-2xl overflow-hidden border-2 border-wcp-primary
          bg-gradient-to-b from-wcp-surface to-wcp-surface-subtle shadow-xl
          transition-opacity duration-100
          ${visible ? 'animate-championEntry' : 'opacity-0'}`}
      >
        <Sparkles />

        {/* Close button */}
        <button
          data-testid="champion-modal-close"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-wcp-primary-faint
            flex items-center justify-center text-wcp-muted text-lg transition-colors"
        >
          ×
        </button>

        {/* Top strip */}
        <div className="bg-wcp-primary px-4 py-2 flex items-center justify-center gap-2">
          <span className="text-white text-[11px] font-bold tracking-[3px] uppercase">
            Campeão do Mundo 2026
          </span>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center pt-5 pb-3 gap-1">
          <span className="text-6xl animate-pulse2">{team?.flag ?? '🏳'}</span>
          <span className="text-3xl font-black text-wcp-text mt-1 tracking-wide">
            {team?.name ?? champion}
          </span>
          <span className="text-wcp-primary text-sm font-semibold tracking-widest uppercase">
            {champion}
          </span>
        </div>

        {/* Journey */}
        {journey.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[10px] text-wcp-muted tracking-[2px] uppercase text-center mb-2">
              Trajetória
            </p>
            <div className="flex flex-col gap-1.5">
              {journey.map((step, i) => {
                const opponentTeam = step.opponent ? TEAMS.find((t) => t.code === step.opponent) : null
                const hasScore = step.scoreHome !== null
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-wcp-surface rounded-xl px-3 py-2 border border-wcp-border"
                  >
                    <span className="text-[10px] text-wcp-muted w-24 shrink-0">{step.roundLabel}</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      {step.opponent ? (
                        <>
                          <span className="text-sm">{opponentTeam?.flag}</span>
                          <span className="text-xs font-semibold text-wcp-text">{step.opponent}</span>
                        </>
                      ) : (
                        <span className="text-xs text-wcp-muted">A definir</span>
                      )}
                    </div>
                    <div className="w-14 text-right shrink-0">
                      {hasScore ? (
                        <span className="text-xs font-bold text-wcp-primary tabular-nums">
                          {step.scoreHome} – {step.scoreAway}
                        </span>
                      ) : (
                        <span className="text-xs text-wcp-muted">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="px-4 pb-6 flex justify-center">
          <button
            data-testid="champion-share-button"
            onClick={share}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wcp-primary text-white
              text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            {copied ? '✓ Link copiado!' : '🔗 Partilhar trajetória'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )

  return (
    <>
      {trigger}
      {open && modal}
    </>
  )
}
