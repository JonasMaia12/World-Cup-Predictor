import { GroupGrid } from '@/components/groups/GroupGrid'
import { useShareLink } from '@/hooks/useShareLink'
import { useStore } from '@/store'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon mark */}
      <div className="w-9 h-9 rounded-lg bg-wcp-primary flex items-center justify-center shrink-0">
        <span className="font-display font-black text-sm text-white leading-none">WC</span>
      </div>

      {/* Wordmark */}
      <div>
        <div className="font-display font-bold text-sm text-white leading-tight tracking-wide">
          World Cup Predictor
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1 h-1 rounded-full bg-wcp-primary" />
          <span className="text-[8px] tracking-wide text-white/50">FIFA 2026</span>
          <div className="w-1 h-1 rounded-full bg-wcp-primary opacity-40" />
          <span className="text-[8px] tracking-wide text-white/50">48 seleções</span>
        </div>
      </div>
    </div>
  )
}

function ResetAllButton() {
  const resetAll = useStore((s) => s.resetAll)

  const handleClick = () => {
    if (window.confirm('Tens a certeza? Todos os resultados serão apagados.')) {
      resetAll()
    }
  }

  return (
    <button
      onClick={handleClick}
      data-testid="reset-all-btn"
      title="Limpar todos os resultados"
      className="flex items-center gap-1.5 border border-red-400/40 text-red-400 text-xs font-semibold rounded-lg px-2.5 py-1.5 sm:px-3 transition-opacity hover:opacity-75 active:opacity-50"
    >
      {/* Trash icon */}
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
      <span className="hidden sm:inline">Limpar</span>
    </button>
  )
}

function SimulateButton() {
  const simulateMissing = useStore((s) => s.simulateMissing)
  return (
    <button
      onClick={simulateMissing}
      data-testid="simulate-button"
      title="Preenche apenas os jogos em branco com simulação automática"
      className="flex items-center gap-1.5 border border-wcp-primary/50 text-wcp-primary text-xs font-semibold rounded-lg px-2.5 py-1.5 sm:px-3 transition-opacity hover:opacity-75 active:opacity-50"
    >
      {/* Dice icon */}
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
        <circle cx="8"  cy="8"  r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8"  r="1.2" fill="currentColor" stroke="none" />
        <circle cx="8"  cy="16" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <span className="hidden sm:inline">Simular</span>
    </button>
  )
}

function ShareButton() {
  const { share, copied } = useShareLink()
  return (
    <button
      onClick={share}
      data-testid="share-button"
      title="Compartilhar previsão"
      className="flex items-center gap-1.5 bg-wcp-primary text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 sm:px-3 transition-opacity hover:opacity-90 active:opacity-75"
    >
      {copied ? (
        /* Check icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        /* Share / arrow-up-from-bracket icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
      <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
    </button>
  )
}

export function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-wcp-bg text-wcp-text">
      <header className="flex items-center justify-between px-4 py-0 h-14 bg-wcp-text border-b-2 border-wcp-primary sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-2">
          <ResetAllButton />
          <SimulateButton />
          <ShareButton />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <GroupGrid />
      </main>
    </div>
  )
}
