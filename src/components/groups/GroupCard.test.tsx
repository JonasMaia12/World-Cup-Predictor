import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupCard } from './GroupCard'

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ scores: {} })
  ),
}))

vi.mock('@/engine/classifier', () => ({
  classifyGroup: () => [
    { teamCode: 'MEX', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'RSA', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'KOR', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    { teamCode: 'CZE', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
  ],
}))

vi.mock('@/data/wc2026', () => ({
  GROUPS: [{ id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] }],
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

describe('GroupCard', () => {
  it('renders group name', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('GRUPO A')).toBeInTheDocument()
  })

  it('renders all 4 team codes in standings', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.getByText('KOR')).toBeInTheDocument()
    expect(screen.getByText('CZE')).toBeInTheDocument()
  })

  it('shows progress as 0/6 when no scores', () => {
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('0/6')).toBeInTheDocument()
  })

  it('shows progress as 6/6 when all matches scored', async () => {
    const { useStore } = await import('@/store')
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({
        scores: {
          A1: { home: 1, away: 0 },
          A2: { home: 0, away: 0 },
          A3: { home: 2, away: 1 },
          A4: { home: 0, away: 1 },
          A5: { home: 3, away: 0 },
          A6: { home: 1, away: 1 },
        },
      })) as never)
    render(<GroupCard groupId="A" onClick={vi.fn()} />)
    expect(screen.getByText('6/6')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<GroupCard groupId="A" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
