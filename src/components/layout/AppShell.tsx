import { Sidebar } from './Sidebar'
import { ContentArea } from './ContentArea'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-wcp-bg text-wcp-text">
      <Sidebar />
      <ContentArea />
    </div>
  )
}
