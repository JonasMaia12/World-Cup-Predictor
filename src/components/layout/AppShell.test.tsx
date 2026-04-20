import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import type { StoreState } from '@/store'
import { AppShell } from './AppShell'

vi.mock('@/store', () => ({ useStore: vi.fn() }))
vi.mock('@/hooks/useShareLink', () => ({
  useShareLink: () => ({ share: vi.fn(), copied: false }),
}))
// Prevent full component tree from rendering during AppShell header tests
vi.mock('@/components/groups/GroupGrid', () => ({ GroupGrid: () => null }))

const baseStore = {
  scores: {},
  thirdQualifiers: [],
  simulateMissing: vi.fn(),
  resetAll: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (sel: (s: StoreState) => unknown) => sel(store as unknown as StoreState),
  )
}

describe('AppShell — Limpar tudo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('renders "Limpar tudo" button', () => {
    render(<AppShell />)
    expect(screen.getByTestId('reset-all-btn')).toBeInTheDocument()
  })

  it('calls resetAll when user confirms the dialog', () => {
    const resetAll = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockStore({ resetAll })
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('reset-all-btn'))
    expect(resetAll).toHaveBeenCalled()
  })

  it('does NOT call resetAll when user cancels the dialog', () => {
    const resetAll = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockStore({ resetAll })
    render(<AppShell />)
    fireEvent.click(screen.getByTestId('reset-all-btn'))
    expect(resetAll).not.toHaveBeenCalled()
  })
})
