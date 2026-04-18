import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

vi.mock('@/hooks/useCommunityStats', () => ({
  useCommunityStats: vi.fn(),
}))

import { useCommunityStats } from '@/hooks/useCommunityStats'
import { CommunityStatsBar } from './CommunityStats'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  return createElement(QueryClientProvider, { client: qc }, children)
}

const mockStats = [
  { teamCode: 'BRA', championPct: 42.5, top4Pct: 78, top8Pct: 90, totalVotes: 500, updatedAt: '2026-04-18' },
  { teamCode: 'FRA', championPct: 15.2, top4Pct: 60, top8Pct: 82, totalVotes: 500, updatedAt: '2026-04-18' },
  { teamCode: 'ARG', championPct: 12.0, top4Pct: 55, top8Pct: 78, totalVotes: 500, updatedAt: '2026-04-18' },
  { teamCode: 'ENG', championPct: 8.5,  top4Pct: 40, top8Pct: 65, totalVotes: 500, updatedAt: '2026-04-18' },
  { teamCode: 'ESP', championPct: 7.1,  top4Pct: 35, top8Pct: 60, totalVotes: 500, updatedAt: '2026-04-18' },
]

describe('CommunityStatsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_TURSO_URL', 'https://test.turso.io')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing when VITE_TURSO_URL is not set', () => {
    vi.unstubAllEnvs()
    vi.mocked(useCommunityStats).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never)
    const { container } = render(createElement(CommunityStatsBar), { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing on error or empty data', () => {
    vi.mocked(useCommunityStats).mockReturnValue({ data: [], isLoading: false, isError: false } as never)
    const { container } = render(createElement(CommunityStatsBar), { wrapper })
    expect(container.firstChild).toBeNull()
  })

  it('renders top 5 pills with team codes and percentages', () => {
    vi.mocked(useCommunityStats).mockReturnValue({ data: mockStats, isLoading: false, isError: false } as never)
    render(createElement(CommunityStatsBar), { wrapper })
    expect(screen.getByText('BRA')).toBeInTheDocument()
    expect(screen.getByText('42.5%')).toBeInTheDocument()
    expect(screen.getByText('ESP')).toBeInTheDocument()
    expect(screen.getByText('7.1%')).toBeInTheDocument()
  })

  it('renders rank badges 1–5', () => {
    vi.mocked(useCommunityStats).mockReturnValue({ data: mockStats, isLoading: false, isError: false } as never)
    render(createElement(CommunityStatsBar), { wrapper })
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
