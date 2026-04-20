import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BracketView } from './BracketView'
import type { Bracket } from '@/engine/types'

function makeEmptyBracket(): Bracket {
  const emptyMatch = (id: string) => ({ id, home: null, away: null })
  return {
    roundOf32:     Array.from({ length: 16 }, (_, i) => emptyMatch(`r32-${i + 1}`)),
    roundOf16:     Array.from({ length: 8 },  (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 4 },  (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals:    Array.from({ length: 2 },  (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace:    emptyMatch('3rd'),
    final:         emptyMatch('final'),
  }
}

describe('BracketView', () => {
  it('renders round labels', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    expect(screen.getAllByText('Oitavas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Final').length).toBeGreaterThan(0)
  })

  it('shows minimap on mobile view by switching round', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    const minimapBtn = screen.getByTestId('minimap-quarterFinals')
    fireEvent.click(minimapBtn)
    expect(screen.getByTestId('round-quarterFinals')).toBeInTheDocument()
  })

  it('renders bracket-match elements', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    expect(screen.getAllByTestId(/bracket-match/).length).toBeGreaterThan(0)
  })

  it('shows champion banner when champion prop is provided', () => {
    render(<BracketView bracket={makeEmptyBracket()} champion="ARG" />)
    expect(screen.getByTestId('champion-banner')).toBeInTheDocument()
  })

  it('does not show champion banner when champion is null', () => {
    render(<BracketView bracket={makeEmptyBracket()} champion={null} />)
    expect(screen.queryByTestId('champion-banner')).toBeNull()
  })

  it('calls onMatchClick when a bracket match card is clicked', () => {
    const onMatchClick = vi.fn()
    render(<BracketView bracket={makeEmptyBracket()} onMatchClick={onMatchClick} />)
    const cards = screen.getAllByTestId(/bracket-match-/)
    fireEvent.click(cards[0])
    expect(onMatchClick).toHaveBeenCalledTimes(1)
  })
})
