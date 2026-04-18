import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BracketView } from './BracketView'
import type { Bracket } from '@/engine/types'

function makeEmptyBracket(): Bracket {
  const emptyMatch = (id: string) => ({ id, home: null, away: null })
  return {
    roundOf32:     Array.from({ length: 16 }, (_, i) => emptyMatch(`r32-${i + 1}`)),
    roundOf16:     Array.from({ length: 16 }, (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 8 },  (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals:    Array.from({ length: 4 },  (_, i) => emptyMatch(`sf-${i + 1}`)),
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
})
