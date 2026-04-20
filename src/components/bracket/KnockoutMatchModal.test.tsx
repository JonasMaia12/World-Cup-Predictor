import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import { KnockoutMatchModal } from './KnockoutMatchModal'
import type { BracketMatch } from '@/engine/types'

vi.mock('@/store', () => ({ useStore: vi.fn() }))

const baseStore = {
  scores: {} as Record<string, { home: number; away: number }>,
  setScore: vi.fn(),
  clearScore: vi.fn(),
  simulateKnockoutWinner: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (selector: (s: typeof store) => unknown) => selector(store),
  )
}

const filledMatch: BracketMatch = { id: 'r32-1', home: 'ARG', away: 'BRA' }
const nullMatch: BracketMatch = { id: 'r32-1', home: null, away: null }

describe('KnockoutMatchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('shows "Aguarda resultado anterior" when home slot is null', () => {
    render(<KnockoutMatchModal match={nullMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    expect(screen.getByText('Aguarda resultado anterior')).toBeInTheDocument()
  })

  it('renders both team codes when slots are filled', () => {
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    expect(screen.getAllByText('ARG').length).toBeGreaterThan(0)
    expect(screen.getAllByText('BRA').length).toBeGreaterThan(0)
  })

  it('confirm button is disabled when score is tied', () => {
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={vi.fn()} />)
    // Default 1-0. Make it 1-1 by incrementing away.
    fireEvent.click(screen.getByTestId('away-plus-r32-1'))
    expect(screen.getByTestId('confirm-r32-1')).toBeDisabled()
  })

  it('calls setScore and onClose when confirm clicked with non-tie score', () => {
    const setScore = vi.fn()
    const onClose = vi.fn()
    mockStore({ setScore })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    // Default 1-0 (non-tie)
    fireEvent.click(screen.getByTestId('confirm-r32-1'))
    expect(setScore).toHaveBeenCalledWith('r32-1', 1, 0)
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking winner button in winner-mode calls simulateKnockoutWinner and closes', () => {
    const simulateKnockoutWinner = vi.fn()
    const onClose = vi.fn()
    mockStore({ simulateKnockoutWinner })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('mode-winner'))
    fireEvent.click(screen.getByTestId('winner-ARG'))
    expect(simulateKnockoutWinner).toHaveBeenCalledWith('r32-1', 'ARG', 'BRA', 'ARG')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows "Limpar placar" when score exists and clearScore is called on click', () => {
    const clearScore = vi.fn()
    const onClose = vi.fn()
    mockStore({ scores: { 'r32-1': { home: 2, away: 1 } }, clearScore })
    render(<KnockoutMatchModal match={filledMatch} roundLabel="Oitavas" onClose={onClose} />)
    fireEvent.click(screen.getByText('Limpar placar'))
    expect(clearScore).toHaveBeenCalledWith('r32-1')
    expect(onClose).toHaveBeenCalled()
  })
})
