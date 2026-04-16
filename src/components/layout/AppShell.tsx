import { Sidebar } from './Sidebar'
import { ContentArea } from './ContentArea'
import { ShareButton } from '@/components/share/ShareButton'

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-wcp-bg text-wcp-text">
      <header className="flex items-center justify-between px-4 py-2 border-b border-wcp-border shrink-0">
        <span className="text-wcp-gold font-bold tracking-wide text-sm">⚽ World Cup Predictor 2026</span>
        <ShareButton />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ContentArea />
      </div>
    </div>
  )
}
