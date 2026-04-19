import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchModal } from './MatchModal'

const mockSetScore = vi.fn()
let mockScores: Record<string, { home: number; away: number }> = {}

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: mockScores, setScore: mockSetScore })
  ),
}))

vi.mock('@/data/wc2026', () => ({
  FIXTURES: [
    { id: 'A1', group: 'A', homeTeam: 'MEX', awayTeam: 'RSA', stage: 'group' },
    { id: 'A2', group: 'A', homeTeam: 'KOR', awayTeam: 'CZE', stage: 'group' },
    { id: 'A3', group: 'A', homeTeam: 'MEX', awayTeam: 'KOR', stage: 'group' },
    { id: 'A4', group: 'A', homeTeam: 'CZE', awayTeam: 'RSA', stage: 'group' },
    { id: 'A5', group: 'A', homeTeam: 'MEX', awayTeam: 'CZE', stage: 'group' },
    { id: 'A6', group: 'A', homeTeam: 'RSA', awayTeam: 'KOR', stage: 'group' },
  ],
  TEAMS: [
    { code: 'MEX', name: 'México', flag: '🇲🇽', group: 'A' },
    { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', group: 'A' },
    { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', group: 'A' },
    { code: 'CZE', name: 'Tchéquia', flag: '🇨🇿', group: 'A' },
  ],
}))

beforeEach(() => {
  mockScores = {}
  mockSetScore.mockClear()
})

describe('MatchModal', () => {
  it('renders group name in header', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
  })

  it('shows close button', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('modal-close')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<MatchModal groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('modal-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows progress 0/6 initially', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('0/6')).toBeInTheDocument()
  })

  it('shows first match expanded (steppers visible)', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
  })

  it('second match hidden before first is scored', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.queryByTestId('home-plus-A2')).not.toBeInTheDocument()
  })

  it('reveals second match after first is scored', async () => {
    const { useStore } = await import('@/store')
    const { rerender } = render(<MatchModal groupId="A" onClose={vi.fn()} />)

    fireEvent.click(screen.getByTestId('home-plus-A1'))
    expect(mockSetScore).toHaveBeenCalledWith('A1', 1, 0)

    // Simulate store update
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    rerender(<MatchModal groupId="A" onClose={vi.fn()} />)

    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
  })

  it('shows first match as compact after second is revealed', async () => {
    const { useStore } = await import('@/store')
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)

    // A1 should be compact (no steppers)
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    // A2 should be expanded (steppers visible)
    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
    // A1 shows check mark
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('re-expands a compact match when clicked', async () => {
    const { useStore } = await import('@/store')
    mockScores = { A1: { home: 1, away: 0 } }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)

    // A1 is compact — click it to re-expand using data-testid
    fireEvent.click(screen.getByTestId('compact-A1'))
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
  })

  it('shows progress 6/6 when all matches scored', async () => {
    const { useStore } = await import('@/store')
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore })) as never)
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })
})
