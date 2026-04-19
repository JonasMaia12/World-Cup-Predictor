import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchModal } from './MatchModal'
import { useStore, type StoreState } from '@/store'

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
  vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
    sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
  )
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

  it('shows all 6 matches on open (accordion — all visible)', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // First match expanded — steppers visible
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    // Remaining 5 matches collapsed — their compact rows are present
    expect(screen.getByTestId('compact-A2')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A3')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A4')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A5')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A6')).toBeInTheDocument()
  })

  it('clicking a collapsed match expands it and collapses the previous', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 starts expanded
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    // Click A2 compact row → A2 expands, A1 collapses
    fireEvent.click(screen.getByTestId('compact-A2'))
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.getByTestId('home-plus-A2')).toBeInTheDocument()
  })

  it('clicking the collapse header of the expanded match closes it', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 is expanded — collapse header button is visible
    fireEvent.click(screen.getByTestId('collapse-header-A1'))
    // A1 steppers gone — all matches now collapsed
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.getByTestId('compact-A1')).toBeInTheDocument()
  })

  it('collapse header closes a non-first expanded match', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // Open A3
    fireEvent.click(screen.getByTestId('compact-A3'))
    expect(screen.getByTestId('home-plus-A3')).toBeInTheDocument()
    // Collapse A3 via its header
    fireEvent.click(screen.getByTestId('collapse-header-A3'))
    expect(screen.queryByTestId('home-plus-A3')).not.toBeInTheDocument()
    expect(screen.getByTestId('compact-A3')).toBeInTheDocument()
  })

  it('incrementing score does not auto-advance to next match', () => {
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A1 expanded — click + on home score
    fireEvent.click(screen.getByTestId('home-plus-A1'))
    expect(mockSetScore).toHaveBeenCalledWith('A1', 1, 0)
    // A1 remains expanded, A2 remains collapsed
    expect(screen.getByTestId('home-plus-A1')).toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A2')).not.toBeInTheDocument()
  })

  it('opens last unfilled match when all previous are filled', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // A6 is the first unfilled → should be expanded
    expect(screen.getByTestId('home-plus-A6')).toBeInTheDocument()
  })

  it('all matches collapsed when all already scored on open', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    // No steppers visible
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A6')).not.toBeInTheDocument()
    // All compact rows present
    expect(screen.getByTestId('compact-A1')).toBeInTheDocument()
    expect(screen.getByTestId('compact-A6')).toBeInTheDocument()
  })

  it('shows progress 6/6 when all matches scored', () => {
    mockScores = {
      A1: { home: 1, away: 0 },
      A2: { home: 0, away: 0 },
      A3: { home: 2, away: 1 },
      A4: { home: 0, away: 1 },
      A5: { home: 3, away: 0 },
      A6: { home: 1, away: 1 },
    }
    vi.mocked(useStore).mockImplementation((sel: (s: StoreState) => unknown) =>
      sel({ scores: mockScores, setScore: mockSetScore } as unknown as StoreState)
    )
    render(<MatchModal groupId="A" onClose={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })
})
