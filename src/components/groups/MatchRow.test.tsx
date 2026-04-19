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

  it('renders current scores', () => {
    render(<MatchRow match={match} homeScore={2} awayScore={1} onScoreChange={vi.fn()} />)
    expect(screen.getByTestId('score-home-A1')).toHaveTextContent('2')
    expect(screen.getByTestId('score-away-A1')).toHaveTextContent('1')
  })

  it('shows 0 when score is undefined', () => {
    render(<MatchRow match={match} homeScore={undefined} awayScore={undefined} onScoreChange={vi.fn()} />)
    expect(screen.getByTestId('score-home-A1')).toHaveTextContent('0')
    expect(screen.getByTestId('score-away-A1')).toHaveTextContent('0')
  })

  it('increments home score when + clicked', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={1} awayScore={0} onScoreChange={onScoreChange} />)
    fireEvent.click(screen.getByTestId('home-plus-A1'))
    expect(onScoreChange).toHaveBeenCalledWith('A1', 2, 0)
  })

  it('decrements home score when − clicked', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={2} awayScore={1} onScoreChange={onScoreChange} />)
    fireEvent.click(screen.getByTestId('home-minus-A1'))
    expect(onScoreChange).toHaveBeenCalledWith('A1', 1, 1)
  })

  it('does not decrement below 0', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={0} awayScore={0} onScoreChange={onScoreChange} />)
    fireEvent.click(screen.getByTestId('home-minus-A1'))
    expect(onScoreChange).not.toHaveBeenCalled()
  })

  it('increments away score when + clicked', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={0} awayScore={0} onScoreChange={onScoreChange} />)
    fireEvent.click(screen.getByTestId('away-plus-A1'))
    expect(onScoreChange).toHaveBeenCalledWith('A1', 0, 1)
  })

  it('decrements away score when − clicked', () => {
    const onScoreChange = vi.fn()
    render(<MatchRow match={match} homeScore={0} awayScore={2} onScoreChange={onScoreChange} />)
    fireEvent.click(screen.getByTestId('away-minus-A1'))
    expect(onScoreChange).toHaveBeenCalledWith('A1', 0, 1)
  })
})

describe('MatchRow compact mode', () => {
  it('renders team codes and scores without steppers', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.queryByTestId('home-plus-A1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('away-plus-A1')).not.toBeInTheDocument()
  })

  it('renders check mark in compact mode', () => {
    render(
      <MatchRow
        match={match}
        homeScore={2}
        awayScore={1}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('calls onClick when compact row is clicked', () => {
    const onClick = vi.fn()
    render(
      <MatchRow
        match={match}
        homeScore={1}
        awayScore={0}
        onScoreChange={vi.fn()}
        compact
        onClick={onClick}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('compact without score shows em-dashes and chevron', () => {
    render(
      <MatchRow
        match={match}
        homeScore={undefined}
        awayScore={undefined}
        onScoreChange={vi.fn()}
        compact
      />
    )
    expect(screen.getByText('– × –')).toBeInTheDocument()
    expect(screen.getByText('›')).toBeInTheDocument()
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })
})
