import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchRow } from './MatchRow'
import type { Match } from '@/data/wc2026'

const match: Match = {
  id: 'A1',
  group: 'A',
  homeTeam: 'MEX',
  awayTeam: 'RSA',
  stage: 'group',
}

describe('MatchRow', () => {
  it('renders home and away team codes', () => {
    render(<MatchRow match={match} homeScore={undefined} awayScore={undefined} onScoreChange={vi.fn()} />)
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
  })

  it('renders two number inputs', () => {
    render(<MatchRow match={match} homeScore={2} awayScore={1} onScoreChange={vi.fn()} />)
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveValue(2)
    expect(inputs[1]).toHaveValue(1)
  })

  it('calls onScoreChange with matchId and new values when home input changes', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={0} awayScore={0} onScoreChange={onScoreChange} />)
    const [homeInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(homeInput, { target: { value: '3' } })
    expect(onScoreChange).toHaveBeenCalledWith('A1', 3, 0)
  })

  it('calls onScoreChange with matchId and new values when away input changes', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={1} awayScore={0} onScoreChange={onScoreChange} />)
    const [, awayInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(awayInput, { target: { value: '2' } })
    expect(onScoreChange).toHaveBeenCalledWith('A1', 1, 2)
  })
})
