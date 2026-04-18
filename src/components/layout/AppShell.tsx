import { GroupAccordion } from '@/components/groups/GroupAccordion'
import { CommunityStatsBar } from '@/components/stats/CommunityStats'
import { useShareLink } from '@/hooks/useShareLink'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 shrink-0">
        <div className="w-9 h-9 rounded-full bg-wcp-surface-subtle border-2 border-wcp-primary flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="7" y="14" width="6" height="2" rx="0.5" fill="#00a854" />
            <rect x="5.5" y="16" width="9" height="1.5" rx="0.5" fill="#00a854" />
            <path
              d="M6 3 H14 V10 Q14 14 10 14 Q6 14 6 10 Z"
              fill="#00a854"
              fillOpacity="0.2"
              stroke="#00a854"
              strokeWidth="1.2"
            />
            <path d="M6 5 Q3 5 3 8 Q3 11 6 11" stroke="#00a854" strokeWidth="1.2" fill="none" />
            <path d="M14 5 Q17 5 17 8 Q17 11 14 11" stroke="#00a854" strokeWidth="1.2" fill="none" />
            <circle cx="10" cy="7.5" r="1.5" fill="#00a854" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 bg-wcp-primary text-white text-[6px] font-black w-[13px] h-[13px] rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
          26
        </div>
      </div>

      <div>
        <div className="font-bold text-sm text-wcp-text leading-tight">World Cup Predictor</div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1 h-1 rounded-full bg-wcp-primary" />
          <span className="text-[8px] tracking-wide text-wcp-muted">FIFA 2026</span>
          <div className="w-1 h-1 rounded-full bg-wcp-primary opacity-40" />
          <span className="text-[8px] tracking-wide text-wcp-muted">48 seleções</span>
        </div>
      </div>
    </div>
  )
}

function ShareButton() {
  const { share, copied } = useShareLink()
  return (
    <button
      onClick={share}
      data-testid="share-button"
      className="bg-wcp-primary text-white text-xs font-semibold rounded-full px-4 py-1.5 transition-opacity hover:opacity-90 active:opacity-75"
    >
      {copied ? 'Link copiado!' : '↗ Compartilhar'}
    </button>
  )
}

export function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-wcp-bg text-wcp-text">
      <header className="flex items-center justify-between px-4 py-3 bg-wcp-surface border-b border-wcp-border sticky top-0 z-10">
        <Logo />
        <ShareButton />
      </header>

      <CommunityStatsBar />

      <main className="flex-1 overflow-y-auto">
        <GroupAccordion />
      </main>
    </div>
  )
}
