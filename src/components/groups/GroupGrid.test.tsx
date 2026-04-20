import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupGrid } from './GroupGrid'

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: {}, thirdQualifiers: [] })
  ),
}))

vi.mock('@/engine/classifier', () => ({
  classifyGroup: () => [],
}))

vi.mock('@/engine/bracket-generator', () => ({
  generateBracket: () => ({
    roundOf32: Array.from({ length: 16 }, (_, i) => ({ id: `r32-${i + 1}`, home: null, away: null })),
    roundOf16: Array.from({ length: 16 }, (_, i) => ({ id: `r16-${i + 1}`, home: null, away: null })),
    quarterFinals: Array.from({ length: 8 }, (_, i) => ({ id: `qf-${i + 1}`, home: null, away: null })),
    semiFinals: Array.from({ length: 4 }, (_, i) => ({ id: `sf-${i + 1}`, home: null, away: null })),
    thirdPlace: { id: '3rd', home: null, away: null },
    final: { id: 'final', home: null, away: null },
  }),
  advanceWinner: () => null,
}))

vi.mock('@/data/wc2026', () => ({
  GROUPS: 'ABCDEFGHIJKL'.split('').map((id) => ({ id, teams: [] })),
  FIXTURES: [],
  TEAMS: [],
}))

vi.mock('./GroupCard', () => ({
  GroupCard: ({ groupId, onClick }: { groupId: string; onClick: () => void }) => (
    <button data-testid={`group-card-${groupId}`} onClick={onClick}>
      Grupo {groupId}
    </button>
  ),
}))

vi.mock('./MatchModal', () => ({
  MatchModal: ({ groupId, onClose }: { groupId: string; onClose: () => void }) => (
    <div data-testid={`modal-${groupId}`}>
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}))

describe('GroupGrid', () => {
  it('renders 12 group cards', () => {
    render(<GroupGrid />)
    for (const g of 'ABCDEFGHIJKL'.split('')) {
      expect(screen.getByTestId(`group-card-${g}`)).toBeInTheDocument()
    }
  })

  it('does not show modal initially', () => {
    render(<GroupGrid />)
    expect(screen.queryByTestId('modal-A')).not.toBeInTheDocument()
  })

  it('shows modal when a group card is clicked', () => {
    render(<GroupGrid />)
    fireEvent.click(screen.getByTestId('group-card-A'))
    expect(screen.getByTestId('modal-A')).toBeInTheDocument()
  })

  it('closes modal when onClose is called', () => {
    render(<GroupGrid />)
    fireEvent.click(screen.getByTestId('group-card-A'))
    fireEvent.click(screen.getByText('Fechar'))
    expect(screen.queryByTestId('modal-A')).not.toBeInTheDocument()
  })

  it('renders bracket section', () => {
    render(<GroupGrid />)
    expect(screen.getByText('FASE ELIMINATÓRIA')).toBeInTheDocument()
  })
})
