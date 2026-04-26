import { useState } from 'react'
import { useStore } from '@/store'
import { GROUPS, TEAMS } from '@/data/wc2026'
import { cn } from '@/lib/utils'

interface GroupPositionPickerProps {
  groupId: string
  onClose: () => void
}

export function GroupPositionPicker({ groupId, onClose }: GroupPositionPickerProps) {
  const thirdQualifiers = useStore((s) => s.thirdQualifiers)
  const pickGroupOrder = useStore((s) => s.pickGroupOrder)
  const addThirdQualifier = useStore((s) => s.addThirdQualifier)
  const removeThirdQualifier = useStore((s) => s.removeThirdQualifier)

  const group = GROUPS.find((g) => g.id === groupId)!
  const [order, setOrder] = useState<string[]>([...group.teams])

  const isThirdQualified = thirdQualifiers.includes(groupId)
  const poolFull = thirdQualifiers.length >= 8 && !isThirdQualified

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    if (idx === order.length - 1) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const handleSimulate = () => {
    pickGroupOrder(groupId, order)
    onClose()
  }

  const handleToggleThird = () => {
    if (isThirdQualified) {
      removeThirdQualifier(groupId)
    } else {
      addThirdQualifier(groupId)
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4 border-t border-wcp-border bg-wcp-surface-subtle">
      <span className="text-[10px] tracking-[2px] uppercase font-semibold text-wcp-primary">
        Definir classificação — Grupo {groupId}
      </span>

      <div className="flex flex-col gap-1">
        {order.map((code, idx) => {
          const team = TEAMS.find((t) => t.code === code)
          const isThirdSlot = idx === 2
          return (
            <div
              key={code}
              data-testid={`position-row-${idx}`}
              data-team={code}
              className="flex items-center gap-2 bg-wcp-surface rounded-lg px-3 py-2"
            >
              <span className="text-xs text-wcp-muted w-4">{idx + 1}.</span>
              <span className="text-base">{team?.flag}</span>
              <span className="text-sm font-semibold text-wcp-text flex-1">{code}</span>

              {isThirdSlot && (
                <button
                  data-testid={`toggle-third-${groupId}`}
                  disabled={poolFull}
                  onClick={handleToggleThird}
                  className={cn(
                    'text-[11px] font-semibold px-2 py-1 rounded-full transition-colors border',
                    isThirdQualified
                      ? 'bg-wcp-primary text-white border-wcp-primary'
                      : 'text-wcp-muted border-wcp-border hover:border-wcp-primary',
                    poolFull && 'opacity-40 cursor-not-allowed',
                  )}
                  title={poolFull ? 'Pool de 8 terceiros completo' : undefined}
                >
                  {isThirdQualified ? 'Qualifica' : 'Não qualifica'}
                </button>
              )}

              <div className="flex flex-col gap-0.5">
                <button
                  data-testid={`up-btn-${idx}`}
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-[11px] text-wcp-muted hover:text-wcp-primary disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <button
                  data-testid={`down-btn-${idx}`}
                  onClick={() => moveDown(idx)}
                  disabled={idx === order.length - 1}
                  className="text-[11px] text-wcp-muted hover:text-wcp-primary disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          data-testid="cancel-picker"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-wcp-border text-wcp-muted text-sm hover:bg-wcp-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          data-testid="simulate-order"
          onClick={handleSimulate}
          className="flex-1 py-2 rounded-xl bg-wcp-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Simular com esta ordem
        </button>
      </div>
    </div>
  )
}
