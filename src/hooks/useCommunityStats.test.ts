import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

vi.mock('@/db/client', () => ({
  getDbClient: vi.fn(),
}))

import { getDbClient } from '@/db/client'
import { useCommunityStats } from './useCommunityStats'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

const mockRows = [
  ['BRA', 42.5, 78.0, 90.0, 1000, '2026-04-18'],
  ['FRA', 15.2, 60.1, 82.3, 1000, '2026-04-18'],
]

describe('useCommunityStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when VITE_TURSO_URL is not set', async () => {
    vi.stubEnv('VITE_TURSO_URL', '')
    const { result } = renderHook(() => useCommunityStats(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeUndefined()
    vi.unstubAllEnvs()
  })

  it('returns stats when client resolves rows', async () => {
    vi.stubEnv('VITE_TURSO_URL', 'https://test.turso.io')
    const mockExecute = vi.fn().mockResolvedValue({ rows: mockRows })
    vi.mocked(getDbClient).mockReturnValue({ execute: mockExecute } as never)

    const { result } = renderHook(() => useCommunityStats(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0]).toEqual({
      teamCode: 'BRA',
      championPct: 42.5,
      top4Pct: 78.0,
      top8Pct: 90.0,
      totalVotes: 1000,
      updatedAt: '2026-04-18',
    })
    vi.unstubAllEnvs()
  })

  it('sets isError when client throws', async () => {
    vi.stubEnv('VITE_TURSO_URL', 'https://test.turso.io')
    const mockExecute = vi.fn().mockRejectedValue(new Error('network error'))
    vi.mocked(getDbClient).mockReturnValue({ execute: mockExecute } as never)

    const { result } = renderHook(() => useCommunityStats(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    vi.unstubAllEnvs()
  })
})
