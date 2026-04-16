import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { AppShell } from '@/components/layout/AppShell'
import { useStore } from '@/store'
import { decodeState } from '@/lib/share'
import './index.css'

// If URL contains ?s=, restore bracket state before mounting React.
// URL takes priority over LocalStorage (persist).
const sharedScores = decodeState(window.location.search)
if (sharedScores) {
  useStore.getState().setScores(sharedScores)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  </StrictMode>
)
